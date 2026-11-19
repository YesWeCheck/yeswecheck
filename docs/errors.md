<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Errors · <a href="https://docs.yeswecheck.fr/uk/errors">Full documentation</a></sub>

# Error codes

An `invalid` verdict **is not an error**: a verification that completes always responds `200`, whatever the verdict. The codes below indicate a call that could not be processed.

## Format

All JSON errors have the same shape:

```json
{
  "statusCode": 402,
  "message": "Insufficient credits for SMTP validation",
  "code": "INSUFFICIENT_CREDITS",
  "timestamp": "2026-10-15T09:12:44.512Z",
  "path": "/v2/email/validate"
}
```

| Field | Present | Content |
|---|---|---|
| `statusCode` | always | HTTP code |
| `message` | always | Readable text, or an **array** of texts for a body validation error |
| `code` | sometimes | **Stable** machine code: this is the one to test |
| `details` | sometimes | Structured data related to the `code` |
| `timestamp`, `path` | always | Timestamp and path called |

Messages may be reworded; `code` values do not change. The `message` is in French by default: send `Accept-Language: en` (or `en-GB`) to receive it in English. Either way, always test the `code`, never the message. The only exception to the JSON format: the `429` from the per-IP rate limiter, in plain text.

## Summary

| HTTP | Stable code | Cause | Retry? |
|---|---|---|---|
| `400` | — | Invalid body or unknown field | No |
| `401` | — | Authentication missing, invalid or revoked | No |
| `402` | `INSUFFICIENT_CREDITS` | Balance used up for an SMTP check | After topping up |
| `403` | — | Key IP or origin restriction, widget captcha, blocked IP | No |
| `404` | — | Resource not found (widget does not exist or is disabled) | No |
| `413` | — | Request body too large | No |
| `429` | `API_KEY_RATE_LIMITED` | Key's call limit reached (minute, hour or day) | After `Retry-After` |
| `429` | `API_KEY_BUDGET_EXCEEDED` | Key's credit cap reached | After `Retry-After` |
| `429` | — | Rate limit (IP or widget), or too many concurrent requests | After `Retry-After`, or by reducing parallelism |
| `5xx` | — | Incident on our side | Yes, with an increasing delay |

MCP server tools return their errors in the tool result, with their own codes: see [AI assistants](../integrations/mcp/README.md#errors).

## Details

### `400` Bad Request

The body does not match the expected format. `message` is then an array:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "timestamp": "2026-10-15T09:12:44.512Z",
  "path": "/v2/email/validate"
}
```

Common causes:

- `email must be an email`: the value is not an address in the format the validator expects. To assess a doubtful input without an error, filter out empty values or values without an `@` before the call.
- `property xxx should not exist`: an unknown field was sent. The body of `POST /v2/email/validate` only accepts `email`, `smtp`, `enrichment`, `smtpTimeout` and `country` (plus the widget's internal fields).
- `smtpTimeout must not be less than 1000` or `greater than 30000`.

### `401` Unauthorized

| `message` | Cause |
|---|---|
| `No authorization header` | `Authorization` header missing, or key sent in `X-API-Key`, which is not read |
| `Invalid or revoked API key` | Unknown or revoked key, or old secret after a rotation whose grace period has ended |
| `Invalid authorization format` | Value that is neither a `ywc_live_` / `ywc_test_` key nor a valid session token |
| `Unauthorized` | Dashboard-only route called with an API key (batch processing, key management…) |

### `402` `INSUFFICIENT_CREDITS`

SMTP is enabled on the key and the organisation's balance is zero. The call is refused before any check and nothing is debited. Top up with a pack from **Credits**, or upgrade from Starter to Pro. See [Credits](credits.md#insufficient-balance-402).

### `403` Forbidden

| `message` | Cause |
|---|---|
| `Access denied: IP address not allowed for this API key` | The calling IP is not in `allowedIps` |
| `Access denied: Origin domain not allowed for this API key` | The `Origin` header is missing or outside `allowedDomains`. A server call sends no `Origin`: see [Authentication](authentication.md#ip-and-origin-restrictions) |
| `Access denied: IP address and origin domain are not allowed for this API key` | Both restrictions fail |
| `CAPTCHA token required for this widget` · `CAPTCHA verification failed` | Widget with a captcha called without a valid proof |
| `This request is blocked for this widget` | IP on the widget's blocklist |

Restriction refusals are logged and visible in the key's statistics.

### `413` Payload Too Large

The body exceeds the allowed size: 256 KB for a JSON body, 15 MB for a batch file. The call is refused before any processing.

```json
{ "statusCode": 413, "message": "request entity too large" }
```

A verification weighs only a few hundred bytes: a `413` almost always signals a badly built body (file sent as JSON, field duplicated in a loop). For a list of addresses, use [batch processing](guides/bulk-lists.md).

### `429` `API_KEY_RATE_LIMITED`

The key has reached its call limit (60 per minute, 1,000 per hour, 10,000 per day by default). The refused call is not billed.

```json
{
  "statusCode": 429,
  "message": "This key's call limit has been reached (60 per minute). Try again in 42 s.",
  "code": "API_KEY_RATE_LIMITED",
  "details": { "window": "minute", "limit": 60, "retryAfterSeconds": 42 },
  "timestamp": "2026-10-16T18:00:00.000Z",
  "path": "/v2/email/validate"
}
```

`details.window` is `minute`, `hour` or `day`. Wait for `Retry-After`. See [Rate limits](rate-limits.md#limits-per-api-key).

### `429` `API_KEY_BUDGET_EXCEEDED`

The key has reached its credit cap; the account itself may still have credit.

```json
{
  "statusCode": 429,
  "message": "This key's daily cap has been reached (500/500 credits). It resets at 00:00 UTC.",
  "code": "API_KEY_BUDGET_EXCEEDED",
  "details": { "window": "day", "limit": 500, "used": 500, "retryAfterSeconds": 21600 },
  "timestamp": "2026-10-15T18:00:00.000Z",
  "path": "/v2/email/validate"
}
```

`details.window` is `day` or `month`. Wait for `Retry-After`, or raise the cap in **API keys**. Topping up the balance makes no difference.

### `429` rate limit

- **Per IP** on `POST /v2/email/validate` (100/min) and on domain and typo suggestions (60/min): body in **plain text**, `RateLimit-*` and `Retry-After` headers. See [Rate limits](rate-limits.md).
- **Widget abuse protection**: `{"statusCode": 429, "message": "Too many requests for this widget", …}` with `Retry-After`.
- **Concurrent requests**: more than 100 requests in progress at the same time from the same IP. HTML response without `Retry-After`: reduce the number of parallel calls.

### `5xx`

An incident on our side. Retry once or twice with an increasing delay, check [status.yeswecheck.fr](https://status.yeswecheck.fr/uk), then switch to degraded mode: accept the address and re-verify it later.

## Troubleshoot

```bash
# Is the API responding?
curl https://api.yeswecheck.fr/health

# Is the key accepted? (free with a key without SMTP; 1 credit otherwise)
curl -i https://api.yeswecheck.fr/v2/email/validate \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

For any question to support ([contact@yeswecheck.fr](mailto:contact@yeswecheck.fr)), include the endpoint, the time of the call, the response body and, for a completed verification, its [`debug_ref`](response.md#debug-ref) reference. Never send your key.

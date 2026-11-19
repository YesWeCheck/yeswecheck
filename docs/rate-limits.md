<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Rate limits · <a href="https://docs.yeswecheck.fr/uk/rate-limits">Full documentation</a></sub>

# Rate limits

## Limits per endpoint

| Endpoint | Limit | Scope |
|---|---|---|
| `POST /v2/email/validate` | 100 requests per minute | per calling IP |
| `POST /v2/email/suggest/domain` · `suggest/typo-domain` | 60 requests per minute | per calling IP |
| `GET /v2/billing/catalog` | 120 requests per minute | per calling IP |
| `GET /v2/widget/config` | 120 requests per minute | per visitor IP |
| `POST /v2/widget/validate` | 60 requests per minute | per visitor IP, across all widgets |
| Widget (anti-abuse) | Limits per IP, per device and per day, configurable per widget | see [Widget](../integrations/widget/README.md#security-at-a-glance) |
| `POST /mcp` (MCP server) | 1,200 requests per minute | per calling IP |
| All routes | 100 requests **in progress at the same time** | per calling IP |

"Per IP" means the caller's public address: two separate clients each have their own quota, even if they go through the same network relay. IPv6 addresses in the same `/56` prefix share a quota.

<a id="limits-per-api-key"></a>

## Limits per API key

Each call authenticated with an API key is also counted **per key**, whatever the calling IP: `POST /v2/email/validate`, `POST /v2/email/enrich`, the suggestions, `POST /v2/widget/validate` and each request to the [MCP server](../integrations/mcp/README.md) (verifying a list with an immediate response also counts once per address). The widget uses the `widget` key linked to it, including for the suggestions shown while the user types.

| Window | Default limit |
|---|---|
| Minute | 60 calls |
| Hour | 1,000 calls |
| Day | 10,000 calls |

A rejected call is not counted in any window and is never charged. Need more? Write to support: these limits can be raised per organisation. Dashboard calls (signed-in session) are not affected.

Two caps that are not rate limits also apply:

- the **key's credit cap** (daily, monthly), if configured: see [Authentication](authentication.md#credit-caps);
- the **organisation's balance** for SMTP: see [Credits](credits.md).

## Headers

`POST /v2/email/validate` and the two suggestion endpoints (`suggest/domain`, `suggest/typo-domain`) return the headers from the IETF *RateLimit* specification (draft-6 version):

```http
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 42
```

| Header | Content |
|---|---|
| `RateLimit-Policy` | Quota and window in seconds |
| `RateLimit-Limit` | Requests allowed in the window |
| `RateLimit-Remaining` | Requests remaining |
| `RateLimit-Reset` | **Seconds** until the reset (not a timestamp) |

## The `429` response

Limit exceeded: `429 Too Many Requests` with a `Retry-After` header in seconds. Note that the body depends on which limit was reached:

| Limit | Body |
|---|---|
| Rate per IP (validate, widget) | **Plain text**: `Too many requests from this IP, please try again later` |
| Key's call limit | JSON, `code: "API_KEY_RATE_LIMITED"`, window reached in `details` |
| Key's credit cap | JSON, `code: "API_KEY_BUDGET_EXCEEDED"`, details in `details` |
| Widget anti-abuse | JSON, `message: "Too many requests for this widget"` |
| Concurrent requests (more than 100 in progress) | HTML page, **without** `Retry-After`: reduce the number of parallel calls |

Always read `Retry-After` and wait at least that long:

```js
async function validateWithRetry(email, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch('https://api.yeswecheck.fr/v2/email/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.YWC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (res.status !== 429) return res;

    const wait = Number(res.headers.get('retry-after') ?? 60);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
  throw new Error('YesWeCheck rate limit still reached');
}
```

Beyond a few hundred addresses at once, use [bulk processing](guides/bulk-lists.md) rather than a loop of calls.

## Size limits

| Item | Limit |
|---|---|
| JSON body of a request | 256 KB (beyond that: `413`); 2 MB for `/mcp` |
| `suggest/typo-domain` input | 320 characters (beyond that: `400`) |
| `smtpTimeout` | 1,000 to 30,000 ms |
| `country` | 2 or 3 letters (ISO 3166-1) |
| Bulk processing file | 15 MB, 500,000 lines, CSV or TXT |
| Key restrictions | At most 20 IPs and 20 domains |

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Examples</a> › curl</sub>

# curl

Every endpoint from a terminal. Set your key once:

```bash
export YWC_API_KEY=ywc_live_…   # free key: https://app.yeswecheck.fr/uk/register?src=github-curl
```

All requests send `Accept-Language: en-GB` so that error messages are in English.

## Verify an address

```bash
curl -s https://api.yeswecheck.fr/v2/email/validate \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Accept-Language: en-GB" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane.doe@company.co.uk"}'
```

```jsonc
{
  "result": "valid",            // valid | risky | invalid | unknown: branch on this
  "score": 100,
  "disposable": false,
  "finalDecision": "accepted",  // your key's policy, "accepted" when there is none
  "features": { "syntax": { … }, "dns": { … }, "smtp": { "reasonCode": "MAILBOX_EXISTS", … } },
  "metadata": { "credits": { "used": 1, "remaining": 99 } }
}
```

1 credit if your key has the mailbox check (SMTP) **and** the verdict is not `unknown`. Every other request on this page is free.

Only the verdict, with [jq](https://jqlang.org):

```bash
curl -s https://api.yeswecheck.fr/v2/email/validate \
  -H "Authorization: Bearer $YWC_API_KEY" -H "Content-Type: application/json" \
  -d '{"email":"jane.doe@company.co.uk"}' | jq -r .result
```

## Fix a typo

```bash
curl -s https://api.yeswecheck.fr/v2/email/suggest/typo-domain \
  -H "Authorization: Bearer $YWC_API_KEY" -H "Content-Type: application/json" \
  -d '{"email":"jane@gmial.com"}' | jq '{detected, suggestedEmail}'
```

```json
{ "detected": true, "suggestedEmail": "jane@gmail.com" }
```

## Suggest domains while the user types

```bash
curl -s https://api.yeswecheck.fr/v2/email/suggest/domain \
  -H "Authorization: Bearer $YWC_API_KEY" -H "Content-Type: application/json" \
  -d '{"partial":"ho","country":"GB","count":3}' | jq -r '.suggestions[].domain'
```

## Check your balance and key

```bash
curl -s https://api.yeswecheck.fr/v2/me -H "Authorization: Bearer $YWC_API_KEY" | jq '{balance: .credits.balance, smtp: .apiKey.smtpEnabled}'
```

## Read the rate limit

```bash
curl -s -D - -o /dev/null https://api.yeswecheck.fr/v2/email/validate \
  -H "Authorization: Bearer $YWC_API_KEY" -H "Content-Type: application/json" \
  -d '{"email":"jane.doe@company.co.uk"}' | grep -i '^ratelimit'
```

`RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` tell you where you stand. See [rate limits](../../docs/rate-limits.md).

## When something goes wrong

```bash
curl -s https://api.yeswecheck.fr/v2/me -H "Authorization: Bearer ywc_live_wrong" -H "Accept-Language: en-GB"
```

```json
{ "statusCode": 401, "message": "Invalid or revoked API key", "code": "UNAUTHORIZED" }
```

Branch on `code`, not on `message`. Some `429` answers are plain text: read the body as text before decoding it. Every code is in [errors](../../docs/errors.md).

## More

- Every request in [Postman, Bruno or your editor](../../tools/).
- The [OpenAPI specification](../../openapi/) describes every field.

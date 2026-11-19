<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Docs</a> › Production checklist · <a href="https://docs.yeswecheck.fr/uk">Full documentation</a></sub>

# Go to production

## Checklist

- [ ] The production key is in an environment variable or a secrets vault, never in the code.
- [ ] A separate key per application and per environment.
- [ ] Server keys restricted by IP when your outbound IPs are fixed.
- [ ] A daily credit cap on every key with SMTP.
- [ ] `network` check disabled on server keys (it would analyse your own server).
- [ ] A suitable client timeout (see below).
- [ ] Degraded mode: if the API is unavailable, your users can still sign up.
- [ ] `401`, `402` and `403` errors trigger an alert on your side: they need human action.
- [ ] `metadata.requestId` is logged with the verified address.
- [ ] Balance alerts are enabled (**Settings → Notifications**).

## Timeouts

| Call | Recommended client timeout |
|---|---|
| `POST /v2/email/validate`, key without SMTP | 10 s |
| `POST /v2/email/validate`, key with SMTP | 30 s |
| Suggestion and enrichment endpoints | 5 s |

Most responses arrive much faster. The long timeout protects against slow mail servers, whose response often ends up as `unknown`.

## Retries

| Situation | Retry? |
|---|---|
| `429` with `Retry-After` | Yes, after the number of seconds given |
| `500`, `502`, `503`, `504`, timeout | Yes, once or twice, with an increasing delay (2 s, then 8 s) |
| `400`, `401`, `402`, `403`, `404` | No: fix the call, the key or the balance |
| `unknown` verdict | Yes, later (a few minutes to a few hours): greylisting and slow servers often resolve themselves |

A repeated call is verified, and billed, again: don't automatically resend a call that succeeded.

## Caching

An address rarely changes state from one day to the next. Cache your results, with the address normalised to lower case as the key:

| Verdict | Reasonable duration |
|---|---|
| `valid` | 7 to 30 days |
| `invalid` | 7 to 30 days |
| `risky` | 7 days |
| `unknown` | No caching, or a few hours |

Your cache saves the network round trip and the credit.

## Throughput

`POST /v2/email/validate` accepts 100 requests per minute per IP. Beyond a few hundred addresses to process at once, use [batch processing](bulk-lists.md): it spreads the load across providers and produces a report. See [Rate limits](../rate-limits.md).

## Monitoring

- **Per-key statistics** in the dashboard: calls, errors, credits consumed, attempts refused by IP or origin restrictions.
- **Alerts**: low balance, balance used up, key cap at 50, 80 and 100%.
- **Platform status**: [status.yeswecheck.fr](https://status.yeswecheck.fr/uk), and `GET https://api.yeswecheck.fr/health` for your monitoring.

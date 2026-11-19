<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Credits · <a href="https://docs.yeswecheck.fr/uk/credits">Full documentation</a></sub>

# Credits and billing

Only the mailbox (SMTP) check uses a credit. Every other check is free, with no quota.

## The billing rule

A credit is used if, and only if, **both** conditions are met:

1. SMTP was enabled for the call (on the API key, the widget's key, or the bulk list option);
2. the final verdict is **not** `unknown`.

| Case | Credit |
|---|---|
| Key without SMTP | 0 |
| SMTP enabled, verdict `valid`, `risky` or `invalid` | 1 |
| SMTP enabled, `invalid` verdict reached before the mailbox check (bad syntax, domain without a mail server) | 1 |
| SMTP enabled, `unknown` verdict (accept-all domain, greylisting, timeout) | 0 |
| Address on your allowlist or blocklist | 0 (SMTP does not run) |
| Suggestion and enrichment endpoints | 0 |
| [Connectors](https://docs.yeswecheck.fr/uk/connectors) and [AI assistants (MCP)](https://docs.yeswecheck.fr/uk/connectors/mcp) | Same rules as above |

A verdict reached before the mailbox check is billed because it is final and usable: an address without a mail server will never receive mail.

## Plans and packs

- **Free plan**: 100 welcome credits on sign-up, no card required.
- **Monthly plans**: a monthly allowance, no commitment, no overage billing.
- **Credit packs**: from 1,000 to 5,000,000 credits, usable straight away, and they **never expire**.

Current prices: [yeswecheck.fr/uk/pricing](https://yeswecheck.fr/uk/pricing). The live catalogue is also public and machine-readable:

```bash
curl https://api.yeswecheck.fr/v2/billing/catalog
```

## Consumption order

Your balance can combine three kinds of credits, used from the most perishable to the most durable:

| Order | Source | Expiry |
|---|---|---|
| 1 | Monthly plan allowance | At renewal |
| 2 | Free credits (welcome credits, goodwill gestures) | Depends on the case |
| 3 | Purchased packs | Never |

## Track your balance

- **In every response** with SMTP: `metadata.credits.used` (0 or 1) and `metadata.credits.remaining` (balance after the call).
- **Through the API**: `GET /v2/me` returns your organisation's balance and the calling key's usage, free of charge.
- **In the dashboard**: balance, transaction history, invoices, and alerts (**Settings → Notifications**) when the balance runs low.

## Insufficient balance: `402`

When SMTP is requested and the balance is zero, the call is refused **before** any check:

```json
{
  "statusCode": 402,
  "message": "Insufficient credits for SMTP validation",
  "code": "INSUFFICIENT_CREDITS",
  "timestamp": "2026-10-15T09:12:44.512Z",
  "path": "/v2/email/validate"
}
```

Test `code`, not `message`. To keep verifying until you top up, keep a second key without SMTP as a fallback.

> [!NOTE]
> **Key cap: `429`, not `402`**
> If your organisation has credit but **the key** has reached its own daily or monthly cap, the response is `429 API_KEY_BUDGET_EXCEEDED`. See [Errors](errors.md#429-api_key_budget_exceeded).

<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Verdicts and score · <a href="https://docs.yeswecheck.fr/uk">Full documentation</a></sub>

# Verdicts and score

Each verification returns two complementary values: `result`, the verdict, and `score`, the confidence from 0 to 100. The verdict answers "can you write to this address?"; the score refines that answer.

## The four verdicts

| Verdict | Meaning |
|---|---|
| `valid` | The address is deliverable and no notable risk signal was found. |
| `risky` | The address is deliverable, but risky. |
| `invalid` | The address will not receive mail. |
| `unknown` | The mail server did not allow a conclusion. |

## How the verdict is reached

The rules apply in this order; the first one that matches wins.

| # | Situation | Verdict |
|---|---|---|
| 1 | Invalid syntax | `invalid` |
| 2 | Domain with no mail server (no MX, no usable A record, or null MX) | `invalid` |
| 3 | The SMTP server rejects the mailbox | `invalid` |
| 4 | Accept-all domain: the server accepts any address | `unknown` |
| 5 | Address on the organisation's blocklist | `invalid` |
| 6 | SMTP run and conclusive: mailbox confirmed | `valid` |
| 6a | SMTP run but inconclusive (greylisting, timeout, server unreachable) | `unknown` |
| 7 | SMTP not run (key without SMTP): syntax and DNS correct | `valid` |

Then three rules can downgrade the verdict to `risky`:

- the domain is **disposable**, **malicious** (phishing, scam, public blocklist) or a **trap** (typosquat): a `valid` becomes `risky`;
- the address is a **noreply** address (noreply@, no-reply@, donotreply@, mailer-daemon@…): a `valid` or an `unknown` becomes `risky`, because nobody reads that mailbox. A mailbox rejected by the server stays `invalid`, and an address on your allowlist is not downgraded;
- the **score** is below **70**, typically when several quality signals add up.

> [!NOTE]
> **Without SMTP, `valid` means "well formed and domain reachable"**
> A key without SMTP does not check whether the mailbox exists. A `valid` then means that the address is correct and that its domain receives mail, not that the mailbox exists. Enable SMTP on the key for confirmation.

## The score

The score starts at 100 and is reduced by anything that weakens the address:

- **Caps** on critical failures: invalid syntax, dead domain and rejected mailbox push the score very low.
- **Caution caps**: accept-all domain, unhealthy domain (weak DNS and mail configuration), domain reachable only through its A record without SMTP.
- **Quality penalties**, which add up: disposable, malicious or trap domain, role account, offensive term, random local part, typo in the domain. Each additional signal also lowers the cap.
- **SMTP confirmation**: a confirmed mailbox with no quality signal scores 100 (95 if the server announces forwarding).
- **Allowlist**: an address on the allowlist scores at least 95.

How to read it:

| Score | Reading |
|---|---|
| 90 – 100 | Safe address |
| 70 – 89 | Good address with a minor signal |
| 40 – 69 | Several risk signals, or an inconclusive server |
| 0 – 39 | Unusable or highly doubtful address |

The exact scale may change to keep up with how mail providers actually behave. Base your business rules on `result`, `warnings` and `finalDecision`, and use the score to sort or refine, not as a contractual threshold.

## The verdicts up close

### `risky`: deliverable, but

A `risky` address will receive the message, but it poses a risk to you: a temporary mailbox that will disappear, a domain imitating a well-known provider to capture mail, a domain reported as malicious, a noreply address nobody reads. The `warnings` field tells you why:

```json
"warnings": [
  { "code": "DISPOSABLE_EMAIL", "severity": "warning", "message": "Disposable / throwaway email provider" }
]
```

<a id="unknown-no-conclusion-no-credit"></a>

### `unknown`: no conclusion, no credit

`unknown` is not a failure: the server simply did not allow a decision. The most common causes:

| Cause | `features.smtp.reasonCode` | What to do |
|---|---|---|
| Accept-all domain | `ACCEPT_ALL_DOMAIN` | The address is often good, but nothing proves it. Accept it and watch for bounces. |
| Greylisting | `GREYLISTED` | The server asks you to try again later. Verify again a few minutes later. |
| Timeout, network | `TIMEOUT`, `NETWORK_ERROR_ETIMEDOUT` | Verify again later. |
| Inconclusive response | `SMTP_INCONCLUSIVE` | The server responded without allowing a decision (temporary refusal, ambiguous response). Verify again later. |

An `unknown` verdict is **never charged**, even if SMTP was attempted.

### `invalid`: why

The cause is shown in the failing feature: `features.syntax`, `features.dns` (`NO_MX_NO_A`, `NULL_MX`…) or `features.smtp` (`MAILBOX_NOT_FOUND`). An address on the blocklist carries `features.listCheck.details.isBlacklisted: true`.

## Technical verdict and business decision

`result` is a **technical** verdict, the same for every customer. Your decision can be stricter: reject role addresses on a B2C form, accept accept-all addresses on a newsletter… You have two tools for this:

- `finalDecision` (`accepted` or `rejected`) and `policy.reasons` apply the **policy** attached to the key. See [Policies and lists](guides/policies-and-lists.md).
- `warnings` describes every signal found, whether or not a policy blocks it.

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Docs</a> › Policies and lists · <a href="https://docs.yeswecheck.fr/uk/guides/policies-lists">Full documentation</a></sub>

# Validation policies and lists

The `result` verdict is the same for every customer. Two tools, set in the dashboard, adapt it to your rules: the **validation policy**, which produces `finalDecision`, and the **allowlist and blocklist**, which settle the matter for specific addresses or domains.

## Validation policies

A policy (**Validation rules** in the dashboard) lists what you reject. It applies to every call and feeds two fields of the response:

```json
"finalDecision": "rejected",
"policy": {
  "decision": "rejected",
  "reasons": ["reject_disposable", "reject_role_account"],
  "rejectedByClientConfig": true
}
```

| Rule | Code in `policy.reasons` | Rejects when |
|---|---|---|
| Reject disposable addresses | `reject_disposable` | `features.disposable` flags a disposable address |
| Reject malicious domains | `reject_malicious_domain` | `features.maliciousDomains` flags the domain |
| Reject trap domains | `reject_typosquat` | `features.typosquat` flags the domain |
| Reject generic accounts | `reject_role_account` | contact@, info@, support@… (noreply@ included) |
| Reject noreply addresses | `reject_no_reply` | noreply@, mailer-daemon@… only: contact@ is still accepted |
| Reject accept-all domains | `reject_catch_all` | The domain accepts any address |
| Reject consumer providers | `reject_free_provider` | Gmail, Outlook, Yahoo… (B2B forms) |
| Reject inconclusive results | `reject_unknown` | `result` is `unknown` |
| Reject offensive terms | `reject_on_profanity` | `features.profanity` flags a term |
| Reject random local parts | `reject_on_random_detection` | `features.randomDetection` flags it |
| Minimum score | `reject_low_quality_score` | `score` below the chosen minimum |
| Minimum domain health | `reject_low_domain_health` | Domain health below the chosen level (`excellent` → `critical`) |
| Reject VPN and Tor | `reject_vpn_or_tor` | The call comes from an anonymising network |
| Reject hosting providers | `reject_datacenter_ip` | The call comes from a hosting provider |

> [!WARNING]
> **`finalDecision` does not replace `result`**
> The policy evaluates **only its own rules**. An `invalid` address that no rule targets comes out with `finalDecision: "accepted"`. Without a policy, `finalDecision` is always `accepted`. So decide on both: reject if `result` is `invalid` **or** if `finalDecision` is `rejected`.

> [!IMPORTANT]
> **Network rules and server calls**
> The `reject_vpn_or_tor` and `reject_datacenter_ip` rules look at the IP **that calls the API**. On a server key, that is your own server, hosted in a data centre: `reject_datacenter_ip` would then reject every address. Keep these rules for widget policies.

### Which policy applies

1. The policy linked to the API key, if the key has one.
2. Otherwise, the policy marked as **default** in the organisation.
3. Otherwise, none: everything is `accepted`.

Create one policy per use (B2C form, B2B form, newsletter widget…) and link it to the matching key.

## Allowlist and blocklist

**Exception lists** in the dashboard. Each entry targets a specific **address** or a whole **domain**.

| List | Effect on verification |
|---|---|
| Allowlist | SMTP does not run (no credit). The score is at least 95. The verdict follows syntax and DNS. |
| Blocklist | SMTP does not run (no credit). The verdict is `invalid`, with `features.listCheck.details.isBlacklisted: true`. |

The same value cannot be on both lists: adding it is refused with the code `LIST_CONFLICT` and the dashboard offers to move the entry.

The lists also apply to batches and to the widget. A key can ignore them by disabling its `whitelist` or `blacklist` checks.

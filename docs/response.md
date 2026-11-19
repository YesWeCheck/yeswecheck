<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Response · <a href="https://docs.yeswecheck.fr/uk">Full documentation</a></sub>

# Anatomy of the response

The `POST /v2/email/validate` response always has the same structure: a few summary fields at the root, the details of each check in `features`, then the metadata.

```json
{
  "result": "risky",
  "score": 52,
  "freeProvider": true,
  "businessEmail": false,
  "disposable": true,
  "alias": false,
  "finalDecision": "accepted",
  "policy": { "decision": "accepted", "reasons": [], "rejectedByClientConfig": false },
  "warnings": [
    { "code": "DISPOSABLE_EMAIL", "severity": "warning", "message": "Disposable / throwaway email provider" }
  ],
  "debug_ref": "YWC-7KQ2M9AB",
  "features": {
    "syntax": { … },
    "dns": { … },
    "disposable": { "result": "invalid", "score": 0, "message": "…", "reasonCode": "DISPOSABLE_DOMAIN" },
    "…": { … }
  },
  "metadata": {
    "requestId": "0192f6b4-6a1e-7c11-9d0a-3f2b8c4e1a77",
    "timestamp": "2026-10-15T09:12:44.512Z",
    "processingTime": 212,
    "credits": { "used": 0, "remaining": 0, "breakdown": { "smtp": 0, "…": 0 } },
    "apiVersion": "2.0"
  }
}
```

The `score` values and `message` texts are given as examples.

## Summary fields

| Field | Type | Description |
|---|---|---|
| `result` | `valid` · `risky` · `invalid` · `unknown` | The verdict. See [Verdicts and score](verdicts.md). |
| `score` | integer 0–100 | Confidence in the address. |
| `freeProvider` | boolean | Consumer domain (webmail, internet service provider) or disposable. |
| `businessEmail` | boolean | Business address: the opposite of `freeProvider` for a well-formed address. |
| `disposable` | boolean | Disposable domain. Shortcut for `features.disposable`. |
| `alias` | boolean | Subaddressed address (`john+promo@gmail.com`). Informational; does not affect the verdict. |
| `finalDecision` | `accepted` · `rejected` | Your validation policy's decision. It only evaluates the policy's rules: an `invalid` address that no rule targets stays `accepted`. |
| `policy` | object | `decision`, `reasons` (`reject_*` codes) and `rejectedByClientConfig`. See [Policies and lists](guides/policies-and-lists.md). |
| `warnings` | array | Risk signals found. **Absent** when there are none. |
| `debug_ref` | string | Support reference for this check (e.g. `YWC-7KQ2M9AB`). See [below](#debug-ref). |

## `features`: the details of each check

Each check has the same shape:

```ts
{
  result: 'valid' | 'invalid' | 'unknown'; // see the callout below
  score: number;        // 0–100
  message: string;      // human-readable explanation, in English
  reasonCode?: string;  // stable machine code, when one exists
  details?: object;     // data specific to the check
}
```

> [!WARNING]
> **In `features`, `invalid` means "signal detected"**
> For risk checks, `result: "invalid"` means that **the signal is present**: `features.disposable.result === "invalid"` means "disposable address", `features.roleAccount.result === "invalid"` means "role account". It is not the address's verdict, which stays in `result` at the root.

| Feature | Present if | `invalid` means | Useful details |
|---|---|---|---|
| `syntax` | always | invalid syntax | `normalizedEmail` |
| `dns` | always | domain with no mail server | `mxRecords`, `primaryMx`, `hasARecord`; `reasonCode`: `MX_FOUND`, `A_FALLBACK`, `NO_MX_NO_A`, `NULL_MX`, `DNS_ERROR` |
| `smtp` | SMTP enabled on the key | mailbox rejected | `reasonCode`: `MAILBOX_EXISTS`, `MAILBOX_NOT_FOUND`, `ACCEPT_ALL_DOMAIN`, `GREYLISTED`, `TIMEOUT`, `SMTP_INCONCLUSIVE`…; `details.smtpCode`, `details.providerDetected` |
| `catchAll` | accept-all domain detected | — (always `unknown`) | `reasonCode: ACCEPT_ALL_DOMAIN` |
| `disposable` | check active | disposable address | `provider` |
| `maliciousDomains` | check active | malicious domain | `category` (`phishing`, `scam_fr`, `blacklist`…), `sources` |
| `typoDomain` | check active | probable typo | `suggestedDomain`, `suggestedEmail`, `detectionMethod` (`list`, `typosquat`, `algorithm`) |
| `typosquat` | check active | trap domain imitating a provider | `impersonatedDomain` (can be `null`) |
| `typoCorrection` | see below | — | `correctedDomain`, `correctedEmail` |
| `roleAccount` | check active | role account | `pattern`, `category` |
| `noReply` | check active | noreply address, a mailbox nobody reads (downgrades `valid` and `unknown` to `risky`, except for the allowlist) | `kind` (`noreply`, `bounce`, `daemon`), `matchedOn` (`local`, `domain`), `pattern`; `reasonCode: NO_REPLY_DETECTED` |
| `randomDetection` | check active | random local part | `randomnessScore` |
| `profanity` | check active | offensive term | `words`, `severity` |
| `aliasing` | check active | — (informational) | `isAlias`, `aliasType`, `baseEmail` |
| `enrichment` | check active | — | `firstName`, `lastName`, `gender`, `presumedAge`, `presumedAgeRange`, associated scores |
| `listCheck` | lists active | address on the blocklist | `isWhitelisted`, `isBlacklisted` |
| `domainHealth` | non-consumer domain | — | `label` (`excellent` → `critical`), MX, SPF and DMARC checks, domain age |
| `network` | check active and IP known | — | see below |

A check disabled on the key is **absent** from `features`. Syntax and DNS are always present.

<a id="typo-trap-domain-and-verified-correction"></a>

### Typo, trap domain and verified correction

Three distinct signals, which can occur together:

- `typoDomain`: the user probably made a mistake (`gmial.com` → `gmail.com`). `details.suggestedEmail` suggests the corrected address. No suggestion is made when the intended domain no longer receives mail (`details.suggestionWithheld: "dead_target"`).
- `typosquat`: the domain entered was registered to capture mail intended for a well-known provider. The message will arrive, but not to the intended person.
- `typoCorrection`: with SMTP enabled, when the address entered has no reliable SMTP response (accept-all, no server, trap domain), YesWeCheck also checks the corrected address, **free of charge**. The block is only present if the corrected address is deliverable. The verdict, score and billing of the address entered do not change.

Priority order for suggesting a correction: `typoCorrection.correctedEmail` (verified), then `typoDomain.details.suggestedEmail`. If the address entered is `valid`, suggest nothing: the typo is then just information.

### `network`: the IP calling the API

`network` analyses the IP address **that called the API**: country, operator, Tor, VPN, hosting provider.

> [!IMPORTANT]
> **In a server call, that is your server**
> When your backend calls the API, the IP analysed is **your server's**, not the end user's. You will then see `DATACENTER_IP` in `warnings` on every call. Disable `network` on server keys, or ignore the network codes. This check only makes sense for the [widget](https://docs.yeswecheck.fr/uk/guides/widget), where the call comes from the end user's browser.

## `warnings`: the risk signals

A machine-readable summary of everything that was found. It is **descriptive**: a signal being present does not imply a rejection (see `finalDecision` for that).

| Code | Severity | Signal |
|---|---|---|
| `DISPOSABLE_EMAIL` | warning | Disposable address provider |
| `TYPOSQUAT_DOMAIN` | warning | Domain imitating a well-known provider; `data.impersonatedDomain` |
| `TYPO_DETECTED` | warning, or info if the address entered is deliverable | Probable typo; `data.suggestedDomain` |
| `TYPO_CORRECTION_VERIFIED` | info | The corrected address was verified as deliverable |
| `MALICIOUS_DOMAIN` | error | Reported domain (phishing, scam, blocklist) |
| `ROLE_ACCOUNT` | info | Role account (contact@, info@…) |
| `NO_REPLY` | warning | Noreply address, to exclude from sends; `data.kind` |
| `CATCH_ALL_DOMAIN` | info | Accept-all domain |
| `RANDOM_LOCALPART` | warning | Local part that looks generated |
| `PROFANITY` | info | Offensive term in the local part |
| `TOR_EXIT_NODE` | warning | Call from a Tor exit node |
| `ANONYMOUS_NETWORK` | warning | Call from an anonymising network (VPN, proxy) |
| `DATACENTER_IP` | info | Call from a hosting provider |
| `DUPLICATED_SUBMITTER` | warning | This IP or device has submitted an unusual number of different addresses |

Each entry has the shape `{ code, severity, message, data? }`. Test `code`, never `message`.

<a id="debug-ref"></a>

## `debug_ref`: the support reference

Every single check (API, widget, customer dashboard) carries a short reference, for example `YWC-7KQ2M9AB`. It is **for support only**: a verdict surprises you, a customer disputes a rejection, an address is judged differently by another tool? Send us this reference and we can look up, step by step, how that address was processed, without you having to repeat the call.

- **Where to find it**: at the root of the response, next to `result`. Keep it in your logs alongside the checked address if you want to be able to ask a question later.
- **Lifetime**: 90 days. After that, support can no longer retrieve the details.
- **Do not build on it**: it is an opaque identifier. It holds no information about the address or the verdict, and its format may change. Base your rules on `result`, `features` and `warnings` instead.
- **Bulk processing**: the export does not include it. Give support the file name and the address concerned.

To contact us: [contact@yeswecheck.fr](mailto:contact@yeswecheck.fr), with the reference and the address. Never send your key.

## `metadata`

| Field | Description |
|---|---|
| `requestId` | Unique identifier of the call. Give it to support if you have a question. |
| `timestamp` | Date of the verification (ISO 8601, UTC). |
| `processingTime` | Server-side processing time, in milliseconds. |
| `credits.used` | Credits charged by this call: 0 or 1. |
| `credits.remaining` | The organisation's balance after the call. **Only filled in when SMTP was run**; 0 otherwise. |
| `credits.breakdown` | Breakdown per check; only `smtp` can be non-zero. |
| `apiVersion` | `"2.0"`. |

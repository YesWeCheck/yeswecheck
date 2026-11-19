<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Checks · <a href="https://docs.yeswecheck.fr/uk">Full documentation</a></sub>

# Checks

Each address goes through **twenty checks**, nineteen of them free: only the SMTP check uses a credit. The [numbered list](https://yeswecheck.fr/uk/email-verification-api#title-checks) is published on the website; the table below groups them by API key setting (DNS covers MX and A/AAAA; domain health covers SPF, DMARC, BIMI, domain age and domain owner). Enrichment and network analysis complete the response without counting among these twenty checks. Syntax runs first: a malformed address stops there, without any network request. The other checks then run in parallel, with SMTP last.

## Overview

| Check | What it verifies | Cost | Key setting |
|---|---|---|---|
| Syntax | Address format, internationalised domains, normalisation | Free | Always active |
| DNS | Does the domain have a mail server (MX, or a fallback A record)? | Free | Always active |
| SMTP | Does the mailbox exist: a dialogue with the recipient's server, without sending a message | **1 credit** if conclusive | `smtp`, disabled by default |
| Accept-all | Does the server accept any address? | Included in SMTP | with `smtp` |
| Disposable | Domain of temporary mailboxes | Free | `disposable` |
| Malicious domain | Phishing, scams, public blocklists | Free | `maliciousDomains` |
| Typo | `gmial.com`, `hotmial.co.uk`, `yaho.com`… | Free | `typoDomain` |
| Verified correction | Checks the corrected address when the address entered is doubtful | Free | with `typoDomain` and `smtp` |
| Trap domain | Domain registered to imitate a provider and capture its mail | Free | `typosquat` |
| Role account | contact@, info@, support@, admin@… | Free | `roleAccount` |
| Noreply address | noreply@, no-reply@, donotreply@, mailer-daemon@, bounces@…: a mailbox nobody reads. A `valid` or `unknown` verdict becomes `risky` | Free | `noReply` |
| Random local part | `x7k3p9q2@…` | Free | `randomDetection` |
| Offensive term | A slur in the local part (first names that contain one, such as Dominique, are excluded) | Free | `profanity` |
| Subaddressing | `john+promo@gmail.com` and per-provider equivalents | Free | `aliasing` |
| Enrichment | First name, last name, gender, presumed age inferred from the local part | Free | `enrichment` |
| Organisation lists | Allowlist and blocklist | Free | `whitelist`, `blacklist` |
| Business or consumer | Company domain or consumer provider (`businessEmail`, `freeProvider`) | Free | Always active |
| Domain health | MX, SPF, DMARC, BIMI, domain age and domain owner | Free | `domainHealth` |
| Network | Caller's IP: Tor, VPN, hosting provider, country | Free | `network` |

You configure these in **API keys** in the dashboard. A disabled check is no longer computed for that key and disappears from the response.

## SMTP in detail

SMTP is the only check that confirms a mailbox **exists**. YesWeCheck connects to the domain's mail server, introduces itself, announces a recipient and reads the response, then hangs up before anything is sent. No message ever arrives in the mailbox.

- **Duration**: from a few hundred milliseconds to around fifteen seconds, depending on the server. Allow a client timeout of at least 30 seconds on keys with SMTP.
- **`smtpTimeout`**: optional, in milliseconds (1,000 to 30,000), it limits how long to wait for the remote server's responses. With no value, the platform applies its own setting, adapted to each mail provider.
- **What is not charged**: an SMTP check that concludes `unknown` (accept-all, greylisting, timeout), an address on the allowlist or blocklist (SMTP is not run in that case).

What **is** charged: any final verdict of `valid`, `risky` or `invalid` obtained with a key that has SMTP enabled, including when the verdict is reached before the dialogue (invalid syntax, domain with no server). See [Credits](credits.md).

<a id="enrichment-in-detail"></a>

## Enrichment in detail

From the local part (`john.smith@…`), YesWeCheck infers a probable first name and last name, then a gender and a presumed age from birth statistics (INSEE for France, equivalent national sources for other countries).

The reference country for age is chosen as follows:

1. the request's `country` field, if provided (`FR`, `US`, `DEU`…);
2. otherwise the domain's country-code extension (`.de`, `.it`…);
3. otherwise France.

If there is no age data for the chosen country, `presumedAge` is absent rather than wrong. This information is a **statistical estimate**: it helps you personalise or segment, but should never be the sole basis for a decision.

Enrichment on its own, without verification, is available on `POST /v2/email/enrich`.

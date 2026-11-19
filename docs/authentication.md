<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Authentication · <a href="https://docs.yeswecheck.fr/uk/authentication">Full documentation</a></sub>

# Authentication and API keys

All authenticated requests use a single header, `Authorization`, with the `Bearer` scheme:

```http
Authorization: Bearer ywc_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

| Form | Status |
|---|---|
| `Authorization: Bearer ywc_live_…` or `ywc_test_…` | Recommended form |
| `Authorization: ywc_live_…` (without `Bearer`) | Accepted for compatibility with older integrations |
| `X-API-Key: ywc_live_…` | **Never read**: the request gets `401 No authorization header` |

The API recognises a key by its prefix. Any other value preceded by `Bearer` is treated as a dashboard session token (JWT, valid for 60 minutes), reserved for the [app.yeswecheck.fr](https://app.yeswecheck.fr/uk) application. For an integration, always use an API key: it does not expire.

<a id="create-a-key"></a>

## Create a key

From **API keys** in the dashboard. Only an organisation's *owner* and *admin* roles can create, edit, rotate or revoke a key. The full secret is shown only once, when the key is created; after that, the dashboard only shows its prefix and its last 4 characters.

### `ywc_live_` or `ywc_test_`

You choose at creation and cannot change it afterwards. **Both prefixes behave the same way**: same checks, same credits, same billing. The `test` prefix only serves to tell your test keys apart in your logs and in the statistics.

## What a key controls

<a id="active-checks"></a>

### The active checks

Each key carries its own list of checks. They are all active by default, **except SMTP**, which is disabled by default.

| Check | Key field | Default |
|---|---|---|
| SMTP check of the mailbox | `smtp` | disabled |
| Disposable address | `disposable` | enabled |
| Malicious domain | `maliciousDomains` | enabled |
| Typo in the domain | `typoDomain` | enabled |
| Trap domain (typosquat) | `typosquat` | enabled |
| Role account (contact@, info@…) | `roleAccount` | enabled |
| Noreply address (noreply@, mailer-daemon@…) | `noReply` | enabled |
| Random local part | `randomDetection` | enabled |
| Offensive term | `profanity` | enabled |
| Subaddressing (`+tag`) | `aliasing` | enabled |
| First name, last name, gender, presumed age | `enrichment` | enabled |
| Organisation's allow and block lists | `whitelist` · `blacklist` | enabled |
| Domain health | `domainHealth` | enabled |
| Caller's network (Tor, VPN, data centre) | `network` | enabled |

> [!WARNING]
> **You cannot request SMTP in the request**
> With an API key, **only the key's configuration decides** whether SMTP runs. An `smtp` field sent in the body is accepted but **ignored**, with no error or warning; the same goes for `enrichment`. To mix calls with and without SMTP, create two keys.

A disabled check no longer appears in the response's `features`. Syntax and DNS always run and are always returned.

### The scope: `server` or `widget`

| Scope | Use |
|---|---|
| `server` | Secret key, called from your server. This is the scope of every key created from **API keys**. |
| `widget` | Key attached to a form widget. It never appears in the page: the snippet only contains the widget's identifier. A `widget` key requires at least one allowed domain. |

The scope cannot be changed: it is set when you attach a key to a widget from **Widgets**.

<a id="ip-and-origin-restrictions"></a>

### IP and origin restrictions

Two optional lists, each with at most 20 entries, limit who can use the key:

| Restriction | Checks | Format |
|---|---|---|
| `allowedIps` | The caller's IP address | IPv4 or IPv6, single address or CIDR range (at most `/16` in IPv4, `/32` in IPv6) |
| `allowedDomains` | The request's `Origin` header | `example.com` or `*.example.com` (the wildcard also covers `example.com`) |

- With no restriction, the key can be used from anywhere.
- With both lists, the call must satisfy **both**: allowed IP **and** allowed origin.
- A rejected call gets `403`, with a message stating which restriction applied, and the attempt is logged in the dashboard.

> [!IMPORTANT]
> **An origin restriction blocks server calls**
> A server-to-server call (cURL, backend, automation tool) does not send an `Origin` header. A key with `allowedDomains` therefore rejects all of them. For a server key, restrict by **IP**. The origin restriction is for widget keys.

<a id="credit-caps"></a>

### Credit caps

A key can have a daily cap (`maxCreditsPerDay`) and a monthly cap (`maxCreditsPerMonth`). They limit what a key with a leaked secret could cost, regardless of the organisation's balance.

- Only credits actually charged count (an `unknown` verdict does not count).
- The daily cap resets at 00:00 UTC, the monthly cap on the 1st of the month at 00:00 UTC.
- An alert is sent to the owner at 50%, 80% and then 100% of the cap.
- Not to be confused with the key's **call limit** (60/min, 1,000/h, 10,000/day by default), which counts calls, not credits: `429 API_KEY_RATE_LIMITED`, see [Rate limits](rate-limits.md#limits-per-api-key).
- Cap reached: `429` with the code `API_KEY_BUDGET_EXCEEDED` and a `Retry-After` header. This is not a lack of credits: there is no point topping up; wait for the reset or raise the cap. See [Error codes](errors.md#429-api_key_budget_exceeded).

### The validation policy

A key can be attached to a policy (**Validation rules** in the dashboard) that turns signals into a business decision: reject disposable addresses, role accounts, accept-all domains… Without an explicit policy, the organisation's default policy applies. See [Policies and lists](guides/policies-and-lists.md).

### AI assistant keys

The [MCP server](../integrations/mcp/README.md) (`https://api.yeswecheck.fr/mcp`) accepts a key with `server` scope, with the same `Authorization: Bearer` header. Assistants such as Claude or ChatGPT connect instead through **OAuth**: on authorisation, YesWeCheck creates a key dedicated to the application, labelled **MCP · OAuth** in **API keys**. Its secret is never shown and it cannot be rotated; revoking it disconnects the application. B2B email finding is only available through the MCP server, if the key has the **B2B Email Finder for AI agents** option.

<a id="replace-a-key-without-downtime"></a>

## Replace a key without downtime

Rotation generates a new secret for the **same** key: configuration, restrictions, caps and statistics are kept. You choose how long the old secret remains accepted:

| Grace period | Effect |
|---|---|
| None (default) | The old secret is rejected immediately |
| 24 hours · 7 days · 30 days | Both secrets work during the period, giving you time to redeploy |

<ol>
  <li>In <strong>API keys</strong>, start the rotation with a grace period that suits your deployment cycle.</li>
  <li>Copy the new secret and deploy it to your environment variables.</li>
  <li>Check in the key's statistics that traffic is going through the new secret.</li>
</ol>

If a leak is confirmed, **revoke** the key: it is rejected immediately (`401 Invalid or revoked API key`). A revoked key can be reactivated as long as it has not been deleted.

## Best practices

- One key per use and per environment: production, testing, automation tool, one for each widget.
- The secret lives server-side, in an environment variable or a secrets vault. Never in a Git repository, a mobile app or JavaScript served to the browser.
- For a web form, expose no key at all: use the [widget](../integrations/widget/README.md), designed for exactly that.
- Set a credit cap on every key that has SMTP enabled.
- Restrict server keys to your servers' outbound IP when it is fixed.

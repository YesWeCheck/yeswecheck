<a href="https://yeswecheck.fr/uk">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-dark.svg">
    <img alt="YesWeCheck: email verification built for developers" src=".github/assets/banner-light.svg" width="100%">
  </picture>
</a>

<p align="center">
  <a href="https://docs.yeswecheck.fr/uk"><img alt="API v2" src="https://img.shields.io/badge/API-v2-0B1220?style=flat-square"></a>
  <a href="openapi/openapi.yaml"><img alt="OpenAPI 3.0" src="https://img.shields.io/badge/OpenAPI-3.0-0B1220?style=flat-square"></a>
  <a href="https://docs.yeswecheck.fr/uk/connectors/mcp"><img alt="MCP server" src="https://img.shields.io/badge/MCP-server-22C55E?style=flat-square"></a>
  <a href="https://app.yeswecheck.fr/uk/register?src=github"><img alt="100 free credits" src="https://img.shields.io/badge/free-100%20credits-22C55E?style=flat-square"></a>
  <a href="LICENSE"><img alt="Licence: MIT" src="https://img.shields.io/badge/licence-MIT-64748B?style=flat-square"></a>
</p>

<p align="center">
  <b>Know which email addresses are real before you send a single message.</b><br>
  Syntax, domain and mailbox checks, typo correction and risk signals, in one API call.
</p>

<p align="center">
  <a href="https://app.yeswecheck.fr/uk/register?src=github"><b>Get a free API key</b></a> ·
  <a href="docs/quickstart.md">Quickstart</a> ·
  <a href="docs/README.md">Docs</a> ·
  <a href="https://yeswecheck.fr/uk">Website</a> ·
  <a href="https://status.yeswecheck.fr/uk">Status</a>
</p>

<br>

## Why YesWeCheck

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>📬 Mailbox-level checks</h3>
      Goes beyond syntax and DNS: the recipient's mail server confirms whether the mailbox exists.
    </td>
    <td width="33%" valign="top">
      <h3>✨ Typo correction</h3>
      <code>gmial.com</code> → <code>gmail.com</code>. Catch mistakes at sign-up and suggest the fix to your user.
    </td>
    <td width="33%" valign="top">
      <h3>🛡️ Risk signals</h3>
      Disposable, malicious and lookalike domains, role and no-reply addresses, all flagged in <code>warnings</code>.
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>💳 Fair billing</h3>
      Only a conclusive mailbox check uses a credit. <code>unknown</code> results and every other check are free.
    </td>
    <td width="33%" valign="top">
      <h3>🧠 Your rules</h3>
      Allowlists, blocklists and policies per key: get a ready-made <code>accepted</code> / <code>rejected</code> decision.
    </td>
    <td width="33%" valign="top">
      <h3>🇫🇷 Hosted in France</h3>
      EU data hosting, stored addresses encrypted, results deleted automatically after a bulk job.
    </td>
  </tr>
</table>

## Quickstart

**1.** [Create a free account](https://app.yeswecheck.fr/uk/register?src=github) (100 welcome credits, no card) and create an API key.
**2.** Verify an address:

```bash
curl https://api.yeswecheck.fr/v2/email/validate \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "jane.doe@company.co.uk"}'
```

**3.** Act on the verdict:

```jsonc
{
  "result": "valid",          // valid | risky | invalid | unknown
  "score": 100,               // confidence, 0–100
  "disposable": false,
  "freeProvider": false,
  "businessEmail": true,
  "finalDecision": "accepted", // your key's policy, if you set one
  "features": { "syntax": { … }, "dns": { … }, "smtp": { "reasonCode": "MAILBOX_EXISTS", … } },
  "metadata": { "credits": { "used": 1, "remaining": 4819 }, "apiVersion": "2.0" }
}
```

<details>
<summary><b>Node.js</b></summary>

```js
const res = await fetch("https://api.yeswecheck.fr/v2/email/validate", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.YWC_API_KEY}`,
    "Content-Type": "application/json",
    "Accept-Language": "en-GB",
  },
  body: JSON.stringify({ email: "jane.doe@company.co.uk" }),
});

if (!res.ok) throw new Error(`YesWeCheck ${res.status}`);
const { result, score } = await res.json();
```

</details>

<details>
<summary><b>Python</b></summary>

```python
import os
import requests

res = requests.post(
    "https://api.yeswecheck.fr/v2/email/validate",
    headers={
        "Authorization": f"Bearer {os.environ['YWC_API_KEY']}",
        "Accept-Language": "en-GB",
    },
    json={"email": "jane.doe@company.co.uk"},
    timeout=30,
)
res.raise_for_status()
verdict = res.json()
print(verdict["result"], verdict["score"])
```

</details>

<details>
<summary><b>PHP</b></summary>

```php
$ch = curl_init('https://api.yeswecheck.fr/v2/email/validate');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . getenv('YWC_API_KEY'),
        'Content-Type: application/json',
        'Accept-Language: en-GB',
    ],
    CURLOPT_POSTFIELDS => json_encode(['email' => 'jane.doe@company.co.uk']),
]);
$verdict = json_decode(curl_exec($ch), true);
echo $verdict['result'] . ' ' . $verdict['score'];
```

</details>

## How it works

```mermaid
flowchart LR
  A([Email address]) --> B[Syntax]
  B --> C[Domain<br>and MX]
  C --> D[Mailbox<br>check]
  D --> E[Risk<br>signals]
  E --> F{{Verdict<br>+ score}}
  classDef step fill:#0F1B33,stroke:#1F2B44,color:#E8EDF5
  classDef io fill:#22C55E,stroke:#15803D,color:#0B1220
  class B,C,D,E step
  class A,F io
```

Each check is reported in `features`, so you always know *why* an address got its verdict. The mailbox check runs only on keys where you enable it.

| Verdict | Meaning | Typical action |
|---|---|---|
| 🟢 `valid` | Deliverable, no notable risk signal | Accept |
| 🟠 `risky` | Deliverable, but disposable, lookalike, malicious, no-reply, or low score | Accept with care, or reject on sensitive forms |
| 🔴 `invalid` | Will not receive mail: bad syntax, no mail server, mailbox rejected | Reject, show the typo suggestion if any |
| ⚪ `unknown` | The mail server did not allow a conclusion. **Never billed** | Accept and monitor |

More in [Verdicts and score](docs/verdicts.md) and [Response](docs/response.md).

## Integrations

<table>
  <tr>
    <td width="25%" valign="top">
      <h4>🤖 AI assistants</h4>
      MCP server for Claude, ChatGPT, Le Chat, Cursor and VS Code.<br>
      <a href="https://docs.yeswecheck.fr/uk/connectors/mcp">Set up →</a>
    </td>
    <td width="25%" valign="top">
      <h4>⚙️ Make</h4>
      Verify emails inside any scenario, no code.<br>
      <a href="https://docs.yeswecheck.fr/uk/connectors/make">Set up →</a>
    </td>
    <td width="25%" valign="top">
      <h4>📇 CRM and email tools</h4>
      Brevo, HubSpot, Mailchimp, Mailjet, Klaviyo, Pipedrive, Google Sheets, Systeme.io, Positive User.<br>
      <a href="https://docs.yeswecheck.fr/uk/connectors">Browse →</a>
    </td>
    <td width="25%" valign="top">
      <h4>📝 Form widget</h4>
      Real-time checks on any sign-up form, one script tag, no key in the page.<br>
      <a href="https://docs.yeswecheck.fr/uk/guides/widget">Set up →</a>
    </td>
  </tr>
</table>

## Best practices

> [!TIP]
> **Test for free.** A key without the mailbox check uses no credits: syntax, DNS, disposable, typo and lookalike checks are all free.

- **Branch on `result`**, and use `finalDecision` when you want your key's policy to decide for you.
- **One key per use case.** For example, a key without SMTP for instant checks while the user types, and a key with SMTP when the form is submitted.
- **Keep API keys on your server.** In the browser, use the [form widget](https://docs.yeswecheck.fr/uk/guides/widget): it needs no key in the page.
- **Treat `unknown` kindly.** It is not a failure and costs nothing: accept the address and keep an eye on bounces.
- **Store results.** An address rarely changes state overnight: keep verdicts for a while and skip repeat checks.

See the [production checklist](docs/guides/production-checklist.md) before going live.

## What's in this repository

| Path | Content |
|---|---|
| [`docs/`](docs/) | The documentation in Markdown: quickstart, verdicts, response, errors, limits, credits, guides |
| [`openapi/`](openapi/) | The OpenAPI 3.0 specification of the public API |

## Pricing

Start with **100 free credits**, no card required. Only a conclusive mailbox check uses a credit; packs never expire. See [pricing](https://yeswecheck.fr/uk/pricing).

## Support

- 📖 [Documentation](https://docs.yeswecheck.fr/uk) and [FAQ](docs/faq.md)
- 🐛 [Report a problem](https://github.com/YesWeCheck/yeswecheck/issues/new/choose) with this repository
- ✉️ [contact@yeswecheck.fr](mailto:contact@yeswecheck.fr) for anything about your account
- 🔒 Security issue? See [SECURITY.md](SECURITY.md)

## Licence

The code and examples in this repository are released under the [MIT licence](LICENSE). The YesWeCheck API itself is a hosted service subject to its [terms](https://yeswecheck.fr/uk/terms).

<br>

<p align="center">
  <a href="https://yeswecheck.fr/uk"><img src=".github/assets/avatar.svg" width="36" alt="YesWeCheck"></a><br>
  <sub>Made in France · <a href="https://yeswecheck.fr/uk">yeswecheck.fr</a></sub>
</p>

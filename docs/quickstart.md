<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › Quickstart · <a href="https://docs.yeswecheck.fr/uk/getting-started">Full documentation</a></sub>

# Quick start

From creating your account to reading your first verdict, in four steps.

## 1. Create an API key

<ol>
  <li>Create an account on <a href="https://app.yeswecheck.fr/uk/register?src=docs">app.yeswecheck.fr</a>. The Free plan includes 100 welcome credits, no card required.</li>
  <li>Open <strong>API keys</strong> in the dashboard menu, then create a key. Only the organisation's <em>owner</em> and <em>admin</em> roles can do this.</li>
  <li>Choose the active checks. <strong>SMTP is disabled by default</strong>: enable it if you want to confirm that mailboxes exist (1 credit per conclusive verification).</li>
  <li>Copy the key straight away: it is only shown once.</li>
</ol>

Store it in an environment variable on your server, never in your code or in a web page:

```bash
YWC_API_KEY=ywc_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

> [!TIP]
> **Test without spending**
> A key without SMTP uses no credits: syntax, DNS, disposable addresses, typos and trap domains are free. There is no separate sandbox environment; a `ywc_test_…` key behaves exactly like a `ywc_live_…` key and only serves to keep your uses apart.

## 2. Verify an address

<details open>
<summary><b>cURL</b></summary>

```bash
curl https://api.yeswecheck.fr/v2/email/validate \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.smith@gmail.com"}'
```

</details>

<details>
<summary><b>Node.js</b></summary>

```js
const res = await fetch('https://api.yeswecheck.fr/v2/email/validate', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.YWC_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: 'john.smith@gmail.com' }),
});

if (!res.ok) throw new Error(`YesWeCheck ${res.status}`);
const verdict = await res.json();
console.log(verdict.result, verdict.score); // "valid" 100
```

</details>

<details>
<summary><b>Python</b></summary>

```python
import os
import requests

res = requests.post(
    "https://api.yeswecheck.fr/v2/email/validate",
    headers={"Authorization": f"Bearer {os.environ['YWC_API_KEY']}"},
    json={"email": "john.smith@gmail.com"},
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
    ],
    CURLOPT_POSTFIELDS => json_encode(['email' => 'john.smith@gmail.com']),
]);
$verdict = json_decode(curl_exec($ch), true);
echo $verdict['result'] . ' ' . $verdict['score'];
```

</details>

The request body contains only the address. The optional fields (`country`, `smtpTimeout`) are described in the [reference](https://docs.yeswecheck.fr/uk/reference/validate-email); any unknown field is rejected with a `400` error.

## 3. Read the response

An excerpt from a response, with a key that has SMTP enabled and a mailbox that exists:

```json
{
  "result": "valid",
  "score": 100,
  "freeProvider": true,
  "businessEmail": false,
  "disposable": false,
  "alias": false,
  "finalDecision": "accepted",
  "features": {
    "syntax": { "result": "valid", "score": 100, "message": "…", "details": { "normalizedEmail": "john.smith@gmail.com" } },
    "dns": { "result": "valid", "score": 100, "reasonCode": "MX_FOUND", "message": "…" },
    "smtp": { "result": "valid", "score": 100, "reasonCode": "MAILBOX_EXISTS", "message": "…" },
    "disposable": { "result": "valid", "score": 100, "message": "…" },
    "typoDomain": { "result": "valid", "score": 100, "message": "…" }
  },
  "metadata": {
    "requestId": "0192f6b4-…",
    "timestamp": "2026-10-15T09:12:44.512Z",
    "processingTime": 1840,
    "credits": { "used": 1, "remaining": 4819 },
    "apiVersion": "2.0"
  }
}
```

Three fields are enough to decide:

| Field | Content |
|---|---|
| `result` | The verdict: `valid`, `risky`, `invalid` or `unknown`. |
| `score` | Confidence, from 0 to 100. |
| `warnings` | Only present if a risk signal was found (disposable, typo, trap domain…). |

Each field is described in detail in [Anatomy of the response](response.md).

## 4. Decide

| Verdict | Meaning | Recommended action |
|---|---|---|
| `valid` | Deliverable address, with no notable risk signal | Accept |
| `risky` | Deliverable but risky: disposable, trap or malicious domain, noreply address, or score below 70 | Accept with caution, or reject depending on your context |
| `invalid` | Invalid syntax, domain with no mail server, mailbox rejected by SMTP, or address on the blocklist | Reject |
| `unknown` | The server did not allow a conclusion: accept-all domain, greylisting, timeout | Accept with caution; no credit is charged |

The [Verdicts and score](verdicts.md) page explains how each verdict is reached.

## What next
  - **[Protect your key](authentication.md)** · Security. IP and origin restrictions, credit caps, rotation without downtime.
  - **[Verify at sign-up](guides/signup-validation.md)** · Guide. Complete decision logic, correction suggestions, error handling.
  - **[Add the widget](../integrations/widget/README.md)** · Guide. One script tag, no key in the page.

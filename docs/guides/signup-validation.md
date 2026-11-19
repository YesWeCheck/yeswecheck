<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Docs</a> › Sign-up validation · <a href="https://docs.yeswecheck.fr/uk/guides/validate-email">Full documentation</a></sub>

# Verify an address from a server

Typical use cases: sign-up, customer account creation, adding a contact to a CRM, order taking. Your server receives the address, calls YesWeCheck and decides.

**`POST /v2/email/validate`** · API key

## Choose the key

| Need | Key setting |
|---|---|
| Filter out typos, disposable addresses and dead domains, at no cost | SMTP disabled |
| Confirm that the mailbox exists | SMTP enabled, with a credit cap |
| High-traffic public form | Prefer the [widget](../../integrations/widget/README.md), designed to prevent abuse |

## A minimal client

<details open>
<summary><b>TypeScript</b></summary>

```ts
type Verdict = 'valid' | 'risky' | 'invalid' | 'unknown';

interface Feature<D = Record<string, unknown>> {
  result: 'valid' | 'invalid' | 'unknown';
  score: number;
  message: string;
  reasonCode?: string;
  details?: D;
}

export interface ValidationResponse {
  result: Verdict;
  score: number;
  freeProvider: boolean;
  businessEmail: boolean;
  disposable: boolean;
  alias: boolean;
  finalDecision: 'accepted' | 'rejected';
  policy: { decision: 'accepted' | 'rejected'; reasons: string[]; rejectedByClientConfig: boolean };
  warnings?: { code: string; severity: 'info' | 'warning' | 'error'; message: string; data?: Record<string, unknown> }[];
  features: {
    syntax: Feature;
    dns: Feature;
    smtp?: Feature;
    typoDomain?: Feature<{ suggestedDomain?: string; suggestedEmail?: string }>;
    typoCorrection?: { correctedDomain: string; correctedEmail?: string };
    [name: string]: unknown;
  };
  metadata: { requestId: string; processingTime: number; credits: { used: number; remaining: number } };
}

export async function validateEmail(email: string): Promise<ValidationResponse> {
  const res = await fetch('https://api.yeswecheck.fr/v2/email/validate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.YWC_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new YwcError(res.status, body, res.headers.get('retry-after'));
  }
  return res.json();
}

export class YwcError extends Error {
  constructor(readonly status: number, readonly body: string, readonly retryAfter: string | null) {
    super(`YesWeCheck ${status}`);
  }
}
```

</details>

<details>
<summary><b>Python</b></summary>

```python
import os
import requests

class YwcError(Exception):
    def __init__(self, status, body, retry_after=None):
        super().__init__(f"YesWeCheck {status}")
        self.status, self.body, self.retry_after = status, body, retry_after

def validate_email(email: str) -> dict:
    res = requests.post(
        "https://api.yeswecheck.fr/v2/email/validate",
        headers={"Authorization": f"Bearer {os.environ['YWC_API_KEY']}"},
        json={"email": email},
        timeout=30,
    )
    if not res.ok:
        raise YwcError(res.status_code, res.text, res.headers.get("Retry-After"))
    return res.json()
```

</details>

<details>
<summary><b>PHP</b></summary>

```php
function ywc_validate_email(string $email): array
{
    $ch = curl_init('https://api.yeswecheck.fr/v2/email/validate');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . getenv('YWC_API_KEY'),
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode(['email' => $email]),
    ]);
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($status !== 200) {
        throw new RuntimeException("YesWeCheck $status: $body");
    }
    return json_decode($body, true);
}
```

</details>

> [!NOTE]
> **Plain-text response on some 429s**
> The per-IP rate limiter responds in plain text, not JSON. Read an error body as text, then try to decode it. See [Error codes](../errors.md).

## Complete decision logic

```ts
import type { ValidationResponse } from './ywc';

type Decision =
  | { action: 'accept' }
  | { action: 'accept_with_warning'; reason: string }
  | { action: 'suggest'; email: string }
  | { action: 'reject'; reason: string };

export function decide(r: ValidationResponse): Decision {
  // 1. Your validation policy can reject a deliverable address.
  //    It only evaluates its own rules: an `invalid` still needs handling below.
  if (r.finalDecision === 'rejected') {
    return { action: 'reject', reason: r.policy.reasons.join(', ') };
  }

  // 2. Correction: the verified corrected address first, otherwise the suggestion.
  //    If the address entered is valid, the typo is only informational.
  if (r.result !== 'valid') {
    const corrected =
      r.features.typoCorrection?.correctedEmail ??
      r.features.typoDomain?.details?.suggestedEmail;
    if (corrected) return { action: 'suggest', email: corrected };
  }

  switch (r.result) {
    case 'valid':
      return { action: 'accept' };
    case 'invalid':
      return { action: 'reject', reason: 'Undeliverable address' };
    case 'risky':
      return r.disposable
        ? { action: 'reject', reason: 'Temporary addresses are not accepted' }
        : { action: 'accept_with_warning', reason: 'Risky address' };
    case 'unknown':
      // Inconclusive server (accept-all, greylisting): don't block a real customer.
      return { action: 'accept_with_warning', reason: 'Unconfirmed address' };
  }
}
```

Adapt the `risky` and `unknown` branches to your context: a payment form may reject `risky`, a newsletter may accept everything except `invalid`.

## Handle errors without blocking your users

Verification must never stop a legitimate customer from signing up because the API is temporarily unavailable.

| Status | Cause | Recommended response |
|---|---|---|
| `400` | Invalid body (address malformed for the validator, unknown field) | Fix the call; don't retry |
| `401` | Key missing, invalid or revoked | Alert the technical team; accept the address in degraded mode |
| `402` | No credits left for SMTP | Top up; meanwhile, accept or use a key without SMTP |
| `403` | IP or origin not allowed for the key | Fix the key's restrictions |
| `429` | Key's rate limit or credit cap reached | Wait `Retry-After` seconds; don't loop |
| `5xx`, timeout | Incident | Retry once after a few seconds, then degraded mode |

```ts
try {
  const verdict = await validateEmail(email);
  return decide(verdict);
} catch (e) {
  // Degraded mode: accept, and flag the address for re-verification later.
  logger.warn('YesWeCheck unavailable', e);
  return { action: 'accept' as const };
}
```

## Tips

- **Verify at the right moment**: when the form is submitted, server side, not on every keystroke. For live input, use the [widget](../../integrations/widget/README.md) or the [autocomplete endpoints](autocomplete.md).
- **Store `metadata.requestId`** with the address: it is the reference to give to support.
- **Don't re-verify the same address in a loop**: a `valid` or `invalid` result stays reliable for several days; an `unknown` is worth retrying later.
- **More than a few hundred addresses** at once: use [batch processing](bulk-lists.md).

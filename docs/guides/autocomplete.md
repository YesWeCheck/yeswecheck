<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Docs</a> › Autocomplete · <a href="https://docs.yeswecheck.fr/uk">Full documentation</a></sub>

# Autocomplete, typos and enrichment

These endpoints help users enter an address correctly **before** you verify it. They are fast, never trigger SMTP and consume **no credits**.

| Endpoint | Use | Authentication | Limit |
|---|---|---|---|
| `POST /v2/email/suggest/domain` | Suggest domains after the `@` | API key or widget | 60 requests/min/IP |
| `POST /v2/email/suggest/typo-domain` | Detect a typo in the domain | API key or widget | 60 requests/min/IP |
| `GET /v2/email/suggest/domain/countries` | List the countries covered | API key | — |
| `POST /v2/email/suggest/localpart` | Generate `prenom.nom`, `p.nom`… | API key | — |
| `POST /v2/email/suggest-firstname` | Autocomplete a first name | API key | — |
| `POST /v2/email/suggest-lastname` | Autocomplete a last name | API key | — |
| `POST /v2/email/enrich` | Infer first name, last name, gender and age from an address | API key | — |

All of them require a key. For the first two, used while users type in your forms, there are two ways to identify yourself:

- **from your server**, with your API key in `Authorization: Bearer …`;
- **from a web page**, with the [widget](https://docs.yeswecheck.fr/uk/guides/widget): it sends the widget ID, with no key in the page, and the API checks that the page is served from an allowed domain of the linked `widget` key.

Each call counts towards the [key's call limit](../rate-limits.md#limits-per-api-key), on top of the per-IP limit.

## Suggest a domain

<Endpoint method="POST" path="/v2/email/suggest/domain" auth="API key" />

```bash
curl https://api.yeswecheck.fr/v2/email/suggest/domain \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country": "FR", "partial": "ho", "count": 3}'
```

```json
{
  "country": "FR",
  "count": 3,
  "type": null,
  "partial": "ho",
  "suggestions": [
    { "domain": "hotmail.fr", "provider": "Microsoft", "type": "webmail", "popularity": 13, "score": 88.3 },
    { "domain": "yahoo.fr", "provider": "Yahoo", "type": "webmail", "popularity": 11, "score": 54.2 }
  ],
  "total": 2
}
```

| Field | Description |
|---|---|
| `country` | Country code (`FR`, `DE`, `BE`…) or `GLOBAL` (default). |
| `partial` | What the user typed after the `@`. Filters and ranks the domains. |
| `count` | Maximum number of suggestions (default 15). `maxResults` is a legacy alias. |
| `type` | Filter: `webmail`, `isp`, `professional`, `secure`. |

## Detect a typo

<Endpoint method="POST" path="/v2/email/suggest/typo-domain" auth="API key" />

Same engine and same normalisation as verification: the two surfaces can never suggest two different corrections for the same address.

```bash
curl https://api.yeswecheck.fr/v2/email/suggest/typo-domain \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@gmial.com"}'
```

```json
{
  "input": "john@gmial.com",
  "inputDomain": "gmial.com",
  "detected": true,
  "suggestedDomain": "gmail.com",
  "suggestedEmail": "john@gmail.com",
  "score": 100,
  "message": "Possible typo in domain. Did you mean john@gmail.com?",
  "reasonCode": "TYPO_DETECTED",
  "details": {
    "suggestedDomain": "gmail.com",
    "suggestedEmail": "john@gmail.com",
    "typoType": "character_swap",
    "similarityScore": 90,
    "detectionMethod": "list"
  }
}
```

- Send `email` (full address) or `domain` (domain only; `input` is an alias). Without an `@`, `suggestedEmail` is `null`.
- `detected: false`: no typo, `suggestedDomain` is `null`.
- `details.detectionMethod` tells you where the correction comes from: `list` (corrections reference list), `typosquat` (known trap domain) or `algorithm` (distance engine). For `algorithm`, `details.patterns`, `details.transformations` and `details.difficulty` explain the correction.
- No suggestion when the intended domain no longer receives mail, nor for a disposable domain.

## Generate local parts

<Endpoint method="POST" path="/v2/email/suggest/localpart?domain=example.com" auth="API key" />

```bash
curl "https://api.yeswecheck.fr/v2/email/suggest/localpart?domain=example.com" \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Smith", "maxResults": 3}'
```

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "domain": "example.com",
  "partial": null,
  "suggestions": [
    { "localpart": "john.smith", "pattern": "prenom.nom", "popularity": 10, "email": "john.smith@example.com" },
    { "localpart": "johnsmith", "pattern": "prenomnom", "popularity": 9, "email": "johnsmith@example.com" },
    { "localpart": "j.smith", "pattern": "p.nom", "popularity": 9, "email": "j.smith@example.com" }
  ],
  "total": 3
}
```

`firstName` and `lastName` are required. `includeNumbers: true` adds variants with numbers, and `partial` filters on what has already been typed. The `domain` query parameter adds the `email` field to each suggestion. These addresses are **guesses**: verify the one you keep.

## Autocomplete a first name or last name

<Endpoint method="POST" path="/v2/email/suggest-firstname" auth="API key" />

```bash
curl https://api.yeswecheck.fr/v2/email/suggest-firstname \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "je", "limit": 2}'
```

```json
{
  "query": "je",
  "suggestions": [
    { "firstName": "Jean", "source": "insee", "popularity": 510000, "gender": "M", "score": 198.2 },
    { "firstName": "Jessica", "source": "international", "popularity": 65000, "gender": "F", "score": 164.4 }
  ],
  "total": 2
}
```

`POST /v2/email/suggest-lastname` works the same way and returns `lastName` instead of `firstName`. `query` is required (`partial` and `input` are aliases), and `limit` ranges from 1 to 20 (default 10).

## Enrich an address

<Endpoint method="POST" path="/v2/email/enrich" auth="API key" />

The enrichment from verification, without the verification.

```bash
curl https://api.yeswecheck.fr/v2/email/enrich \
  -H "Authorization: Bearer $YWC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.smith@gmail.com", "country": "FR"}'
```

```json
{
  "result": "valid",
  "score": 95,
  "message": "…",
  "details": {
    "firstName": "John",
    "firstNameScore": 95,
    "lastName": "Smith",
    "lastNameScore": 90,
    "gender": "male",
    "genderScore": 98,
    "presumedAge": 62,
    "presumedAgeRange": "55-64",
    "presumedAgeScore": 75,
    "ageBasis": { "country": "FR", "resolvedFrom": "param", "source": "insee" },
    "status": "success"
  }
}
```

Values shown as an example. `country` is optional; see [enrichment in detail](../checks.md#enrichment-in-detail) for how the reference country is chosen.

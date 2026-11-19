<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Integrations</a> › Zapier, n8n and HTTP · <a href="https://docs.yeswecheck.fr/uk/guides/no-code">Full documentation</a></sub>

# No-code tools

For Brevo, HubSpot, Pipedrive, Mailchimp, Positive User, Mailjet, Klaviyo, Systeme.io and Google Sheets, a native connector ([Brevo](connectors/brevo.md), [HubSpot](connectors/hubspot.md), [Pipedrive](connectors/pipedrive.md), [Mailchimp](connectors/mailchimp.md), [Positive User](connectors/positive-user.md), [Mailjet](connectors/mailjet.md), [Klaviyo](connectors/klaviyo.md), [Systeme.io](connectors/systeme-io.md), [Google Sheets](connectors/google-sheets.md)) verifies your lists and writes the result on each contact or each row, with no automation to build. As for other tools, they can all call an HTTP API; the principle is the same everywhere.

## Prepare a dedicated key

Create a key specifically for the automation tool, with:

- SMTP enabled only if you want to confirm mailboxes (1 credit per conclusive verification);
- a daily credit cap, so that a badly configured loop does not drain your balance;
- the `network` check disabled: the IP analysed would be the tool's, not the contact's.

Do **not** add an origin restriction (`allowedDomains`): these tools do not send an `Origin` header and would be rejected.

## The HTTP module

| Parameter | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.yeswecheck.fr/v2/email/validate` |
| Header | `Authorization` = `Bearer ywc_live_…` |
| Header | `Content-Type` = `application/json` |
| Body (JSON) | `{"email": "<email field from the previous step>"}` |
| Timeout | 30 seconds if the key has SMTP |

Then filter on `result`: `valid` to continue, `invalid` to discard, and decide what to do for `risky` and `unknown`.

### Zapier

**Webhooks by Zapier → Custom Request** action, with the parameters above. The `Data` field takes the JSON. Then add a **Filter** step on `result`.

### Make

The YesWeCheck app for Make avoids the HTTP module: key-based connection, a **Verify an email address** module and outputs ready to map. See [Make](make/README.md).

With the generic module: **HTTP → Make a request**, body type `Raw`, content type `JSON (application/json)`, and tick **Parse response** to access `result` and `score` in the following modules.

### n8n

**HTTP Request** node: authentication `Generic Credential Type` → `Header Auth`, name `Authorization`, value `Bearer ywc_live_…`. JSON body with the expression `{{ $json.email }}`.

In an n8n AI agent, the **MCP Client Tool** connected to the [MCP server](mcp/README.md#connect-with-an-api-key) gives direct access to validation, lists and B2B search.

## Write the verdict to a CRM

Store at least these three values on the contact record:

| Property | Source |
|---|---|
| Verdict | `result` |
| Score | `score` |
| Validation date | `metadata.timestamp` |

Python example with HubSpot:

```python
import os
import requests

def enrich_contact(contact_id: str, email: str) -> None:
    verdict = requests.post(
        "https://api.yeswecheck.fr/v2/email/validate",
        headers={"Authorization": f"Bearer {os.environ['YWC_API_KEY']}"},
        json={"email": email},
        timeout=30,
    ).json()

    requests.patch(
        f"https://api.hubapi.com/crm/v3/objects/contacts/{contact_id}",
        headers={"Authorization": f"Bearer {os.environ['HUBSPOT_TOKEN']}"},
        json={"properties": {
            "ywc_result": verdict["result"],
            "ywc_score": verdict["score"],
            "ywc_disposable": verdict["disposable"],
            "ywc_validated_at": verdict["metadata"]["timestamp"],
        }},
        timeout=10,
    )
```

You need to create the `ywc_*` properties in HubSpot beforehand. For an existing database of several thousand contacts, export it and use [batch processing](../docs/guides/bulk-lists.md) rather than a loop of calls.

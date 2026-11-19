<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Systeme.io · <a href="https://docs.yeswecheck.fr/uk/connectors/systeme-io">Full documentation</a></sub>

# Connect Systeme.io

The Systeme.io integration verifies all your contacts, or those carrying a tag, and writes the result on each contact, in four contact fields. The principle shared by all integrations is described in [Integrations: how they work](README.md).

## 1. Create a public API key

1. In Systeme.io, open **Settings → Connections**, then the **MCP and API keys** tab.
2. Create a **public API key**, and name it `YesWeCheck`, for example.
3. Copy the key.

The key gives access to the contacts of the Systeme.io account in which it was created: create it in the account whose contacts you want to verify.

## 2. Connect

In the customer area: **Integrate → Integrations → Systeme.io**, paste the key, then **Test and connect**. The connection shows as active when the key is accepted. A rejected key is not saved.

## 3. Clean your contacts

Choose **All contacts** or one of your **tags** (Systeme.io has no lists: tags take their place), then **Start clean-up**. Three steps:

1. YesWeCheck reads the contacts in Systeme.io.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Systeme.io** badge.
3. At the end, the results are written in Systeme.io. A notification gives you the summary.

Contacts that are **unsubscribed** and those that have **bounced** are skipped, and not charged, as long as the **Skip unsubscribed or bounced contacts** option is on (default).

Systeme.io limits the pace of updates: results are written contact by contact, about 9,000 contacts per hour after verification (10,000 contacts ≈ 1 h 10 min). A contact deleted in Systeme.io between reading and writing is never recreated. An interrupted clean-up resumes on its own where it stopped, and a clean-up run again only rewrites contacts whose verdict has changed.

Credits follow the [batch](../../docs/credits.md) rules: one credit per verified address, except for an `unknown` verdict.

By default, YesWeCheck erases its copy of the addresses once the results are written in Systeme.io: no file can be downloaded. Tick **Also keep a downloadable copy of the results (7 days)** to find the verified list in **Batch processing** (CSV or Excel) for 7 days.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

## What is written in Systeme.io

At the first clean-up, YesWeCheck creates four contact fields if they do not exist. They are shown on each contact's record:

| Field | Identifier | Content |
|---|---|---|
| YWC statut | `ywc_status` | `valid`, `risky`, `invalid` or `unknown` |
| YWC score | `ywc_score` | 0 to 100 |
| YWC motif | `ywc_reason` | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if nothing to report |
| YWC dernière vérification | `ywc_last_check` | Date and time of the verification (ISO 8601, UTC) |

They are text fields, the only field type Systeme.io offers. A field deleted in Systeme.io is recreated at the next write.

To set aside risky addresses, filter your contacts in Systeme.io on the **YWC statut** field (for example `invalid`), or turn on the quarantine tag below and exclude that tag from your sends.

### Options for invalid addresses

| Option | Effect in Systeme.io |
|---|---|
| Group invalid addresses | Off by default. Adds a tag to `invalid` contacts, without removing their other tags: the **YWC – invalides** tag, created by YesWeCheck, or an existing tag that you choose. Nothing is deleted |
| Skip unsubscribed or bounced contacts | On by default. These contacts are neither verified nor charged |

The Systeme.io free plan limits the number of tags. If Systeme.io refuses to create the **YWC – invalides** tag, the clean-up continues without a quarantine tag: choose an existing tag that you set aside for this purpose instead.

### Unsubscribe invalid addresses

Systeme.io does not allow an application to unsubscribe a contact. To stop `invalid` addresses from receiving your campaigns, pair the quarantine tag with a Systeme.io automation rule:

1. Turn on the **Group invalid addresses** option and note the chosen tag.
2. In Systeme.io, create an automation rule with the **Tag added** trigger, on that tag.
3. Add the **Unsubscribe from campaign** action and choose the campaign concerned.

Create one rule per campaign. Create it before starting the clean-up: the rule acts on tags added after it was created.

## Verify a contact

On the integration page, **Verify a contact**: enter the address of a Systeme.io contact. It is looked up in Systeme.io and verified, the verdict is shown and the fields are written on the contact's record. The quarantine tag applies as for a clean-up. An address not in Systeme.io is not verified and costs no credit.

## Automatically verify new contacts

Turn on **Automatically verify new contacts**, choose the sources to watch (**All new contacts**, or one or more tags) and a daily limit. The option is off by default. Once it is on:

- with **All new contacts**, every contact created since activation (form, opt-in page, import, API, other integration) is verified;
- with a **tag**, every contact that receives this tag since activation is verified, including a contact that already existed in your account.

Verification takes a few minutes, and the fields are filled in straight away. A contact arriving through several watched sources is verified, and charged, only once. Contacts already present at activation are not affected: clean **All contacts** or the tag for them. The daily limit caps credit usage; beyond it, the day's new contacts are not verified.

For this option, YesWeCheck adds a webhook named **YesWeCheck – nouveaux contacts** to your Systeme.io account, visible in **Settings → Connections → Webhooks**. Do not delete it: if it disappears, YesWeCheck recreates it automatically. Turning the option off, or disconnecting Systeme.io, deletes it.

## Disconnect

**Disconnect** erases the key at YesWeCheck, stops automatic verification and deletes the **YesWeCheck – nouveaux contacts** webhook from your Systeme.io account. The YWC fields and the quarantine tag stay in your account; delete them in Systeme.io if you no longer want them.

To cut off access immediately, on the Systeme.io side, delete the key in **Settings → Connections → MCP and API keys**.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | Key incomplete, or deleted in Systeme.io | Create a public API key and reconnect |
| "Your Systeme.io plan refuses to create the YesWeCheck fields" | Your Systeme.io plan limits the number of contact fields | Delete an unused field or upgrade your plan, then start the clean-up again |
| "The tool is temporarily limiting calls" | Systeme.io call limit reached, sometimes shared with your other integrations | Processing resumes on its own; otherwise try again later |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| "No Systeme.io contact has this address" | Contact verification: address not in the account | Check the spelling; no credit is charged |
| Connection **Reconnect needed** | Systeme.io rejects the saved key | Enter a valid key on the integration page |

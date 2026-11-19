<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › HubSpot · <a href="https://docs.yeswecheck.fr/uk/connectors/hubspot">Full documentation</a></sub>

# Connect HubSpot

The HubSpot connector verifies your contacts' email addresses and writes the result on each record, as properties. The principle shared by all connectors is described in [Connectors: how they work](README.md).

## 1. Create a HubSpot service key

You must be a super admin of the HubSpot account, or have the **Developer tools access** permission.

1. In HubSpot, open **Development**.
2. In the left-hand menu, **Keys → Service keys**, then **Create service key**.
3. Name it, for example `YesWeCheck`, and tick these scopes:

| Scope | Used to |
|---|---|
| `crm.objects.contacts.read` | Read contacts and their address |
| `crm.objects.contacts.write` | Write the result on contacts |
| `crm.lists.read` | List your lists and their members |
| `crm.lists.write` | Create and fill the **YWC – invalides** list |
| `crm.schemas.contacts.read` | Check the YesWeCheck properties |
| `crm.schemas.contacts.write` | Create the YesWeCheck properties |

The `communication_preferences.statuses.batch.write` scope is only needed if you turn on the **Unsubscribe invalid addresses** option.

4. Copy the key (it starts with `pat-`).

The list of scopes is also shown, copyable in one click, in the connection form in the customer area. An existing HubSpot *private app* token is accepted in the same way, if it has these scopes. HubSpot stops supporting these tokens in September 2027: before then, replace it with a service key and reconnect HubSpot.

A dedicated key lets you cut off YesWeCheck's access without affecting your other integrations. HubSpot recommends renewing it every six months (**Rotate** button): then reconnect HubSpot with the new key.

## 2. Connect

In the customer area: **Integrate → Integrations → HubSpot**, paste the key, then **Test and connect**. Your HubSpot account name is displayed when the key is accepted. A key that is rejected, or missing a scope, is not saved; the message lists the scopes to tick.

## 3. Clean a list

Choose a contact list (static or active) or **All contacts**, then **Start clean-up**. Three steps:

1. YesWeCheck reads the contacts in HubSpot.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **HubSpot** badge.
3. At the end, the results are written in HubSpot. A notification gives you the summary.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

## What is written in HubSpot

On the first clean-up, YesWeCheck creates the **YesWeCheck** property group and four contact properties if they do not exist:

| Property (internal name) | Label | HubSpot type | Content |
|---|---|---|---|
| `ywc_status` | YWC – Statut | Dropdown select | Valide, Risqué, Invalide or Inconnu (internal values `valid`, `risky`, `invalid`, `unknown`) |
| `ywc_score` | YWC – Score | Number | 0 to 100 |
| `ywc_reason` | YWC – Motif | Dropdown select | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if there is nothing to report |
| `ywc_last_check` | YWC – Dernière vérification | Date | Day of the verification |

To exclude risky addresses from your sends, create an active list in HubSpot filtered on **YWC – Statut** (for example "is any of: Invalide") and exclude it from your marketing emails. The properties can also be used in your workflows and views.

### Options

| Option | Default | Effect in HubSpot |
|---|---|---|
| Group invalid addresses | Off | Adds `invalid` contacts to the **YWC – invalides** static list |
| Unsubscribe invalid addresses | Off | Unsubscribes `invalid` contacts from all email subscription types. An unsubscription cannot be undone without fresh consent from the contact |
| Skip contacts already unsubscribed | On | Contacts unsubscribed from all emails are neither verified nor billed |

## Verify a contact

On the connector page, **Verify a contact**: enter the address of a HubSpot contact. It is verified, SMTP included, the verdict is displayed and the properties are written on their record. The grouping and unsubscribe options apply as for a clean-up. An address not found in HubSpot is not verified and costs no credit.

## Automatically verify new contacts

Turn on **Automatically verify new contacts**, choose the lists to monitor (or **All new contacts**) and a daily limit.

YesWeCheck checks these lists every 5 minutes: each contact that joins them is verified, SMTP included, and their properties are filled in. Contacts already present when the option is turned on are not covered: clean the list for them. The daily limit caps credit consumption; beyond it, the day's new contacts are not verified.

Nothing is installed in HubSpot for this option: turning it off, or disconnecting HubSpot, stops it at once.

## Disconnect

**Disconnect** erases the key at YesWeCheck and stops automatic verification. The `ywc_*` properties already written stay on your contacts; delete them in HubSpot if you no longer want them.

To cut off access immediately, on the HubSpot side, delete the dedicated service key.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | Key incomplete, deleted, expired or replaced after a rotation | Copy the current key from HubSpot and reconnect |
| "The key is valid but does not have all the permissions needed" | A scope was not ticked | Edit the key in HubSpot (**Edit**), tick the listed scopes, then reconnect |
| "The tool is temporarily limiting calls" | HubSpot call quota reached | Processing resumes on its own; otherwise, try again later |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| "No HubSpot contact has this address" | Verifying a contact: address not found in HubSpot | Check the spelling; no credit is debited |
| **Reconnect needed** connection | HubSpot rejects the saved key | Enter a valid key on the connector page |

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Brevo · <a href="https://docs.yeswecheck.fr/uk/connectors/brevo">Full documentation</a></sub>

# Connect Brevo

The Brevo connector verifies your contact lists and writes the result on each contact, as attributes. The principle shared by all connectors is described in [Connectors: how they work](README.md).

## 1. Create a Brevo API key

1. In Brevo, open the account menu (top right), then **SMTP & API**.
2. In the **API keys** tab, click **Generate a new API key**.
3. Name it, for example `YesWeCheck`, and copy it: Brevo only shows it once.

A dedicated key lets you cut off YesWeCheck's access without affecting your other integrations.

> [!NOTE]
> **IP address restriction**
> If blocking of unknown IP addresses is active on your Brevo account, Brevo rejects calls from YesWeCheck until its address is authorised. The address to authorise (IPv4, fixed) is shown in the customer area, on the **Integrate → Integrations → Brevo** page: in the connection form, then in the connection panel once Brevo is connected. One click copies it.
>
> In Brevo: click your name at the top right, then **Security**, **Authorised IPs** tab, and add the address. Do this before connecting; otherwise, the connection is rejected and the message reminds you of the address to authorise.

## 2. Connect

In the customer area: **Integrate → Integrations → Brevo**, paste the key, then **Test and connect**. Your Brevo account name is displayed when the key is accepted. A rejected key is not saved.

## 3. Clean a list

Choose a list, a segment or **All contacts**, then **Start clean-up**. Three steps:

1. YesWeCheck reads the contacts in Brevo.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Brevo** badge.
3. At the end, the results are written in Brevo. A notification gives you the summary.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

## What is written in Brevo

On the first clean-up, YesWeCheck creates four contact attributes if they do not exist:

| Attribute | Brevo type | Content |
|---|---|---|
| `YWC_STATUS` | Text | `valid`, `risky`, `invalid` or `unknown` |
| `YWC_SCORE` | Number | 0 to 100 |
| `YWC_REASON` | Text | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)) |
| `YWC_LAST_CHECK` | Date | Day of the verification |

To exclude risky addresses from your campaigns, create a segment in Brevo on `YWC_STATUS` (for example "is equal to `invalid`") and exclude it from your sends.

### Options

| Option | Default | Effect in Brevo |
|---|---|---|
| Group invalid addresses | Off | Adds `invalid` contacts to the **YWC – invalides** list (**YesWeCheck** folder) |
| Block invalid addresses | Off | Adds `invalid` contacts to the email blocklist. They no longer receive **any** email, transactional included |
| Skip contacts already blocked or unsubscribed | On | These contacts are neither verified nor billed |

## Verify a contact

On the connector page, **Verify a contact**: enter the address of a Brevo contact. It is verified, SMTP included, the verdict is displayed and the attributes are written on the contact. The grouping and blocking options apply as for a clean-up. An address not found in Brevo is not verified and costs no credit.

## Automatically verify new contacts

Turn on **Automatically verify new contacts**, choose the lists to monitor and a daily limit. YesWeCheck then creates an "added to a list" webhook in Brevo (visible in Brevo, in the marketing webhooks section, with the description "YesWeCheck — validation des nouveaux contacts").

Each contact added to a monitored list is verified, SMTP included, and its attributes are filled in within a minute. The daily limit caps credit consumption; beyond it, the day's new contacts are not verified.

Turning the option off, or disconnecting Brevo, deletes this webhook.

## Disconnect

**Disconnect** erases the key at YesWeCheck and deletes the webhook in Brevo. The `YWC_*` attributes already written stay on your contacts; delete them in Brevo if you no longer want them.

To cut off access immediately, on the Brevo side, delete the dedicated API key.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | Incomplete, deleted or deactivated key | Generate a new key and reconnect |
| "Its Authorised IPs option is on" | IP address restriction on the Brevo account | Authorise the YesWeCheck address in Brevo |
| "The tool is temporarily limiting calls" | Brevo call quota reached | Processing resumes on its own; otherwise, try again later |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| **Reconnect needed** connection | Brevo rejects the saved key | Enter a valid key on the connector page |

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Pipedrive · <a href="https://docs.yeswecheck.fr/uk/connectors/pipedrive">Full documentation</a></sub>

# Connect Pipedrive

The Pipedrive connector verifies your people's email addresses and writes the result on each record, in custom fields. The principle shared by all connectors is described in [Connectors: how they work](README.md).

## 1. Copy your Pipedrive API token

1. In Pipedrive, click your avatar at the top right, then **Personal preferences**.
2. Open the **API** tab (direct link: [app.pipedrive.com/settings/api](https://app.pipedrive.com/settings/api)).
3. Copy the personal API token (40 characters).

The token gives access to what its user sees in Pipedrive. Preferably use an **admin**'s token: a user with restricted visibility would only see some of the people, and the first clean-up requires permission to create custom fields.

Each Pipedrive user has only one token. Regenerating it cuts off every integration that uses it, YesWeCheck included: reconnect Pipedrive with the new token.

## 2. Connect

In the customer area: **Integrate → Integrations → Pipedrive**, paste the token, then **Test and connect**. Your Pipedrive company name and the token user's name are displayed when it is accepted. A rejected token is not saved.

## 3. Clean your people

Choose **All people** or one of your Pipedrive people **filters**, then **Start clean-up**. Three steps:

1. YesWeCheck reads the people in Pipedrive.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Pipedrive** badge.
3. At the end, the results are written in Pipedrive. A notification gives you the summary.

A person can have several addresses in Pipedrive: only their **primary address** is verified, and billed. People without an address are ignored.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

### Pipedrive call budget

Pipedrive gives each company a daily call budget, shared by all its integrations. Pipedrive does not allow bulk updates of people: each record updated counts as one call.

YesWeCheck protects this budget: writing results stops when a quarter of it remains, for your other tools, and resumes automatically when Pipedrive renews it. The connector page then shows **Paused**. Nothing is written twice, and only records whose verdict has changed are updated in later clean-ups.

## What is written in Pipedrive

On the first clean-up, YesWeCheck creates four person custom fields if they do not exist:

| Field | Pipedrive type | Content |
|---|---|---|
| YWC – Statut | Single option | Valide, Risqué, Invalide or Inconnu |
| YWC – Score | Numerical | 0 to 100 |
| YWC – Motif | Single option | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if there is nothing to report |
| YWC – Dernière vérification | Date | Day of the verification |

The fields are found by their name: you can move them or show them in your views. A deleted field is recreated at the next clean-up.

To set risky addresses aside, create a people filter in Pipedrive on **YWC – Statut** (for example "is Invalide") and use it in your views, automations or campaigns.

### Options

| Option | Default | Effect in Pipedrive |
|---|---|---|
| Group invalid addresses | Off | Adds the **YWC – invalide** label (red) to `invalid` people, without removing their other labels |

## Verify a contact

On the connector page, **Verify a contact**: enter a Pipedrive person's primary address. It is verified, SMTP included, the verdict is displayed and the fields are written on their record. The label option applies as for a clean-up. An address not found in Pipedrive, or that is only a person's secondary address, is not verified and costs no credit.

## Automatically verify new people

Turn on **Automatically verify new contacts**, choose the sources to monitor (**All new people**, or one or more filters) and a daily limit.

YesWeCheck checks Pipedrive every 5 minutes: each person created since the option was turned on, and present in a monitored source, is verified, SMTP included, and their fields are filled in. People already present when the option is turned on are not covered: clean the source for them. The daily limit caps credit consumption; beyond it, the day's new people are not verified.

Nothing is installed in Pipedrive for this option: turning it off, or disconnecting Pipedrive, stops it at once.

## Disconnect

**Disconnect** erases the token at YesWeCheck and stops automatic verification. The **YWC** fields and the label already written stay on your people; delete them in Pipedrive if you no longer want them.

To cut off access immediately, on the Pipedrive side, regenerate the user's API token.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | Incomplete token, or regenerated since in Pipedrive | Copy the current token from Pipedrive and reconnect |
| "The Pipedrive token is valid but its user lacks the permission needed" | The token's user cannot create a field or label, or edit people | Reconnect with an admin's token |
| "Your account's daily call budget is almost used up" | The day's Pipedrive budget is almost used up | A running clean-up resumes on its own; otherwise, try again the next day |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| "No Pipedrive person has this address as their main email" | Verifying a contact: address not found, or only secondary | Check the spelling or enter the primary address; no credit is debited |
| **Reconnect needed** connection | Pipedrive rejects the saved token | Enter a valid token on the connector page |

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Mailjet · <a href="https://docs.yeswecheck.fr/uk/connectors/mailjet">Full documentation</a></sub>

# Connect Mailjet

The Mailjet integration verifies your contacts, or one of your lists, and writes the result on each contact, in four contact properties. The principle shared by all integrations is described in [Integrations: how they work](README.md).

## 1. Copy your API key and secret key

1. In Mailjet, open the account menu, then **Account settings**.
2. In the **REST API settings** section, open **API key management** (direct link: [app.mailjet.com/account/apikeys](https://app.mailjet.com/account/apikeys)).
3. Copy the **API key** and the **secret key** of the account whose contacts you want to verify.

In Mailjet, each sub-account has its own keys and its own contacts: use the key of the sub-account to clean. The main account's key only sees the main account's contacts.

If you regenerate the secret key in Mailjet, YesWeCheck can no longer connect: reconnect Mailjet with the new one.

## 2. Connect

In the customer area: **Integrate → Integrations → Mailjet**, paste the API key and the secret key, then **Test and connect**. The name of your Mailjet account (and of the sub-account, if any) is shown when the keys are accepted. Rejected keys are not saved.

## 3. Clean your contacts

Choose **All contacts** or one of your **lists**, then **Start clean-up**. Three steps:

1. YesWeCheck reads the contacts in Mailjet.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Mailjet** badge.
3. At the end, the results are written in Mailjet. A notification gives you the summary.

Contacts **excluded from campaigns**, those who reported you as **spam** and, for a list, those who **unsubscribed** from it are skipped, and not charged, as long as the **Skip contacts excluded from campaigns or unsubscribed** option is on (default).

Results are written contact by contact: Mailjet has no bulk write that leaves out contacts deleted in the meantime. Allow about 25,000 contacts updated per hour, after verification. An interrupted clean-up resumes on its own where it stopped, and later clean-ups only rewrite contacts whose verdict has changed.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

## What is written in Mailjet

At the first clean-up, YesWeCheck creates four contact properties if they do not exist:

| Property | Mailjet type | Content |
|---|---|---|
| `ywc_status` | Text | `valid`, `risky`, `invalid` or `unknown` |
| `ywc_score` | Decimal number | 0 to 100 |
| `ywc_reason` | Text | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if nothing to report |
| `ywc_last_check` | Date | Date and time of the verification |

A property deleted in Mailjet is recreated at the next clean-up.

To set aside risky addresses, create a segment in Mailjet on the `ywc_status` property (for example "is equal to `invalid`") and exclude it from your campaigns.

### Options for invalid addresses

All are off by default.

| Option | Effect in Mailjet |
|---|---|
| Group invalid addresses | Adds `invalid` contacts to the **YWC – invalides** list, as **unsubscribed** from that list: a campaign sent to this list by mistake goes to no one. Their other lists do not change |
| Unsubscribe invalid addresses from the list | Unsubscribes `invalid` contacts from the **cleaned list**, or from the watched list they arrived in. For a clean-up of **All contacts** and for **Verify a contact**, they are unsubscribed from all their lists. They stay in your contacts |
| Exclude invalid addresses from campaigns | Ticks **Excluded from campaigns** on `invalid` contacts: no more campaigns go to them, whatever the list. Transactional emails (send API) still go through. Reversible at any time from the contact record |

## Verify a contact

On the integration page, **Verify a contact**: enter the address of a Mailjet contact. It is verified, SMTP included, the verdict is shown and the properties are written on the contact. The options above apply as for a clean-up. An address not in Mailjet is not verified and costs no credit.

## Automatically verify new contacts

Turn on **Automatically verify new contacts**, choose the sources to watch (**All new contacts**, or one or more lists) and a daily limit.

YesWeCheck checks Mailjet every 5 minutes:

- with **All new contacts**, every contact created since activation (sign-up form, import, API, other integration) is verified;
- with a **list**, every contact added to the list since activation is verified, including a contact that already existed in your account.

Verification includes SMTP, and the properties are filled in straight away. A contact arriving through several watched sources is verified, and charged, only once. Contacts already present at activation are not affected: clean the list for them. The daily limit caps credit usage; beyond it, the day's new contacts are not verified.

Nothing is installed in Mailjet for this option: turning it off, or disconnecting Mailjet, stops it immediately.

## Disconnect

**Disconnect** erases the keys at YesWeCheck and stops automatic verification. The `ywc_*` properties and the **YWC – invalides** list stay in your account; delete them in Mailjet if you no longer want them.

To cut off access immediately, on the Mailjet side, regenerate the secret key in **API key management**.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | API key or secret key incomplete, or secret key regenerated since | Copy both current keys in Mailjet and reconnect |
| "Your Mailjet account already has a ywc_… contact property of another type" | A property with the same name exists with another type (integer instead of decimal, for example) | Delete it in Mailjet; it will be recreated at the next clean-up |
| "The tool is temporarily limiting calls" | Mailjet call quota reached, often by another integration on the same key | Processing resumes on its own; otherwise try again later |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| "No Mailjet contact has this address" | Contact verification: address not in the account (or in another sub-account) | Check the spelling and the connected sub-account; no credit is charged |
| Connection **Reconnect needed** | Mailjet rejects the saved keys | Enter valid keys on the integration page |

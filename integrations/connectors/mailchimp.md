<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Mailchimp · <a href="https://docs.yeswecheck.fr/uk/connectors/mailchimp">Full documentation</a></sub>

# Connect Mailchimp

The Mailchimp integration verifies the email address of the contacts in your audiences and writes the result on each contact, in merge fields or as tags. The principle shared by all integrations is described in [Integrations: how they work](README.md).

## 1. Create a Mailchimp API key

1. In Mailchimp, click your profile icon, then **Profile**.
2. Open **Extras → API keys** (direct link: [admin.mailchimp.com/account/api](https://admin.mailchimp.com/account/api/)).
3. Click **Create A Key**, name it "YesWeCheck" and copy it: Mailchimp will not show it again.

The key ends with your Mailchimp server code (for example `-us21`): copy it in full. It acts with the permissions of the user who created it; preferably create it from an **Admin** or **Owner** user of the account.

## 2. Connect

In the customer area: **Integrate → Integrations → Mailchimp**, paste the key, then **Test and connect**. The name of your Mailchimp account is shown when the key is accepted. A rejected key is not saved.

## 3. Clean an audience

Choose an **audience**, or a **segment** or a **tag** of an audience, then **Start clean-up**. Three steps:

1. YesWeCheck reads the contacts in Mailchimp.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Mailchimp** badge.
3. At the end, the results are written in Mailchimp. A notification gives you the summary.

Contacts **cleaned** by Mailchimp (hard bounces) and **unsubscribed** contacts are skipped, and not charged, as long as the **Skip contacts already cleaned or unsubscribed** option is on (default). Archived contacts are not read.

The same address in two audiences is two contacts in Mailchimp: each audience is cleaned separately.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

## What is written in Mailchimp

### Merge fields (default)

At the first write to an audience, YesWeCheck creates four merge fields in it if they do not exist. They are **hidden** from your signup forms.

| Field (tag) | Mailchimp type | Content |
|---|---|---|
| YWC – Statut (`YWC_STATUS`) | Dropdown | Valide, Risqué, Invalide or Inconnu |
| YWC – Score (`YWC_SCORE`) | Number | 0 to 100 |
| YWC – Motif (`YWC_REASON`) | Dropdown | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if nothing to report |
| YWC – Dernière vérification (`YWC_DATE`) | Date | Day of the verification |

To set aside risky addresses, create a segment in Mailchimp on **YWC – Statut** (for example "is Invalide") and exclude it from your campaigns. The merge tags can also be used in your emails (`*|YWC_STATUS|*`).

An audience holds a limited number of merge fields. If it has no room left, YesWeCheck tells you: delete an unused field, or switch to **tags only**.

### Incomplete postal addresses

> [!IMPORTANT]
> **Mailchimp-specific behaviour**
> When a contact's postal address is **half filled in** (the street, city or postcode is missing), Mailchimp shifts its parts at the next update of the record, whatever tool changes it: the city moves into "State", "USA" appears in the postcode…

To keep your addresses from moving, YesWeCheck rereads each contact's address just before writing its fields. If it is half filled in, YesWeCheck sends it back **as it is shown in Mailchimp**, putting a dash `-` in the empty boxes (street, city, state or postcode). The dash stops the shift. You can complete the address later: a complete address is never changed again.

Contacts **without** a postal address, and those whose address is complete, are not affected: YesWeCheck then sends no address.

If you prefer YesWeCheck not to change any field on your records, turn on **Write results as tags only**.

### Tags only

With the **Write results as tags only** option, no field is created or changed, and the postal address is never sent back. Each contact receives a tag based on its verdict:

| Tag | Verdict |
|---|---|
| YWC : Valide | `valid` |
| YWC : Risqué | `risky` |
| YWC : Invalide | `invalid` |
| YWC : Inconnu | `unknown` |

When the verdict changes, the old tag is removed. The score, reason and date are not written in this mode. Switching mode rewrites all contacts at the next clean-up.

### Options for invalid addresses

All are off by default.

| Option | Effect in Mailchimp |
|---|---|
| Group invalid addresses | Adds the **YWC – invalide** tag to `invalid` contacts, without removing their other tags (not applicable in tags mode: **YWC : Invalide** plays this role) |
| Unsubscribe invalid addresses | Sets `invalid` contacts to the **Unsubscribed** status. They stay in the audience, and in your Mailchimp contact count; only the contact can resubscribe themselves |
| Archive invalid addresses | Archives `invalid` contacts: they leave the audience and are no longer counted in your Mailchimp plan from the next billing period (Mailchimp bills the period's peak number of contacts). Their history is kept; you can restore them from Mailchimp |

Archiving comes last: an archived contact first receives its fields or its tag.

## Verify a contact

On the integration page, **Verify a contact**: enter an address. YesWeCheck looks for it in all your audiences, verifies it once, SMTP included, and writes the result on each contact holding it (one per audience): a single credit. The options above apply as for a clean-up. An address not in Mailchimp is not verified and costs no credit.

## Automatically verify new subscribers

Turn on **Automatically verify new contacts**, choose the audiences to watch and a daily limit.

YesWeCheck checks Mailchimp every 5 minutes: every contact subscribed since activation to a watched audience (form, import, manual addition or other integration) is verified, SMTP included, and its result written. A double opt-in contact is verified as soon as they confirm their subscription. Contacts already present at activation are not affected: clean the audience for them. The daily limit caps credit usage; beyond it, the day's new subscribers are not verified.

Nothing is installed in Mailchimp for this option: turning it off, or disconnecting Mailchimp, stops it immediately. Segments cannot be watched, only audiences.

## Disconnect

**Disconnect** erases the key at YesWeCheck and stops automatic verification. The **YWC** fields and tags already written stay on your contacts; delete them in Mailchimp if you no longer want them.

To cut off access immediately, on the Mailchimp side, disable or delete the API key in **Profile → Extras → API keys**.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | Key incomplete (the `-us…` suffix is missing), disabled or deleted in Mailchimp | Copy the whole key, or create a new one, and reconnect |
| "This Mailchimp audience has reached its merge field limit" | No room left for the four YWC fields | Delete an unused field, or turn on **Write results as tags only** |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| "No Mailchimp contact has this address" | Contact verification: address not in your audiences, or archived | Check the spelling; no credit is charged |
| Connection **Reconnect needed** | Mailchimp rejects the saved key | Enter a valid key on the integration page |

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Klaviyo · <a href="https://docs.yeswecheck.fr/uk/connectors/klaviyo">Full documentation</a></sub>

# Connect Klaviyo

The Klaviyo integration verifies your profiles, one of your lists or one of your segments, and writes the result on each profile, in four custom properties. The principle shared by all integrations is described in [Integrations: how they work](README.md).

## 1. Create a private API key

You must be an owner, admin or manager of the Klaviyo account.

1. In Klaviyo, click your account name at the bottom left, then **Settings → API keys** (direct link: [klaviyo.com/settings/account/api-keys](https://www.klaviyo.com/settings/account/api-keys)).
2. **Create Private API Key**, and name it `YesWeCheck`, for example.
3. Choose custom access and grant these permissions:

| Permission | Level | Used to |
|---|---|---|
| Accounts | Read Access | Show your account name |
| Lists | Full Access | List your lists, create and fill the **YWC – invalides** list, remove a profile from a list |
| Profiles | Full Access | Read profiles and write the result on them |
| Segments | Read Access | List your segments and their profiles |
| Subscriptions | Full Access | **Suppress invalid addresses in Klaviyo** option |

4. Copy the key (it starts with `pk_`). Klaviyo will not show it again.

The list of permissions is also shown, copyable in one click, in the connection form in the customer area. A full-access key works too. A Klaviyo key's permissions cannot be changed: if one is missing, create a new key and reconnect Klaviyo.

## 2. Connect

In the customer area: **Integrate → Integrations → Klaviyo**, paste the key, then **Test and connect**. The name of your Klaviyo account is shown when the key is accepted. A rejected key, or one missing a permission, is not saved; the message lists the permissions to grant.

## 3. Clean your profiles

Choose **All profiles**, one of your **lists** or one of your **segments**, then **Start clean-up**. Three steps:

1. YesWeCheck reads the profiles in Klaviyo.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Klaviyo** badge.
3. At the end, the results are written in Klaviyo. A notification gives you the summary.

Profiles that are **suppressed** (in the Klaviyo sense: bounce, complaint, manual suppression) and **unsubscribed** from marketing emails are skipped, and not charged, as long as the **Skip suppressed or unsubscribed profiles** option is on (default). Profiles without an email address (SMS only) are skipped.

Results are written through bulk imports, one identified profile at a time: a profile deleted in Klaviyo between reading and writing is never recreated. An interrupted clean-up resumes on its own, and later clean-ups only rewrite profiles whose verdict has changed.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

## What is written in Klaviyo

Four custom properties, added to the profile at the first write (nothing to create in advance):

| Property | Content |
|---|---|
| `ywc_status` | `valid`, `risky`, `invalid` or `unknown` |
| `ywc_score` | 0 to 100 |
| `ywc_reason` | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if nothing to report |
| `ywc_last_check` | Date and time of the verification (ISO 8601, UTC) |

To set aside risky addresses, create a segment in Klaviyo on the `ywc_status` property (for example "equals `invalid`") and exclude it from your campaigns, or use the property as a condition in a flow.

### Options for invalid addresses

All are off by default.

| Option | Effect in Klaviyo |
|---|---|
| Group invalid addresses | Adds `invalid` profiles to the **YWC – invalides** list. Their other lists and their consent do not change: it is a marker for your segments, not a block. Do not target this list in a campaign |
| Remove invalid addresses from the list | Removes `invalid` profiles from the **cleaned list**, or from the watched list they arrived in. For a clean-up of **All profiles** and for **Verify a contact**, they are removed from all their lists, except **YWC – invalides**. No effect on a segment, which recalculates itself. The profile and its consent do not change |
| Suppress invalid addresses in Klaviyo | Sets `invalid` profiles to **suppressed**: no more marketing emails go to them, whatever the list, and Klaviyo no longer counts them in the active profiles of your plan. The profile remains, with its history; suppression can be undone from Klaviyo |

## Verify a contact

On the integration page, **Verify a contact**: enter the address of a Klaviyo profile. It is verified, SMTP included, the verdict is shown and the properties are written on the profile. The options above apply as for a clean-up. An address not in Klaviyo is not verified and costs no credit.

## Automatically verify new profiles

Turn on **Automatically verify new contacts**, choose the sources to watch (**All new profiles**, one or more lists, one or more segments) and a daily limit.

YesWeCheck checks Klaviyo every 5 minutes:

- with **All new profiles**, every profile created since activation (sign-up form, import, API, other integration) is verified;
- with a **list** or a **segment**, every profile that has entered since activation is verified, including a profile that already existed in your account.

Verification includes SMTP, and the properties are filled in straight away. A profile arriving through several watched sources is verified, and charged, only once. Profiles already present at activation are not affected: clean the source for them. The daily limit caps credit usage; beyond it, the day's new profiles are not verified.

A segment whose profiles often enter and leave (recent engagement, for example) triggers a verification at each entry: prefer a list or **All new profiles** if you want each address verified only once.

Nothing is installed in Klaviyo for this option: turning it off, or disconnecting Klaviyo, stops it immediately.

## Disconnect

**Disconnect** erases the key at YesWeCheck and stops automatic verification. The `ywc_*` properties and the **YWC – invalides** list stay in your account; delete them in Klaviyo if you no longer want them.

To cut off access immediately, on the Klaviyo side, delete the key in **Settings → API keys**.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | Key incomplete, or deleted in Klaviyo | Create a private key and reconnect |
| "The key is valid but does not have all the permissions needed" | A permission from the table above is missing | Create a new key with these permissions (Klaviyo does not let you add any to an existing key) |
| "The tool is temporarily limiting calls" | Klaviyo call quota reached, often shared with your other integrations | Processing resumes on its own; otherwise try again later |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| "No Klaviyo contact has this address" | Contact verification: address not in the account | Check the spelling; no credit is charged |
| Connection **Reconnect needed** | Klaviyo rejects the saved key | Enter a valid key on the integration page |

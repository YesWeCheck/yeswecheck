<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Positive User · <a href="https://docs.yeswecheck.fr/uk/connectors/positive-user">Full documentation</a></sub>

# Connect Positive User

The Positive User integration verifies the email address of the contacts in your **User.com** workspace and writes the result on each contact, in four custom attributes. The principle shared by all integrations is described in [Integrations: how they work](README.md).

> [!NOTE]
> **Positive User and Sarbacane**
> Sarbacane is now called Positive User. The integration works with the **User.com** platform (your workspace opens at an address `your-workspace.user.com`), the one new customers are onboarded to. The former Sarbacane interface has a separate API, which this integration does not cover.

## 1. Create a public API key

1. In Positive User, open **Settings → Workspace settings → API & Integrations → Public API**.
2. Generate a key, name it "YesWeCheck" and copy it (64 characters).
3. Note your **workspace address**, the one shown in your browser: `your-workspace.user.com`.

## 2. Connect

In the customer area: **Integrate → Integrations → Positive User**. Paste the workspace address (`your-workspace.user.com`, or the full address copied from the browser) and the key, then **Test and connect**. Your workspace name is shown when the key is accepted. A rejected key is not saved.

## 3. Clean contacts

Choose **All contacts**, a **list**, a **tag** or a **segment**, then **Start clean-up**. Three steps:

1. YesWeCheck reads the contacts in Positive User.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Positive User** badge.
3. At the end, the results are written in Positive User. A notification gives you the summary.

Contacts that are **unsubscribed**, **hard bounced**, reported as **spam** or whose address is **banned** are skipped, and not charged, as long as the **Skip contacts already blocked or unsubscribed** option is on (default). Visitors without an email address are neither verified nor charged.

The same address held by several contacts (a visitor who later signed up, two imports…) is verified and charged only once; the result is written on each of them.

Only one batch can run at a time in an organisation: a clean-up waits for a running batch to finish.

## What is written in Positive User

At the first clean-up, YesWeCheck creates four custom contact attributes if they do not exist.

| Attribute | Type | Content |
|---|---|---|
| YWC – Statut | Choice list | Valide, Risqué, Invalide or Inconnu |
| YWC – Score | Integer | 0 to 100 |
| YWC – Motif | Text | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if nothing to report |
| YWC – Dernière vérification | Date | Day of the verification |

To set aside risky addresses, create a segment on **YWC – Statut** (for example "is Invalide") and exclude it from your campaigns, or use the attribute in your automation scenarios.

> [!IMPORTANT]
> **Do not change the choices of "YWC – Statut"**
> Positive User silently erases a value that is not among an attribute's choices. If one of the four choices (Valide, Risqué, Invalide, Inconnu) is deleted or renamed, YesWeCheck stops writing and tells you: restore the choice, or delete the attribute so that it is recreated at the next clean-up.

### Options for invalid addresses

All are off by default.

| Option | Effect in Positive User |
|---|---|
| Group invalid addresses | Adds the **YWC – invalide** tag to `invalid` contacts, without removing their other tags |
| Unsubscribe invalid addresses | Sets `invalid` contacts to **unsubscribed** from emails. This status appears in the contact's consent history as if they had unsubscribed themselves |
| Ban invalid addresses | Adds the address of `invalid` contacts to the workspace's **banned addresses**: no more emails go to it, on every record that holds it. The contact's consent is not changed; an address can be removed from the list at any time in Positive User |

## Verify a contact

On the integration page, **Verify a contact**: enter an address. YesWeCheck looks for every contact holding it, verifies it once, SMTP included, and writes the result on each of them: a single credit. The options above apply as for a clean-up. An address not in Positive User is not verified and costs no credit.

## Automatically verify new contacts

Turn on **Automatically verify new contacts**, choose the sources to watch (**All new contacts**, lists or tags) and a daily limit.

YesWeCheck checks Positive User every 5 minutes: every contact **created since activation** with an email address (form, import, API, other integration) is verified, SMTP included, if it enters a watched source, and its result written. A visitor created after activation who leaves their address later is verified at that point.

Not affected: contacts already present at activation, including an older visitor who later leaves their address or an older contact added to a list. Clean the source for them. Segments cannot be watched. The daily limit caps credit usage; beyond it, the day's new contacts are not verified.

Nothing is installed in Positive User for this option: turning it off, or disconnecting the tool, stops it immediately.

## Disconnect

**Disconnect** erases the key at YesWeCheck and stops automatic verification. The **YWC** attributes, the tag and the banned addresses stay in your workspace; delete them in Positive User if you no longer want them.

To cut off access immediately, on the Positive User side, delete the key in **Settings → Workspace settings → API & Integrations → Public API**.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "The tool rejected the key" | Key incomplete, deleted or from another workspace | Copy the whole key, or create a new one, and reconnect |
| "Workspace address not recognised" | The address entered is not in the form `your-workspace.user.com` | Copy the address shown by your browser in Positive User |
| "No Positive User workspace at this address" | Typo in the workspace address | Check the address and reconnect |
| "The YWC – Statut attribute has lost one of its choices" | One of the attribute's choices was deleted or renamed | Restore it, or delete the attribute so that it is recreated |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| "No Positive User contact has this address" | Contact verification: address not in the workspace | Check the spelling; no credit is charged |
| Connection **Reconnect needed** | Positive User rejects the saved key | Enter a valid key on the integration page |

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Integrations</a> › Google Sheets · <a href="https://docs.yeswecheck.fr/uk/connectors/google-sheets">Full documentation</a></sub>

# Connect Google Sheets

The Google Sheets connector verifies the addresses in a column of your sheet and writes the result on each row, in columns added to the right of your data. The principle shared by all connectors is described in [Connectors: how they work](README.md).

## 1. Connect your Google account

You must be an owner or administrator of the YesWeCheck organisation.

1. In your YesWeCheck area, open **Integrations → Google Sheets**.
2. Click **Sign in with Google** and choose your account.
3. On the Google screen, **leave ticked** the permission to access the Google Drive files you choose: without it, no sheet can be verified.

You return to the connector page, which shows your Google account name.

YesWeCheck does not get access to your Drive: only to the files you then choose, one by one, in the Google picker.

## 2. Add a sheet

1. **Add a sheet** opens the Google picker on your Google Sheets files. Choose the file.
2. Choose the **tab**, then the **email column**. YesWeCheck suggests the most likely column (header "Email", "E-mail", "Courriel"… or the column containing the most addresses).
3. **Save sheet**.

The first row of the tab must contain the column headers. If it already contains data, insert a header row before adding the sheet.

Only the person who connected the Google account can add sheets: the picker shows their Google Drive. The organisation's other administrators can start verifications and adjust the options.

You can save up to 30 sheets. **Remove** stops using a sheet; nothing is deleted from the file.

## 3. Verify a sheet

Choose a sheet, then **Start verification**. Three steps:

1. YesWeCheck reads the email column.
2. The addresses are verified like a batch: you follow progress in **Batch processing**, where the batch carries the **Google Sheets** badge.
3. At the end, the results are written in the sheet. A notification gives you the summary.

Only one batch can run at a time in an organisation: a verification waits for a running batch to finish.

## What is written in the sheet

On the first verification, four columns are added to the right of the last filled column, with their header:

| Column | Content |
|---|---|
| **YWC statut** | `valid`, `risky`, `invalid` or `unknown` |
| **YWC score** | 0 to 100 |
| **YWC motif** | Reason (see [the list of reasons](README.md#what-is-written-on-each-contact)), empty if there is nothing to report |
| **YWC vérifié le** | Day of the verification, in the sheet's date format |

- The verdict follows the **address**, not the row number: you can sort the sheet or insert rows during the verification.
- An address present on several rows gets the same verdict on each; it is only verified and billed once.
- If you move the YWC columns, they are found again by their header. If you delete them, the next verification recreates them.
- Each verification rewrites the four columns for all the addresses in the sheet.
- Empty cells or cells without an address are ignored. A "First Last &lt;address&gt;" cell is read as the address between the angle brackets.

To keep only safe addresses, filter the sheet on **YWC statut** (for example `valid`).

## Automatically verify added rows

Turn on **Automatically verify added rows**, choose the sheets to monitor and a daily limit.

YesWeCheck checks these sheets every 5 minutes: each row added **at the bottom** of the sheet is verified, SMTP included, and its YWC columns are filled in. Rows already present when the option is turned on are not covered: start a verification for them. A row inserted in the middle of the sheet is not detected. The daily limit caps credit consumption; beyond it, the day's added rows are not verified.

## Disconnect

**Disconnect** revokes YesWeCheck's access at Google and stops automatic verification. Columns already written stay in your sheets.

You can also remove access from your Google account: **Manage your Google Account → Security → Your connections to third-party apps & services → YesWeCheck**. The connector then switches to **Reconnect needed**.

## Troubleshooting

| Message | Cause | What to do |
|---|---|---|
| "Google did not grant access to the files" | The file access permission was unticked on the Google screen | Reconnect, leaving it ticked |
| "The connected Google account can no longer access this file" | The file changed owner, or access to the file was removed | Add the sheet again with **Add a sheet** |
| "This file cannot be found" | File deleted or in the bin | Restore it, or remove the sheet |
| "This tab no longer exists in the file" | Tab deleted (renaming it is not a problem) | Remove the sheet, then add it again |
| "The first row of the tab must contain the column headers" | No header row | Insert a header row, then add the sheet |
| "Only the person who connected the Google account can choose files" | Another administrator clicked **Add a sheet** | Ask the person who connected the account, or reconnect with your own Google account |
| "A batch is already running" | Another batch is running in the organisation | Wait for it to finish |
| **Reconnect needed** connection | Access removed at Google | Click **Sign in with Google** |

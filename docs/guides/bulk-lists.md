<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Docs</a> › Bulk lists · <a href="https://docs.yeswecheck.fr/uk/guides/batch">Full documentation</a></sub>

# Batch processing

To clean up an existing list (customer base, prospect file, newsletter subscribers), import it into **Batch processing** in the dashboard. Addresses are verified with the same checks and the same verdict rules as the API.

> [!NOTE]
> **Available from the dashboard**
> Batch processing is run from [app.yeswecheck.fr](https://app.yeswecheck.fr/uk). Its HTTP routes only accept a dashboard session and **no API key**: they are not part of the public API. To verify addresses as they come in from a server, use [`POST /v2/email/validate`](signup-validation.md).

<a id="prepare-the-file"></a>

## Prepare the file

| Constraint | Value |
|---|---|
| Formats | CSV or text (`.csv`, `.txt`), one address per line for a text file |
| CSV separator | Detected automatically (`,`, `;`, tab) |
| Maximum size | 15 MB |
| Rows | 500,000 at most |
| Concurrent jobs | One active batch at a time per organisation |

Export an Excel workbook to CSV before importing it. Only the address column is checked. To match the results to your database, choose at import the column that holds your identifier (customer number, CRM ID…): its value is returned as is in the `client_id` column of the export.

## Run a batch

<ol>
  <li><strong>Import</strong>: a preview shows the first rows, and the detected address column and identifier column. Correct them if needed, including afterwards from the summary, without re-importing the file.</li>
  <li><strong>Choose the options</strong> (table below).</li>
  <li><strong>Track</strong>: progress, counters per verdict and estimated time remaining update live. You can leave the page, pause, resume or cancel.</li>
  <li><strong>Export</strong> the results and the PDF report.</li>
</ol>

| Option | Default | Effect |
|---|---|---|
| SMTP check | enabled | Confirms that mailboxes exist; 1 credit per conclusive address |
| Deduplication | enabled | An address that appears several times is verified and billed only once; the export keeps the first row and its identifier. Disable it if every identifier must come out |
| Second pass | disabled | Re-verifies later the addresses that stayed `unknown` (greylisting, slow servers); makes the batch longer |
| Reference country | none | Country used for the presumed age when the list is single-country on generic domains |
| Audit mode | disabled | Quality report on a sample, without row-by-row results (see below) |
| Label | — | Name of the batch in the history |

<a id="how-it-works"></a>

## How it works

| Phase | What happens |
|---|---|
| Pre-analysis | Syntax, DNS, disposable addresses, typos, trap domains… for every row. Fast. |
| SMTP | Dialogue with the mail servers, spread by domain and paced to respect each provider. This is the longest phase. |
| Second pass | If enabled: a new attempt on the `unknown` addresses, after a delay. |

The duration depends mainly on the share of large providers (Gmail, Outlook, Yahoo…). Expect anything from a few minutes for a small list without SMTP to several hours for hundreds of thousands of addresses with SMTP.

## Credits

Same rules as the API: 1 credit per address verified with SMTP whose final verdict is not `unknown`. `unknown` addresses are refunded when the batch closes. If the balance runs out along the way, the batch **continues without SMTP** for the remaining rows instead of failing, and the report says so. See [Credits](../credits.md).

<a id="audit-mode"></a>

## Audit mode

Audit mode answers "what is my list worth?" before you pay for full processing: pre-analysis covers the whole list, SMTP a representative sample, and the report estimates deliverability, with a margin of error, by provider.

Row-by-row results stay locked. You can **unlock** full processing within 30 days of the audit: the credits are then debited and the results become exportable, for the retention period chosen by your organisation (see [Result retention](#result-retention)).

<a id="export"></a>

## Export

You configure the export before generating it:

| Setting | Choices |
|---|---|
| Format | CSV, Excel (`.xlsx`), text (one address per line), JSON, NDJSON |
| Content | Full (all columns), simplified (`row_id`, `client_id`, `email`, `result`, `notes`, `correction_typo`) or custom |
| Verdicts | All rows, or only certain verdicts (for example `valid` only for a campaign) |
| Split | One file, or one file per verdict |
| Custom columns | Choice, order and renaming of columns (`row_id`, `email` and `result` are always included) |
| CSV options | Separator (comma, semicolon, tab), UTF-8 encoding with or without BOM, `true`/`false` or `1`/`0` booleans, ISO or local date format |

Large exports are prepared in the background: a download link, valid for 48 hours, is sent to you by email. The **PDF report** summarises the quality of the list: verdict breakdown, rejection causes, providers, recommendations.

### Full export columns

| Column | Content |
|---|---|
| `row_id` | Row identifier specific to the batch: `<job>_row_<N>` (N = position of the row in your file) without an identifier column, otherwise a non-reversible hash of your identifier |
| `client_id` | Your identifier, as it appears in the column chosen at import. The key for merging back into your database. Absent if no identifier column was chosen |
| `email` | Address as imported |
| `result` | Verdict: `valid`, `risky`, `invalid`, `unknown` |
| `score` | Score from 0 to 100 |
| `notes` | Readable reason for the verdict, with the typo or the trap domain as additional information |
| `smtp_result` | SMTP result: `valid`, `invalid`, `unknown` |
| `smtp_reason` | SMTP reason code (`MAILBOX_NOT_FOUND`, `ACCEPT_ALL_DOMAIN`…) |
| `syntax_valid` · `dns_valid` | Correct syntax · reachable domain |
| `disposable` | Disposable address |
| `malicious_domain` | Malicious domain |
| `role_account` | Generic account |
| `profanity` | Offensive term |
| `random_string` | Random local part |
| `is_alias` | Sub-addressing |
| `typo_domain` | Likely typo in the domain |
| `typo_suggestion` | Suggested domain (empty if the intended domain no longer receives mail) |
| `correction_typo` | Corrected address **verified as deliverable** (with SMTP only) |
| `typosquat` | Trap domain |
| `free_provider` · `business_email` | Consumer provider · business address |
| `whitelisted` · `blacklisted` | On your allowlist · blocklist |
| `first_name` · `last_name` · `gender` | Inferred first name, last name, gender |
| `presumed_age` · `age_range` | Presumed age, age range |
| `validated_at` | Verification date (ISO 8601) |
| `processing_ms` | Processing time for the row |
| `aliasing_note` | Warning about heavy alias use on the same mailbox |

<a id="result-retention"></a>

## Result retention

Detailed results are kept for **7 days** after the batch ends, then deleted. To keep them longer, choose **30 days** in **Settings → Preferences → Batch processing retention** (restricted to the organisation's owner and administrators).

| Setting | Results downloadable | Email reminders before deletion |
|---|---|---|
| 7 days (default) | 7 days after the batch ends | 2 days and 1 hour before |
| 30 days | 30 days after the batch ends | 7 days, 2 days and 1 hour before |

The setting applies to the whole organisation and to batches that finish after the change; a batch that has already finished keeps its deletion date, shown in the history. An audit that has not been unlocked is kept for 30 days in both cases; once unlocked, it follows the organisation's setting.

Export what you need within this period. Export downloads can be protected by a download PIN in **Settings → Security**.

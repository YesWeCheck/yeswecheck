<sub><a href="../README.md">YesWeCheck</a> › <a href="README.md">Docs</a> › FAQ · <a href="https://docs.yeswecheck.fr/uk/faq">Full documentation</a></sub>

# Frequently asked questions

## Results

<a id="why-is-my-address-unknown"></a>

### Why is my address `unknown`?

The mail server did not allow a conclusion. The cause is in `features.smtp.reasonCode`:

- `ACCEPT_ALL_DOMAIN`: the domain accepts any address, so the mailbox's existence cannot be proven;
- `GREYLISTED`: the server asks you to try again later;
- `TIMEOUT`, `NETWORK_ERROR_ETIMEDOUT`: the server was too slow or unreachable;
- `SMTP_INCONCLUSIVE`: the server replied without settling the question (temporary rejection, ambiguous response).

An `unknown` is never billed. Verify again later for greylisting, timeouts and `SMTP_INCONCLUSIVE`; for an accept-all domain, the result will not change. See [Verdicts and score](verdicts.md#unknown-no-conclusion-no-credit).

<a id="is-an-accept-all-domain-valid"></a>

### Is an accept-all domain valid or not?

Neither: the verdict is `unknown`, with `features.catchAll` and the `CATCH_ALL_DOMAIN` warning. Many companies set up their email this way, and the address is often good, but nothing proves it. If you need a firm decision, a [policy](guides/policies-and-lists.md) can reject accept-all domains (`reject_catch_all`).

<a id="valid-but-the-mailbox-does-not-exist"></a>

### I get `valid` but the mailbox does not exist

Check that the key has **SMTP enabled**. Without SMTP, `valid` only means "well-formed address and reachable domain": the mailbox's existence is not tested. `features.smtp` is absent from the response when SMTP is disabled.

<a id="verdict-surprises-me"></a>

### A verdict surprises me: what should I send to support?

The `debug_ref` reference from the response (for example `YWC-7KQ2M9AB`) and the checked address, to [contact@yeswecheck.fr](mailto:contact@yeswecheck.fr). With it, we can look up how that address was processed for 90 days. For bulk processing, give the file name and the address. See [the support reference](response.md#debug-ref).

<a id="smtp-true-but-no-smtp-check"></a>

### I send `"smtp": true` but no SMTP check runs

With an API key, the `smtp` field in the body is ignored: the key's configuration decides. Enable SMTP on the key in **API keys**, or create a second key with SMTP. See [Authentication](authentication.md#active-checks).

### The score is low but the verdict is `valid`

A `valid` always has a score of at least 70: below that, it becomes `risky`. A score from 70 to 89 flags a minor point of attention (generic account, poorly configured domain…), detailed in `warnings` and `features`.

### Why is a disposable address `risky` and not `invalid`?

Because it does receive mail, for now. The `invalid` verdict is reserved for addresses that will receive nothing. To reject disposable addresses, test `disposable === true` or use a policy's `reject_disposable` rule.

### Why is a noreply address `risky`?

Because a mailbox like `noreply@` or `donotreply@` is read by no one: whether it exists or the server did not allow a conclusion, it has no place in a mailing list. A mailbox rejected by the server stays `invalid`. The signal is in `features.noReply` and the `NO_REPLY` warning; to reject it, use a policy's `reject_no_reply` rule. See [Checks](checks.md).

### What is the difference between a typo and a trap domain?

A **typo** (`typoDomain`) is a user error: `gmial.com` instead of `gmail.com`. A **trap domain** (`typosquat`) is a domain actually registered to imitate a provider and capture mail intended for it: the message arrives, but with someone else. The two can occur together. See [Anatomy of the response](response.md#typo-trap-domain-and-verified-correction).

## Integration

### Can I call the API from the browser?

Not with a key: every visitor would see it. Use the [widget](../integrations/widget/README.md), designed for this case, or route the call through your server. The widget also covers domain autocompletion and typo detection, with no key in the page.

### Can I verify a list through the API?

Not in REST: batches are started from the dashboard. An agent can, however, start and track a batch of 5,000 addresses with the `validate_emails_batch` tool of the [MCP server](../integrations/mcp/README.md), using an API key. For a continuous flow, call `POST /v2/email/validate` address by address, within the [limit of 100 requests per minute](rate-limits.md).

### Can I verify my Brevo contacts without exporting them?

Yes, with the [Brevo connector](../integrations/connectors/brevo.md): YesWeCheck reads the chosen list, verifies it like a batch and writes the verdict on each contact. It can also automatically verify each new contact. Mailjet, Klaviyo and Systeme.io are also covered (see below); see [connectors](../integrations/connectors/README.md).

### Can I verify the emails of my HubSpot contacts?

Yes, with the [HubSpot connector](../integrations/connectors/hubspot.md) and a HubSpot service key: YesWeCheck verifies a list or all your contacts, writes the verdict in four `ywc_*` properties (**YesWeCheck** group) and can automatically verify new contacts in the lists you monitor. You can also verify a single contact from the customer area.

### Can I verify the emails of my Pipedrive people?

Yes, with the [Pipedrive connector](../integrations/connectors/pipedrive.md) and your Pipedrive API token: YesWeCheck verifies all your people or a filter, writes the verdict in four **YWC** custom fields and can automatically verify each new person. Only each person's primary address is verified. You can also verify a single person from the customer area.

### Can I clean my Mailchimp audiences?

Yes, with the [Mailchimp connector](../integrations/connectors/mailchimp.md) and a Mailchimp API key: YesWeCheck verifies an audience, a segment or a tag, writes the verdict in four `YWC_*` merge fields (or as tags, if you prefer) and can automatically verify new subscribers. Invalid addresses can be tagged, unsubscribed or archived; Mailchimp no longer counts archived contacts in your plan.

### Can I clean my Mailjet lists?

Yes, with the [Mailjet connector](../integrations/connectors/mailjet.md), your Mailjet API key and secret key: YesWeCheck verifies all your contacts or a list, writes the verdict in four `ywc_*` contact properties and can automatically verify new contacts and additions to your lists. Invalid addresses can be grouped in a list, unsubscribed from the cleaned list or excluded from campaigns. Each Mailjet sub-account connects with its own keys.

### Can I clean my Klaviyo lists and segments?

Yes, with the [Klaviyo connector](../integrations/connectors/klaviyo.md) and a private API key: YesWeCheck verifies all your profiles, a list or a segment, writes the verdict in four `ywc_*` profile properties and can automatically verify new profiles and entries into your lists and segments. Invalid addresses can be grouped in a list, removed from the cleaned list or suppressed in the Klaviyo sense: they no longer receive marketing emails and no longer count towards the active profiles in your plan.

### Can I verify my Systeme.io contacts?

Yes, with the [Systeme.io connector](../integrations/connectors/systeme-io.md) and a public API key: YesWeCheck verifies all your contacts or those carrying a tag, writes the verdict in four **YWC** contact fields and can automatically verify new contacts and those that receive a watched tag. Invalid addresses can be given a quarantine tag; a Systeme.io automation rule triggered by that tag unsubscribes them from your campaigns. No contact is deleted.

### Can I clean my Positive User (formerly Sarbacane) contacts?

Yes, with the [Positive User connector](../integrations/connectors/positive-user.md), your User.com workspace address and a public API key: YesWeCheck verifies all your contacts, a list, a tag or a segment, writes the verdict in four **YWC** attributes and can automatically verify new contacts. Invalid addresses can be tagged, unsubscribed or banned. The old Sarbacane interface, which has a separate API, is not covered.

### Can I verify a list of emails in Google Sheets?

Yes, with the [Google Sheets connector](../integrations/connectors/google-sheets.md): connect your Google account, then choose the sheet and the email column. YesWeCheck only accesses the files you choose, verifies the addresses like a batch and writes the verdict in four columns added to the right of your data. Rows added later can be verified automatically.

<a id="use-yeswecheck-from-chatgpt-or-claude"></a>

### Can I use YesWeCheck from ChatGPT or Claude?

Yes. Add the [MCP server](../integrations/mcp/README.md) `https://api.yeswecheck.fr/mcp` as a connector in Claude, ChatGPT, Le Chat, Claude Code, Cursor or VS Code, then authorise access on the YesWeCheck page that opens. The assistant verifies addresses and lists, and finds a person's work email (20 searches per day), with your settings and your credits.

### How do I test without spending credits?

Use a key **without SMTP**: all the other checks are free. `ywc_test_` keys work exactly like `ywc_live_` keys; they are not free.

### Can I check my balance through the API?

Yes: `GET /v2/me` returns your organisation's balance and the calling key's usage, free of charge. You can also read `metadata.credits.remaining` in validation responses with SMTP, and turn on balance alerts in **Settings → Notifications**. An agent connected to the [MCP server](../integrations/mcp/README.md) reads the balance with the `get_credits` tool.

### Are there SDKs?

Yes. This repository ships the [JavaScript and TypeScript SDK](../packages/js/) (`npm i @yeswecheck/sdk`) and a [command-line tool](../packages/cli/) (`npx yeswecheck`). For any other language, the [OpenAPI specification](../openapi/openapi.yaml) generates a client, and the dashboard's **API console** shows the calling code in nine languages.

### How do I know if the API is available?

[status.yeswecheck.fr](https://status.yeswecheck.fr/uk) shows the status of the services and the incident history. For your own monitoring, `GET https://api.yeswecheck.fr/health` responds without authentication.

## Security and data

<a id="my-key-has-leaked"></a>

### My key has leaked: what should I do?

Revoke it immediately in **API keys**: it is rejected from the next call. Create a new one, or rotate the key (new secret, same configuration) without a grace period. Then add a credit cap and an IP restriction. See [Authentication](authentication.md#replace-a-key-without-downtime).

### Do you send an email to the verified address?

No. The SMTP check stops before anything is sent: no message reaches the mailbox.

<a id="where-is-the-data-hosted"></a>

### Where is the data hosted?

Data is hosted in France, by OVHcloud. The infrastructure, operated by OVHcloud and certified ISO/IEC 27001, benefits from anti-DDoS protection and an automatic daily backup. Stored addresses (dashboard history, batch results) are encrypted. A batch's detailed results are deleted 7 days after it ends, or 30 days if your organisation chooses so in **Settings → Preferences**, and an account can be deleted from **Settings → Account**. See also the [Security](https://yeswecheck.fr/uk/security) page.

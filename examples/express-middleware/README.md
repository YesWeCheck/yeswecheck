<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Examples</a> › Express</sub>

# Express middleware

`requireDeliverableEmail()` checks the address in the request body before your handler runs. Undeliverable and temporary addresses get a `422` with a clear message, and a typo comes back with the corrected address.

**Stack:** Express 5, Node.js 22.9+, [`@yeswecheck/sdk`](../../packages/js/).

## Files

| File | Role |
|---|---|
| [`email-check.js`](email-check.js) | The middleware and the decision logic. **The file to copy.** |
| [`server.js`](server.js) | A `POST /signup` route that uses it |

## Run it

```bash
cp .env.example .env   # then paste your API key
npm install
npm start
```

## Try it

```bash
curl -s localhost:3000/signup -H 'content-type: application/json' -d '{"email":"jane@gmial.com"}'
```

```json
{ "field": "email", "message": "Did you mean jane@gmail.com?", "suggestion": "jane@gmail.com" }
```

| Request body | Status | Response |
|---|---|---|
| A deliverable address | `201` | `{ "email": "…", "flag": null }` |
| A typo | `422` | `message` and `suggestion` |
| A temporary address | `422` | `"Please use a permanent email address, not a temporary one."` |
| An address that does not exist | `422` | `"This email address cannot receive email."` |
| A no-reply address | `201` | `"flag": "risky"` |
| No answer from the mail server | `201` | `"flag": "unconfirmed"` |
| API unreachable | `201` | `"flag": "unchecked"`, and the error is logged |

## Use it

```js
import { requireDeliverableEmail } from "./email-check.js";

app.post("/signup", requireDeliverableEmail(), (req, res) => {
  const { email, flag } = req.emailCheck;
  // …
});

app.post("/contacts", requireDeliverableEmail({ field: "contactEmail" }), handler);
```

Express 5 forwards errors from async middleware on its own; with Express 4, wrap it or upgrade.

Change the `risky` and `unknown` branches of `decide()` to suit your route: see the [rules shared by every recipe](../README.md#the-same-rules-everywhere).

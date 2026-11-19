<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Examples</a> › NestJS</sub>

# NestJS pipe

A `DeliverableEmailPipe` that verifies an email field and throws a `422` when the address should be refused. The YesWeCheck client is a provider, created once and injectable anywhere.

**Stack:** NestJS 12 (ES modules), TypeScript, [`@yeswecheck/sdk`](../../packages/js/).

```ts
@Post("signup")
signup(@Body("email", DeliverableEmailPipe) { email, flag }: CheckedEmail) {
  // email is deliverable; flag is "risky", "unconfirmed", "unchecked" or undefined
}
```

## Files

| File | Role |
|---|---|
| [`src/yeswecheck/deliverable-email.pipe.ts`](src/yeswecheck/deliverable-email.pipe.ts) | The pipe and the decision logic. **The file to copy.** |
| [`src/yeswecheck/yeswecheck.module.ts`](src/yeswecheck/yeswecheck.module.ts) | Global module that provides the `YesWeCheck` client |
| [`src/signup.controller.ts`](src/signup.controller.ts) | A `POST /signup` route that uses the pipe |

## Run it

```bash
cp .env.example .env   # then paste your API key
npm install
npm run build && npm start
```

```bash
curl -s localhost:3000/signup -H 'content-type: application/json' -d '{"email":"jane@gmial.com"}'
```

```json
{ "statusCode": 422, "field": "email", "message": "Did you mean jane@gmail.com?", "suggestion": "jane@gmail.com" }
```

## Notes

- **Use the client elsewhere.** Inject `YesWeCheck` in any service to call `me()`, `suggestTypo()` or `enrich()`.
- **With `class-validator`.** Keep `@IsEmail()` in your DTO for its error message. A malformed address never uses a credit anyway: the API refuses it with a `400`, which the pipe turns into "This email address is not valid."
- **With `@nestjs/config`.** Replace `process.env.YWC_API_KEY` in the module's factory with `config.getOrThrow("YWC_API_KEY")` and add `inject: [ConfigService]`.
- **Not blocking.** If the API cannot be reached, the pipe logs the error and lets the address through, flagged `unchecked`.

Change the `risky` and `unknown` branches to suit your route: see the [rules shared by every recipe](../README.md#the-same-rules-everywhere).

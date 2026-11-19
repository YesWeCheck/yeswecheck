<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Examples</a> › Zod</sub>

# Zod schema

`deliverableEmail` is a Zod schema that accepts an address only if it can receive mail. Drop it into any object schema: forms, API bodies, tRPC inputs, server actions.

**Stack:** Zod 4, TypeScript, Node.js 22.18+ (runs `.ts` files directly), [`@yeswecheck/sdk`](../../packages/js/).

```ts
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name."),
  email: deliverableEmail,
});

const result = await signupSchema.safeParseAsync(body); // async: never parse()
```

## Files

| File | Role |
|---|---|
| [`signup-schema.ts`](signup-schema.ts) | The `deliverableEmail` schema. **The file to copy.** |
| [`demo.ts`](demo.ts) | Parses a few inputs and prints the errors |

## Run it

```bash
cp .env.example .env   # then paste your API key
npm install
npm run demo
```

```text
✔ { name: 'Jane', email: 'jane.doe@company.co.uk' }
✖ { email: [ 'Did you mean jane@gmail.com?' ] } → offer jane@gmail.com
✖ { email: [ 'Please use a permanent email address, not a temporary one.' ] }
✖ { name: [ 'Please tell us your name.' ], email: [ 'Please enter a valid email address.' ] }
```

## What to know

- **No call for a bad format.** Zod runs every check by default, even after one has failed. The refinement's `when` option skips the API call when the format check has already failed, so an empty or malformed value costs nothing and takes no time.
- **The fix travels with the error.** The typo issue carries `params.suggestion`: read it from `result.error.issues` to show a "Use jane@gmail.com" button.
- **Normalised value.** The schema trims and lowercases the address, so `result.data.email` is ready to store.
- **Not blocking.** If the API cannot be reached, the error is logged and the address goes through.
- **Server only.** The schema holds an API key: use it in server code (route handlers, Server Actions, tRPC procedures). In the browser, validate the format only, or use the [form widget](../../integrations/widget/).

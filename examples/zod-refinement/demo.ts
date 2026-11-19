import * as z from "zod";
import { signupSchema } from "./signup-schema.ts";

const inputs = [
  { name: "Jane", email: "Jane.Doe@company.co.uk " },
  { name: "Jane", email: "jane@gmial.com" },
  { name: "Tom", email: "temp@mailinator.com" },
  { name: "", email: "not-an-email" },
  { name: "", email: "info@accept-all.example" },
];

for (const input of inputs) {
  // Async refinement: parseAsync / safeParseAsync, never parse().
  const result = await signupSchema.safeParseAsync(input);
  if (result.success) {
    console.log("✔", result.data);
  } else {
    const suggestion = result.error.issues.flatMap((i) => (i.code === "custom" && i.params?.suggestion) || [])[0];
    console.log("✖", z.flattenError(result.error).fieldErrors, suggestion ? `→ offer ${suggestion}` : "");
  }
}

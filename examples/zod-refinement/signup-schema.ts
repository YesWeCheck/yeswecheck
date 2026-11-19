import * as z from "zod";
import { YesWeCheck, YesWeCheckApiError, suggestedEmail } from "@yeswecheck/sdk";

const ywc = new YesWeCheck(); // reads YWC_API_KEY

/**
 * An email field that is only accepted if it can receive mail.
 * The API is called once the format is right, never for an empty or malformed value.
 */
export const deliverableEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Please enter a valid email address." }))
  .superRefine(async (email, ctx) => {
    let res;
    try {
      res = await ywc.validate(email);
    } catch (err) {
      if (err instanceof YesWeCheckApiError && err.status === 400) {
        ctx.addIssue({ code: "custom", message: "Please enter a valid email address.", input: email });
      } else {
        console.error("[yeswecheck]", err); // outage, no credits…: never block a sign-up because of it
      }
      return;
    }

    const suggestion = suggestedEmail(res);
    if (res.finalDecision === "rejected") {
      // The policy attached to your key (set in the dashboard) refuses this address.
      ctx.addIssue({ code: "custom", message: "This email address is not accepted.", input: email });
    } else if (res.result !== "valid" && suggestion) {
      // `params` travels with the issue: the form can offer a one-click fix.
      ctx.addIssue({ code: "custom", message: `Did you mean ${suggestion}?`, input: email, params: { suggestion } });
    } else if (res.result === "invalid") {
      ctx.addIssue({ code: "custom", message: "This email address cannot receive email.", input: email });
    } else if (res.disposable) {
      ctx.addIssue({ code: "custom", message: "Please use a permanent email address, not a temporary one.", input: email });
    }
    // valid, other risky signals (no-reply, lookalike…) and unknown (never billed) go through.
  }, { when: (payload) => payload.issues.length === 0 }); // format checks are "continuable": skip the call if one failed

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name."),
  email: deliverableEmail,
});

export type Signup = z.infer<typeof signupSchema>;

import { YesWeCheck, YesWeCheckApiError, suggestedEmail, type ValidationResponse } from "@yeswecheck/sdk";

const ywc = new YesWeCheck(); // reads YWC_API_KEY

export type EmailCheck =
  | { ok: true; email: string; flag?: "risky" | "unconfirmed" | "unchecked" }
  | { ok: false; message: string; suggestion?: string };

/** Turns a verdict into a sign-up decision. Adapt the `risky` and `unknown` branches to your context. */
export function decide(email: string, res: ValidationResponse): EmailCheck {
  // 1. The policy attached to your key (set in the dashboard) can refuse a deliverable address.
  if (res.finalDecision === "rejected") return { ok: false, message: "This email address is not accepted." };

  // 2. A typo: offer the fix rather than a bare error.
  const suggestion = suggestedEmail(res);
  if (suggestion && res.result !== "valid") return { ok: false, message: `Did you mean ${suggestion}?`, suggestion };

  switch (res.result) {
    case "valid":
      return { ok: true, email };
    case "invalid":
      return { ok: false, message: "This email address cannot receive email." };
    case "risky":
      return res.disposable
        ? { ok: false, message: "Please use a permanent email address, not a temporary one." }
        : { ok: true, email, flag: "risky" }; // no-reply, lookalike domain… accept, but keep an eye on it
    case "unknown":
      return { ok: true, email, flag: "unconfirmed" }; // the mail server gave no answer: never billed, never block a real customer
  }
}

export async function checkEmail(email: string): Promise<EmailCheck> {
  try {
    return decide(email, await ywc.validate(email));
  } catch (err) {
    if (err instanceof YesWeCheckApiError && err.status === 400) {
      return { ok: false, message: "This email address is not valid." };
    }
    // Outage, timeout, no credits left, revoked key: log it, and never block a sign-up because of it.
    console.error("[yeswecheck]", err);
    return { ok: true, email, flag: "unchecked" };
  }
}

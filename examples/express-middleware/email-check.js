import { YesWeCheck, YesWeCheckApiError, suggestedEmail } from "@yeswecheck/sdk";

const ywc = new YesWeCheck(); // reads YWC_API_KEY

/**
 * Turns a verdict into a sign-up decision. Adapt the `risky` and `unknown` branches to your context.
 * @param {string} email
 * @param {import("@yeswecheck/sdk").ValidationResponse} res
 */
export function decide(email, res) {
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
        : { ok: true, email, flag: "risky" };
    default: // "unknown": the mail server gave no answer. Never billed; don't block a real customer.
      return { ok: true, email, flag: "unconfirmed" };
  }
}

/**
 * Express middleware: verifies `req.body[field]` and answers 422 when the address should be refused.
 * The outcome is kept on `req.emailCheck` for the next handler.
 */
export function requireDeliverableEmail({ field = "email" } = {}) {
  return async (req, res, next) => {
    const email = String(req.body?.[field] ?? "").trim();
    if (!email) return res.status(422).json({ field, message: "Please enter your email address." });

    let check;
    try {
      check = decide(email, await ywc.validate(email));
    } catch (err) {
      if (err instanceof YesWeCheckApiError && err.status === 400) {
        check = { ok: false, message: "This email address is not valid." };
      } else {
        // Outage, timeout, no credits left, revoked key: log it, and let the sign-up through.
        console.error("[yeswecheck]", err);
        check = { ok: true, email, flag: "unchecked" };
      }
    }

    if (!check.ok) return res.status(422).json({ field, message: check.message, suggestion: check.suggestion });
    req.emailCheck = check;
    next();
  };
}

import { Injectable, Logger, UnprocessableEntityException, type PipeTransform } from "@nestjs/common";
import { YesWeCheck, YesWeCheckApiError, suggestedEmail, type ValidationResponse } from "@yeswecheck/sdk";

export interface CheckedEmail {
  email: string;
  /** Accepted, but worth a second look: "risky" (no-reply, lookalike…), "unconfirmed" (server gave no answer), "unchecked" (API unreachable). */
  flag?: "risky" | "unconfirmed" | "unchecked";
}

/**
 * Verifies an email body field and answers 422 when the address should be refused.
 * Usage: `@Body("email", DeliverableEmailPipe) checked: CheckedEmail`
 */
@Injectable()
export class DeliverableEmailPipe implements PipeTransform<unknown, Promise<CheckedEmail>> {
  private readonly logger = new Logger("YesWeCheck");

  constructor(private readonly ywc: YesWeCheck) {}

  async transform(value: unknown): Promise<CheckedEmail> {
    const email = typeof value === "string" ? value.trim() : "";
    if (!email) throw this.refuse("Please enter your email address.");

    let res: ValidationResponse;
    try {
      res = await this.ywc.validate(email);
    } catch (err) {
      if (err instanceof YesWeCheckApiError && err.status === 400) throw this.refuse("This email address is not valid.");
      // Outage, timeout, no credits left, revoked key: log it, and never block a sign-up because of it.
      this.logger.error(err instanceof Error ? err.message : String(err));
      return { email, flag: "unchecked" };
    }

    // The policy attached to your key (set in the dashboard) can refuse a deliverable address.
    if (res.finalDecision === "rejected") throw this.refuse("This email address is not accepted.");

    // A typo: offer the fix rather than a bare error.
    const suggestion = suggestedEmail(res);
    if (suggestion && res.result !== "valid") throw this.refuse(`Did you mean ${suggestion}?`, suggestion);

    switch (res.result) {
      case "valid":
        return { email };
      case "invalid":
        throw this.refuse("This email address cannot receive email.");
      case "risky":
        if (res.disposable) throw this.refuse("Please use a permanent email address, not a temporary one.");
        return { email, flag: "risky" };
      case "unknown": // never billed; don't block a real customer
        return { email, flag: "unconfirmed" };
    }
  }

  private refuse(message: string, suggestion?: string) {
    return new UnprocessableEntityException({ statusCode: 422, field: "email", message, suggestion });
  }
}

"use server";

import { checkEmail } from "@/lib/email-check";

export type SignupState =
  | { status: "idle"; email?: string }
  | { status: "error"; email: string; message: string; suggestion?: string }
  | { status: "done"; email: string; flag?: string };

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  // "Use the suggestion" submits the corrected address under its own name.
  const email = String(formData.get("suggestion") ?? formData.get("email") ?? "").trim();
  if (!email) return { status: "error", email, message: "Please enter your email address." };

  const check = await checkEmail(email);
  if (!check.ok) return { status: "error", email, message: check.message, suggestion: check.suggestion };

  // Create the account here. Keep check.flag ("risky", "unconfirmed", "unchecked") on the user record
  // if you want to review those sign-ups later, or ask them to confirm their address.
  return { status: "done", email: check.email, flag: check.flag };
}

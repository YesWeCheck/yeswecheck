"use client";

import { useActionState } from "react";
import { signup, type SignupState } from "./actions";

const initial: SignupState = { status: "idle" };

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, initial);

  if (state.status === "done") {
    return (
      <p className="done" role="status">
        Welcome aboard! We have sent a link to <strong>{state.email}</strong>.
      </p>
    );
  }

  const error = state.status === "error" ? state : undefined;

  return (
    <form action={action} noValidate>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="jane.doe@company.co.uk"
        required
        defaultValue={state.email}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "email-error" : undefined}
      />
      {error && (
        <p id="email-error" className="error" role="alert">
          {error.message}
          {error.suggestion && (
            <button type="submit" name="suggestion" value={error.suggestion} className="link" disabled={pending}>
              Yes, use it
            </button>
          )}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Create my account"}
      </button>
    </form>
  );
}

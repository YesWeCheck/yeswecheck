import { SignupForm } from "./signup-form";

export default function Page() {
  return (
    <main>
      <h1>Create your account</h1>
      <p className="lead">Free for 14 days. No card needed.</p>
      <SignupForm />
    </main>
  );
}

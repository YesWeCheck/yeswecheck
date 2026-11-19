import { suggestedEmail, type ValidationResponse, type Verdict } from "@yeswecheck/sdk";

const useColour = () => !process.env.NO_COLOR && process.env.FORCE_COLOR !== "0" && (process.stdout.isTTY || !!process.env.FORCE_COLOR);

const ansi = (code: string) => (s: string) => (useColour() ? `\x1b[${code}m${s}\x1b[0m` : s);
export const c = {
  bold: ansi("1"),
  dim: ansi("2"),
  green: ansi("32"),
  yellow: ansi("33"),
  red: ansi("31"),
  grey: ansi("90"),
  cyan: ansi("36"),
};

export const VERDICT_STYLE: Record<Verdict, { icon: string; paint: (s: string) => string }> = {
  valid: { icon: "✔", paint: c.green },
  risky: { icon: "▲", paint: c.yellow },
  invalid: { icon: "✖", paint: c.red },
  unknown: { icon: "●", paint: c.grey },
};

/** One-line explanation of a verdict, built from the API's own English messages. */
export function explain(res: ValidationResponse): string {
  const parts: string[] = [];
  const f = res.features;
  const failing = [f.syntax, f.dns, f.smtp].find((x) => x && x.result === "invalid");
  if (failing) parts.push(failing.message);
  else if (res.warnings?.length) parts.push(res.warnings[0]!.message);
  else if (f.smtp) parts.push(f.smtp.message);
  else parts.push("Syntax and domain OK (no mailbox check on this key)");
  const fix = suggestedEmail(res);
  if (fix) parts.push(`did you mean ${fix}?`);
  return parts.join(" · ");
}

export function verdictLine(email: string, res: ValidationResponse, width: number): string {
  const s = VERDICT_STYLE[res.result];
  return [
    " ",
    s.paint(s.icon),
    c.bold(email.padEnd(width)),
    s.paint(res.result.padEnd(8)),
    c.dim(String(res.score).padStart(3)),
    "",
    c.grey(explain(res)),
  ].join(" ");
}

export function progressBar(done: number, total: number, width = 24): string {
  const ratio = total ? done / total : 1;
  const full = Math.round(ratio * width);
  return c.green("█".repeat(full)) + c.grey("░".repeat(width - full));
}

export const fmt = (n: number) => n.toLocaleString("en-GB");

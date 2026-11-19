#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { basename, extname } from "node:path";
import { parseArgs } from "node:util";
import { YesWeCheck, YesWeCheckApiError, YesWeCheckError, suggestedEmail, type ValidationResponse, type Verdict } from "@yeswecheck/sdk";
import { detectDelimiter, findEmailColumn, parseCsv, toCsv } from "./csv.js";
import { VERDICT_STYLE, c, explain, fmt, progressBar, verdictLine } from "./format.js";

const VERSION = "0.1.0";
const BULK_HINT = 5_000;

const HELP = `
${c.bold("yeswecheck")} ${c.dim(`v${VERSION}`)}  Verify email addresses from your terminal.

${c.bold("Usage")}
  yeswecheck <email> [more emails…]    Verify one or more addresses
  yeswecheck check <file.csv>          Verify every address of a CSV or TXT file
  yeswecheck typo <email|domain>       Suggest a fix for a mistyped domain (free)
  yeswecheck me                        Show your balance and key settings (free)

${c.bold("Options")}
  -k, --key <key>          API key (default: YWC_API_KEY environment variable)
  -o, --out <file>         check: where to write results (default: <file>.checked.csv)
      --column <name|n>    check: email column, by header name or number
      --concurrency <n>    check: parallel requests, 1–8 (default 3)
  -y, --yes                check: do not ask for confirmation
      --country <code>     reference country, e.g. GB
      --json               machine-readable output
  -h, --help               show this help
  -v, --version            show the version

${c.bold("Credits")}  Only a conclusive mailbox check uses a credit; unknown results are free.
${c.dim("Get a free API key (100 credits): https://app.yeswecheck.fr/uk/register?src=cli")}
`;

type Opts = {
  key?: string;
  out?: string;
  column?: string;
  concurrency?: string;
  yes?: boolean;
  country?: string;
  json?: boolean;
  help?: boolean;
  version?: boolean;
};

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      key: { type: "string", short: "k" },
      out: { type: "string", short: "o" },
      column: { type: "string" },
      concurrency: { type: "string" },
      yes: { type: "boolean", short: "y" },
      country: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
  const opts = values as Opts;
  if (opts.version) return print(VERSION), 0;
  const [command, ...rest] = positionals;
  if (opts.help || !command) return print(HELP), command || opts.help ? 0 : 1;

  const ywc = new YesWeCheck({ apiKey: opts.key, baseUrl: process.env.YWC_BASE_URL, maxRetries: 5, maxRetryDelay: 65 });
  switch (command) {
    case "me":
      return me(ywc, opts);
    case "typo":
      return typo(ywc, rest, opts);
    case "check":
    case "csv":
      return check(ywc, rest[0], opts);
    default:
      return validateMany(ywc, positionals, opts);
  }
}

function print(s: string) {
  process.stdout.write(s.endsWith("\n") ? s : s + "\n");
}

async function validateMany(ywc: YesWeCheck, emails: string[], opts: Opts): Promise<number> {
  const results: Array<{ email: string; res: ValidationResponse }> = [];
  const width = Math.min(40, Math.max(...emails.map((e) => e.length)));
  if (!opts.json) print("");
  for (const email of emails) {
    const res = await ywc.validate(email, opts.country ? { country: opts.country } : {});
    results.push({ email, res });
    if (!opts.json) print(verdictLine(email, res, width));
  }
  if (opts.json) {
    print(JSON.stringify(emails.length === 1 ? results[0]!.res : results, null, 2));
  } else {
    const used = results.reduce((n, r) => n + (r.res.metadata.credits?.used ?? 0), 0);
    const last = results.at(-1)?.res.metadata.credits?.remaining;
    print("");
    print(c.dim(`  ${used} credit${used === 1 ? "" : "s"} used${used && last !== undefined ? ` · ${fmt(last)} remaining` : ""}`));
  }
  return results.some((r) => r.res.result === "invalid") ? 2 : 0;
}

async function typo(ywc: YesWeCheck, inputs: string[], opts: Opts): Promise<number> {
  const input = inputs[0];
  if (!input) throw new YesWeCheckError("Usage: yeswecheck typo <email|domain>");
  const res = await ywc.suggestTypo(input);
  if (opts.json) return print(JSON.stringify(res, null, 2)), 0;
  const fix = res.suggestedEmail ?? res.suggestedDomain;
  print(res.detected && fix ? `\n  ${c.yellow("▲")} ${c.bold(input)} → ${c.green(fix)}\n` : `\n  ${c.green("✔")} ${c.bold(input)} ${c.grey("no typo detected")}\n`);
  return 0;
}

async function me(ywc: YesWeCheck, opts: Opts): Promise<number> {
  const m = await ywc.me();
  if (opts.json) return print(JSON.stringify(m, null, 2)), 0;
  const k = m.apiKey;
  const cap = (used: number | null, max: number | null) => (max === null ? "no cap" : `${fmt(used ?? 0)} / ${fmt(max)}`);
  print(`
  ${c.bold(m.organization.name)}
  ${c.dim("Balance")}        ${m.credits.unlimited ? "unlimited" : c.green(fmt(m.credits.balance ?? 0)) + " credits"}
  ${c.dim("Key")}            ${k.name} ${c.grey(`(${k.environment})`)}
  ${c.dim("Mailbox check")}  ${k.smtpEnabled ? c.green("on") + c.grey(" · 1 credit per conclusive result") : c.yellow("off") + c.grey(" · every check is free")}
  ${c.dim("Today")}          ${cap(k.creditsUsedToday, k.maxCreditsPerDay)}
  ${c.dim("This month")}     ${cap(k.creditsUsedThisMonth, k.maxCreditsPerMonth)}
`);
  return 0;
}

async function check(ywc: YesWeCheck, file: string | undefined, opts: Opts): Promise<number> {
  if (!file) throw new YesWeCheckError("Usage: yeswecheck check <file.csv>");
  const text = await readFile(file, "utf8");
  const delimiter = detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  const { index, hasHeader } = findEmailColumn(rows, opts.column);
  const header = hasHeader ? rows[0]! : rows[0]!.map((_, i) => (i === index ? "email" : `column_${i + 1}`));
  const data = hasHeader ? rows.slice(1) : rows;
  const emails = [...new Set(data.map((r) => (r[index] ?? "").trim().toLowerCase()).filter(Boolean))];
  const out = opts.out ?? `${basename(file, extname(file))}.checked.csv`;
  const concurrency = Math.min(8, Math.max(1, Number(opts.concurrency ?? 3) || 3));

  const account = await ywc.me();
  const smtp = account.apiKey.smtpEnabled;
  const log = (s: string) => process.stderr.write(s + "\n");
  log(`\n  ${c.bold(fmt(emails.length))} unique address${emails.length === 1 ? "" : "es"} in ${c.bold(basename(file))} ${c.grey(`(column "${header[index]}")`)}`);
  log(
    smtp
      ? `  Mailbox check ${c.green("on")}: up to ${c.bold(fmt(emails.length))} credits ${c.grey(`(balance ${account.credits.unlimited ? "unlimited" : fmt(account.credits.balance ?? 0)}; unknown results are free)`)}`
      : `  Mailbox check ${c.yellow("off")} on this key: ${c.green("every check is free")}`,
  );
  if (emails.length > BULK_HINT) log(c.grey(`  Tip: for large lists, the dashboard's bulk processing is faster: https://app.yeswecheck.fr/uk`));
  if (smtp && !opts.yes && process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    const answer = await rl.question(`  Continue? ${c.dim("[y/N]")} `);
    rl.close();
    if (!/^y(es)?$/i.test(answer.trim())) return log("  Cancelled."), 1;
  }

  const results = new Map<string, ValidationResponse | Error>();
  const counts: Record<Verdict | "error", number> = { valid: 0, risky: 0, invalid: 0, unknown: 0, error: 0 };
  let next = 0;
  let lastStart = 0;
  const minGap = 650; // stays under the 100 requests/minute limit per IP
  const draw = () => {
    if (!process.stderr.isTTY) return;
    const done = results.size;
    const tally = (["valid", "risky", "invalid", "unknown"] as const).map((v) => VERDICT_STYLE[v].paint(`${v} ${fmt(counts[v])}`)).join(c.grey(" · "));
    process.stderr.write(`\r  ${progressBar(done, emails.length)} ${fmt(done)}/${fmt(emails.length)}  ${tally}\x1b[K`);
  };
  const worker = async () => {
    while (next < emails.length) {
      const email = emails[next++]!;
      const wait = lastStart + minGap - Date.now();
      lastStart = Math.max(Date.now(), lastStart + minGap);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      try {
        const res = await ywc.validate(email, opts.country ? { country: opts.country } : {});
        results.set(email, res);
        counts[res.result]++;
      } catch (err) {
        if (err instanceof YesWeCheckApiError && (err.isAuthError || err.isInsufficientCredits)) throw err;
        results.set(email, err as Error);
        counts.error++;
      }
      draw();
    }
  };
  log("");
  draw();
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (process.stderr.isTTY) process.stderr.write("\n");

  const extra = ["ywc_result", "ywc_score", "ywc_reason", "ywc_suggestion"];
  const outRows = [[...header, ...extra]];
  for (const r of data) {
    const res = results.get((r[index] ?? "").trim().toLowerCase());
    if (!res) outRows.push([...r, "", "", "empty", ""]);
    else if (res instanceof Error) outRows.push([...r, "error", "", res.message, ""]);
    else outRows.push([...r, res.result, String(res.score), explain(res), suggestedEmail(res) ?? ""]);
  }
  await writeFile(out, toCsv(outRows, delimiter));

  if (opts.json) print(JSON.stringify({ file: out, total: emails.length, ...counts }, null, 2));
  else {
    log("");
    for (const v of ["valid", "risky", "invalid", "unknown"] as const) {
      const s = VERDICT_STYLE[v];
      log(`  ${s.paint(s.icon)} ${s.paint(v.padEnd(8))} ${fmt(counts[v]).padStart(7)}`);
    }
    if (counts.error) log(`  ${c.red("!")} ${"errors".padEnd(8)} ${fmt(counts.error).padStart(7)}`);
    log(`\n  Results written to ${c.bold(out)}\n`);
  }
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    const msg = err instanceof YesWeCheckApiError && err.isAuthError ? `${err.message}\n  Set YWC_API_KEY or pass --key. Get a free key: https://app.yeswecheck.fr/uk/register?src=cli` : err instanceof Error ? err.message : String(err);
    process.stderr.write(`\n  ${c.red("✖")} ${msg}\n\n`);
    process.exit(1);
  },
);

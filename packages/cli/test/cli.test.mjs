import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { detectDelimiter, findEmailColumn, parseCsv, toCsv } from "../dist/csv.js";

const run = promisify(execFile);
const CLI = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

// ── CSV helpers ───────────────────────────────────────────────────────────

test("parseCsv handles quotes, embedded separators and CRLF", () => {
  const rows = parseCsv('﻿id;email;note\r\n1;jane@company.co.uk;"hello; ""world"""\r\n2;sam@northwind.io;\r\n', ";");
  assert.deepEqual(rows, [
    ["id", "email", "note"],
    ["1", "jane@company.co.uk", 'hello; "world"'],
    ["2", "sam@northwind.io", ""],
  ]);
});

test("detectDelimiter picks the most frequent separator of the first line", () => {
  assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
  assert.equal(detectDelimiter("a\tb\n1\t2"), "\t");
  assert.equal(detectDelimiter("email\njane@company.co.uk"), ",");
});

test("findEmailColumn finds the column by header, content or option", () => {
  assert.deepEqual(findEmailColumn([["id", "E-mail"], ["1", "a@b.co"]]), { index: 1, hasHeader: true });
  assert.deepEqual(findEmailColumn([["1", "a@b.co"], ["2", "c@d.co"]]), { index: 1, hasHeader: false });
  assert.deepEqual(findEmailColumn([["id", "contact"], ["1", "a@b.co"]], "contact"), { index: 1, hasHeader: true });
  assert.throws(() => findEmailColumn([["id"], ["1"]]), /No email column/);
});

test("toCsv quotes only when needed", () => {
  assert.equal(toCsv([["a", "b,c", 'd"e']], ","), 'a,"b,c","d""e"\n');
});

// ── End to end against a fake API ─────────────────────────────────────────

const verdicts = {
  "jane.doe@company.co.uk": { result: "valid", score: 100, smtp: { result: "valid", score: 100, message: "Mailbox exists" } },
  "noreply@northwind.io": { result: "risky", score: 60, warnings: [{ code: "NO_REPLY", severity: "warning", message: "No-reply address" }] },
  "j.smith@gmail.con": {
    result: "invalid",
    score: 0,
    dns: { result: "invalid", score: 0, message: "No mail server for this domain" },
    typoDomain: { result: "invalid", score: 10, message: "typo", details: { suggestedEmail: "j.smith@gmail.com" } },
  },
};

let server;
let baseUrl;
const seen = [];

before(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      seen.push({ url: req.url, auth: req.headers.authorization });
      res.setHeader("content-type", "application/json");
      if (req.headers.authorization !== "Bearer ywc_test_xxxxxxxxxxxxxxxx") {
        res.statusCode = 401;
        return res.end(JSON.stringify({ statusCode: 401, message: "Invalid or revoked API key", code: "UNAUTHORIZED" }));
      }
      if (req.url === "/v2/me") {
        return res.end(JSON.stringify({ organization: { name: "Northwind" }, credits: { unlimited: false, balance: 1234 }, apiKey: { name: "CLI", environment: "test", smtpEnabled: true, creditsUsedToday: null, creditsUsedThisMonth: null, maxCreditsPerDay: null, maxCreditsPerMonth: null } }));
      }
      const { email } = JSON.parse(raw);
      const v = verdicts[email] ?? { result: "unknown", score: 50 };
      res.end(
        JSON.stringify({
          result: v.result,
          score: v.score,
          freeProvider: false,
          businessEmail: true,
          disposable: false,
          alias: false,
          warnings: v.warnings,
          features: {
            syntax: { result: "valid", score: 100, message: "ok" },
            dns: v.dns ?? { result: "valid", score: 100, message: "ok" },
            ...(v.smtp ? { smtp: v.smtp } : {}),
            ...(v.typoDomain ? { typoDomain: v.typoDomain } : {}),
          },
          metadata: { credits: { used: v.result === "unknown" ? 0 : 1, remaining: 1000 } },
        }),
      );
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const env = (extra = {}) => ({ ...process.env, NO_COLOR: "1", YWC_BASE_URL: baseUrl, YWC_API_KEY: "ywc_test_xxxxxxxxxxxxxxxx", ...extra });

test("--help and --version", async () => {
  const help = await run("node", [CLI, "--help"], { env: env() });
  assert.match(help.stdout, /yeswecheck check <file\.csv>/);
  const version = await run("node", [CLI, "--version"], { env: env() });
  assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test("verifies addresses and explains each verdict", async () => {
  const p = run("node", [CLI, "jane.doe@company.co.uk", "j.smith@gmail.con"], { env: env() });
  await assert.rejects(p, (err) => {
    assert.equal(err.code, 2, "exit code 2 when an address is invalid");
    assert.match(err.stdout, /✔ jane\.doe@company\.co\.uk\s+valid\s+100\s+Mailbox exists/);
    assert.match(err.stdout, /✖ j\.smith@gmail\.con\s+invalid\s+0\s+No mail server for this domain · did you mean j\.smith@gmail\.com\?/);
    assert.match(err.stdout, /2 credits used · 1,000 remaining/);
    return true;
  });
});

test("--json prints the raw API response", async () => {
  const { stdout } = await run("node", [CLI, "jane.doe@company.co.uk", "--json"], { env: env() });
  assert.equal(JSON.parse(stdout).result, "valid");
});

test("check writes an enriched CSV and keeps the original columns", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ywc-cli-"));
  const input = join(dir, "list.csv");
  const out = join(dir, "out.csv");
  await writeFile(input, "id;Email;city\n1;jane.doe@company.co.uk;Leeds\n2;NOREPLY@northwind.io;York\n3;j.smith@gmail.con;Bath\n4;jane.doe@company.co.uk;Leeds\n");
  const { stderr } = await run("node", [CLI, "check", input, "--out", out, "--yes", "--concurrency", "3"], { env: env() });
  assert.match(stderr, /3 unique addresses in list\.csv/);
  assert.match(stderr, /up to 3 credits/);
  const rows = parseCsv(await readFile(out, "utf8"), ";");
  assert.deepEqual(rows[0], ["id", "Email", "city", "ywc_result", "ywc_score", "ywc_reason", "ywc_suggestion"]);
  assert.deepEqual(rows.slice(1).map((r) => [r[0], r[3]]), [["1", "valid"], ["2", "risky"], ["3", "invalid"], ["4", "valid"]]);
  assert.equal(rows[3][6], "j.smith@gmail.com");
});

test("a bad key gives a helpful message and exit code 1", async () => {
  await assert.rejects(run("node", [CLI, "me"], { env: env({ YWC_API_KEY: "ywc_test_wrong" }) }), (err) => {
    assert.equal(err.code, 1);
    assert.match(err.stderr, /Invalid or revoked API key/);
    assert.match(err.stderr, /Set YWC_API_KEY or pass --key/);
    return true;
  });
});

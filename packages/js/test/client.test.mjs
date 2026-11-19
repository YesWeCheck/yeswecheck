import { test } from "node:test";
import assert from "node:assert/strict";
import {
  YesWeCheck,
  YesWeCheckApiError,
  YesWeCheckConnectionError,
  YesWeCheckError,
  isDeliverable,
  suggestedEmail,
  hasWarning,
} from "../dist/index.js";

const KEY = "ywc_test_xxxxxxxxxxxxxxxx";

const VALID = {
  result: "valid",
  score: 100,
  freeProvider: false,
  businessEmail: true,
  disposable: false,
  alias: false,
  finalDecision: "accepted",
  features: { syntax: { result: "valid", score: 100, message: "ok" }, dns: { result: "valid", score: 100, message: "ok" } },
  metadata: { credits: { used: 1, remaining: 99 }, apiVersion: "2.0" },
};

/** Fake fetch answering from a queue of responses; records every call. */
function fakeFetch(...responses) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : undefined });
    const next = responses.shift();
    if (!next) throw new Error("no more fake responses");
    if (next instanceof Error) throw next;
    return next;
  };
  fn.calls = calls;
  return fn;
}

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const client = (fetch, extra = {}) => new YesWeCheck({ apiKey: KEY, fetch, maxRetryDelay: 1, ...extra });

test("validate sends the address with Bearer auth and English errors", async () => {
  const fetch = fakeFetch(json(200, VALID));
  const res = await client(fetch).validate("jane.doe@company.co.uk", { country: "GB" });
  assert.equal(res.result, "valid");
  const [call] = fetch.calls;
  assert.equal(call.url, "https://api.yeswecheck.fr/v2/email/validate");
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers.Authorization, `Bearer ${KEY}`);
  assert.equal(call.init.headers["Accept-Language"], "en-GB");
  assert.match(call.init.headers["User-Agent"], /^yeswecheck-js\/\d+\.\d+\.\d+/);
  assert.deepEqual(call.body, { email: "jane.doe@company.co.uk", country: "GB" });
});

test("a missing API key fails before any network call", async () => {
  const fetch = fakeFetch();
  const saved = process.env.YWC_API_KEY;
  delete process.env.YWC_API_KEY;
  try {
    await assert.rejects(new YesWeCheck({ fetch }).validate("a@b.co"), (e) => e instanceof YesWeCheckError && /missing API key/.test(e.message));
    assert.equal(fetch.calls.length, 0);
  } finally {
    if (saved !== undefined) process.env.YWC_API_KEY = saved;
  }
});

test("the key is read from YWC_API_KEY", async () => {
  const fetch = fakeFetch(json(200, VALID));
  process.env.YWC_API_KEY = "ywc_live_fromenvxxxxxxxx";
  try {
    await new YesWeCheck({ fetch }).validate("a@b.co");
    assert.equal(fetch.calls[0].init.headers.Authorization, "Bearer ywc_live_fromenvxxxxxxxx");
  } finally {
    delete process.env.YWC_API_KEY;
  }
});

test("401 becomes a typed API error", async () => {
  const fetch = fakeFetch(json(401, { statusCode: 401, message: "Invalid or revoked API key", code: "UNAUTHORIZED" }));
  await assert.rejects(client(fetch).validate("a@b.co"), (e) => {
    assert.ok(e instanceof YesWeCheckApiError);
    assert.equal(e.status, 401);
    assert.equal(e.code, "UNAUTHORIZED");
    assert.ok(e.isAuthError);
    return true;
  });
  assert.equal(fetch.calls.length, 1);
});

test("402 is flagged as insufficient credits and not retried", async () => {
  const fetch = fakeFetch(json(402, { statusCode: 402, message: "Insufficient credits for SMTP validation", code: "INSUFFICIENT_CREDITS" }));
  await assert.rejects(client(fetch).validate("a@b.co"), (e) => e.isInsufficientCredits && e.code === "INSUFFICIENT_CREDITS");
  assert.equal(fetch.calls.length, 1);
});

test("400 joins the array of messages", async () => {
  const fetch = fakeFetch(json(400, { statusCode: 400, message: ["email must be an email", "property foo should not exist"] }));
  await assert.rejects(client(fetch).validate("nope"), (e) => /email must be an email; property foo should not exist/.test(e.message));
});

test("429 is retried after Retry-After, even for validate (refused before any processing)", async () => {
  const fetch = fakeFetch(json(429, { statusCode: 429, message: "slow down", code: "API_KEY_RATE_LIMITED" }, { "retry-after": "0" }), json(200, VALID));
  const res = await client(fetch).validate("a@b.co");
  assert.equal(res.result, "valid");
  assert.equal(fetch.calls.length, 2);
});

test("429 with a plain-text body keeps the text as message", async () => {
  const text = new Response("Too many requests from this IP, please try again later", { status: 429, headers: { "retry-after": "30" } });
  const fetch = fakeFetch(text);
  await assert.rejects(client(fetch).validate("a@b.co"), (e) => {
    assert.ok(e.isRateLimited);
    assert.equal(e.retryAfter, 30);
    assert.match(e.message, /Too many requests from this IP/);
    return true;
  });
  assert.equal(fetch.calls.length, 1, "Retry-After above maxRetryDelay is not awaited");
});

test("429 API_KEY_BUDGET_EXCEEDED is never retried", async () => {
  const fetch = fakeFetch(json(429, { statusCode: 429, message: "cap", code: "API_KEY_BUDGET_EXCEEDED", details: { window: "day" } }, { "retry-after": "0" }));
  await assert.rejects(client(fetch).validate("a@b.co"), (e) => e.code === "API_KEY_BUDGET_EXCEEDED" && e.details.window === "day");
  assert.equal(fetch.calls.length, 1);
});

test("validate is not replayed after a network error (it may have used a credit)", async () => {
  const fetch = fakeFetch(new TypeError("fetch failed"), json(200, VALID));
  await assert.rejects(client(fetch).validate("a@b.co"), (e) => e instanceof YesWeCheckConnectionError && !e.timedOut);
  assert.equal(fetch.calls.length, 1);
});

test("validate is not replayed after a 503", async () => {
  const fetch = fakeFetch(json(503, { statusCode: 503, message: "unavailable" }, { "retry-after": "0" }), json(200, VALID));
  await assert.rejects(client(fetch).validate("a@b.co"), (e) => e.status === 503);
  assert.equal(fetch.calls.length, 1);
});

test("free endpoints are replayed after a network error or a 503", async () => {
  const me = { organization: { name: "ACME" }, credits: { unlimited: false, balance: 10 }, apiKey: {} };
  const fetch = fakeFetch(new TypeError("fetch failed"), json(503, {}, { "retry-after": "0" }), json(200, me));
  const res = await client(fetch, { maxRetries: 2 }).me();
  assert.equal(res.credits.balance, 10);
  assert.equal(fetch.calls.length, 3);
});

test("a timeout is reported as such", async () => {
  const slow = (url, init) =>
    new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)));
  // Before Node 24, AbortSignal.timeout() does not keep the event loop alive on its own
  // (a real request does, through its socket): hold it open for the duration of the test.
  const keepAlive = setTimeout(() => {}, 5_000);
  try {
    await assert.rejects(new YesWeCheck({ apiKey: KEY, fetch: slow, timeoutMs: 20 }).validate("a@b.co"), (e) => e instanceof YesWeCheckConnectionError && e.timedOut);
  } finally {
    clearTimeout(keepAlive);
  }
});

test("suggestTypo sends an email or a domain", async () => {
  const fetch = fakeFetch(json(200, { detected: true }), json(200, { detected: true }));
  const ywc = client(fetch);
  await ywc.suggestTypo("jane@gmial.com");
  await ywc.suggestTypo("gmial.com");
  assert.deepEqual(fetch.calls[0].body, { email: "jane@gmial.com" });
  assert.deepEqual(fetch.calls[1].body, { domain: "gmial.com" });
});

test("suggestLocalpart puts the domain in the query string", async () => {
  const fetch = fakeFetch(json(200, { suggestions: [] }));
  await client(fetch).suggestLocalpart("Jane", "Doe", { domain: "company.co.uk", maxResults: 5 });
  assert.equal(fetch.calls[0].url, "https://api.yeswecheck.fr/v2/email/suggest/localpart?domain=company.co.uk");
  assert.deepEqual(fetch.calls[0].body, { firstName: "Jane", lastName: "Doe", maxResults: 5 });
});

test("catalog and health need no key", async () => {
  const fetch = fakeFetch(json(200, { plans: [], packs: [] }), json(200, { status: "healthy" }));
  const ywc = new YesWeCheck({ fetch });
  await ywc.catalog();
  await ywc.health();
  assert.equal(fetch.calls[0].init.headers.Authorization, undefined);
  assert.equal(fetch.calls[1].url, "https://api.yeswecheck.fr/health");
});

test("the SDK refuses to run in a browser unless told otherwise", () => {
  globalThis.window = {};
  globalThis.document = {};
  try {
    assert.throws(() => new YesWeCheck({ apiKey: KEY }), /never in a browser/);
    assert.doesNotThrow(() => new YesWeCheck({ apiKey: KEY, dangerouslyAllowBrowser: true }));
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("helpers: isDeliverable, suggestedEmail, hasWarning", () => {
  assert.equal(isDeliverable(VALID), true);
  assert.equal(isDeliverable({ ...VALID, result: "risky" }), true);
  assert.equal(isDeliverable({ ...VALID, result: "invalid" }), false);
  assert.equal(isDeliverable({ ...VALID, result: "unknown" }), false);

  const typo = {
    ...VALID,
    result: "invalid",
    warnings: [{ code: "TYPO_DETECTED", severity: "warning", message: "typo" }],
    features: { ...VALID.features, typoDomain: { result: "invalid", score: 20, message: "typo", details: { suggestedEmail: "jane@gmail.com" } } },
  };
  assert.equal(suggestedEmail(typo), "jane@gmail.com");
  assert.equal(suggestedEmail(VALID), undefined);
  const verified = { ...typo, features: { ...typo.features, typoCorrection: { correctedDomain: "gmail.com", correctedEmail: "jane.doe@gmail.com" } } };
  assert.equal(suggestedEmail(verified), "jane.doe@gmail.com");
  assert.equal(hasWarning(typo, "TYPO_DETECTED"), true);
  assert.equal(hasWarning(VALID, "TYPO_DETECTED"), false);
});

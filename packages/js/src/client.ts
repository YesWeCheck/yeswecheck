import { YesWeCheckApiError, YesWeCheckConnectionError, YesWeCheckError } from "./errors.js";
import type {
  CatalogResponse,
  CountriesResponse,
  EnrichOptions,
  EnrichmentFeature,
  HealthResponse,
  MeResponse,
  SuggestDomainOptions,
  SuggestDomainResponse,
  SuggestLocalpartOptions,
  SuggestLocalpartResponse,
  SuggestNameResponse,
  TypoDomainResponse,
  ValidateOptions,
  ValidationResponse,
} from "./types.js";

export const VERSION = "0.1.0";
export const DEFAULT_BASE_URL = "https://api.yeswecheck.fr";

export interface YesWeCheckOptions {
  /** API key (`ywc_live_…` or `ywc_test_…`). Defaults to the `YWC_API_KEY` environment variable. */
  apiKey?: string;
  /** Defaults to `https://api.yeswecheck.fr`. */
  baseUrl?: string;
  /**
   * Per-request timeout in ms. Default 30,000: a mailbox check can take several seconds
   * when the remote server is slow.
   */
  timeoutMs?: number;
  /** How many times a request may be retried (rate limits, temporary errors). Default 2. */
  maxRetries?: number;
  /** Longest `Retry-After` the SDK will wait for automatically, in seconds. Default 60. */
  maxRetryDelay?: number;
  /** Language of error messages (`Accept-Language`). Default `en-GB`. */
  language?: string;
  /** Custom `fetch` implementation (tests, proxies). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /**
   * The SDK refuses to run in a browser, where your API key would be visible to anyone.
   * Use the YesWeCheck form widget instead. Set this only if you know what you are doing.
   */
  dangerouslyAllowBrowser?: boolean;
}

interface RequestSpec {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
  auth: boolean;
  /**
   * Whether a request that may have reached the server can be replayed safely.
   * `validate` can use a credit, so it is only retried when the API refused it upfront (429).
   */
  replayable: boolean;
}

type Env = { process?: { env?: Record<string, string | undefined>; versions?: { node?: string } } };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isBrowser(): boolean {
  const g = globalThis as { window?: unknown; document?: unknown };
  return typeof g.window !== "undefined" && typeof g.document !== "undefined";
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, (date - Date.now()) / 1000);
}

/**
 * Client for the YesWeCheck email verification API.
 *
 * ```ts
 * const ywc = new YesWeCheck(); // reads YWC_API_KEY
 * const { result } = await ywc.validate("jane.doe@company.co.uk");
 * ```
 */
export class YesWeCheck {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly maxRetryDelay: number;
  private readonly language: string;
  private readonly doFetch: typeof fetch;

  constructor(options: YesWeCheckOptions = {}) {
    if (isBrowser() && !options.dangerouslyAllowBrowser) {
      throw new YesWeCheckError(
        "YesWeCheck: this SDK must run on a server, never in a browser where your API key would be exposed. " +
          "For forms, use the YesWeCheck widget: https://docs.yeswecheck.fr/uk/guides/widget",
      );
    }
    const env = (globalThis as Env).process?.env;
    this.apiKey = options.apiKey ?? env?.YWC_API_KEY;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = Math.max(0, options.maxRetries ?? 2);
    this.maxRetryDelay = options.maxRetryDelay ?? 60;
    this.language = options.language ?? "en-GB";
    const f = options.fetch ?? globalThis.fetch;
    if (typeof f !== "function") {
      throw new YesWeCheckError("YesWeCheck: no fetch implementation found. Use Node.js 20+ or pass { fetch }.");
    }
    this.doFetch = f.bind(globalThis);
  }

  // ── Validation ────────────────────────────────────────────────────────────

  /**
   * Verify one email address: `POST /v2/email/validate`.
   *
   * Always resolves when the verification completes, whatever the verdict: branch on `result`.
   * Uses 1 credit only if your key has SMTP enabled and the verdict is not `unknown`.
   */
  validate(email: string, options: ValidateOptions = {}): Promise<ValidationResponse> {
    return this.request({ method: "POST", path: "/v2/email/validate", body: { email, ...options }, auth: true, replayable: false });
  }

  /** Presumed first name, last name, gender and age range of an address: `POST /v2/email/enrich`. Free. */
  enrich(email: string, options: EnrichOptions = {}): Promise<EnrichmentFeature> {
    return this.request({ method: "POST", path: "/v2/email/enrich", body: { email, ...options }, auth: true, replayable: true });
  }

  // ── Suggestions (free) ────────────────────────────────────────────────────

  /** Domain autocomplete while the user types (`ho` → `hotmail.co.uk`…): `POST /v2/email/suggest/domain`. */
  suggestDomain(partial: string, options: SuggestDomainOptions = {}): Promise<SuggestDomainResponse> {
    return this.request({ method: "POST", path: "/v2/email/suggest/domain", body: { partial, ...options }, auth: true, replayable: true });
  }

  /** Countries available for domain suggestions: `GET /v2/email/suggest/domain/countries`. */
  suggestDomainCountries(): Promise<CountriesResponse> {
    return this.request({ method: "GET", path: "/v2/email/suggest/domain/countries", auth: true, replayable: true });
  }

  /**
   * Detect a typo in a domain or an address (`jane@gmial.com` → `jane@gmail.com`):
   * `POST /v2/email/suggest/typo-domain`.
   */
  suggestTypo(emailOrDomain: string): Promise<TypoDomainResponse> {
    const body = emailOrDomain.includes("@") ? { email: emailOrDomain } : { domain: emailOrDomain };
    return this.request({ method: "POST", path: "/v2/email/suggest/typo-domain", body, auth: true, replayable: true });
  }

  /** Likely local parts for a person (`jane.doe`, `j.doe`…): `POST /v2/email/suggest/localpart`. */
  suggestLocalpart(firstName: string, lastName: string, options: SuggestLocalpartOptions = {}): Promise<SuggestLocalpartResponse> {
    const { domain, ...rest } = options;
    return this.request({
      method: "POST",
      path: "/v2/email/suggest/localpart",
      query: { domain },
      body: { firstName, lastName, ...rest },
      auth: true,
      replayable: true,
    });
  }

  /** First-name autocomplete: `POST /v2/email/suggest-firstname`. */
  suggestFirstName(query: string, limit?: number): Promise<SuggestNameResponse> {
    return this.request({ method: "POST", path: "/v2/email/suggest-firstname", body: { query, limit }, auth: true, replayable: true });
  }

  /** Last-name autocomplete: `POST /v2/email/suggest-lastname`. */
  suggestLastName(query: string, limit?: number): Promise<SuggestNameResponse> {
    return this.request({ method: "POST", path: "/v2/email/suggest-lastname", body: { query, limit }, auth: true, replayable: true });
  }

  // ── Platform (free) ───────────────────────────────────────────────────────

  /** Organisation, credit balance and the calling key's usage and caps: `GET /v2/me`. */
  me(): Promise<MeResponse> {
    return this.request({ method: "GET", path: "/v2/me", auth: true, replayable: true });
  }

  /** Public catalogue of plans and credit packs: `GET /v2/billing/catalog`. No key needed. */
  catalog(): Promise<CatalogResponse> {
    return this.request({ method: "GET", path: "/v2/billing/catalog", auth: false, replayable: true });
  }

  /** API health check: `GET /health`. No key needed. */
  health(): Promise<HealthResponse> {
    return this.request({ method: "GET", path: "/health", auth: false, replayable: true });
  }

  // ── Plumbing ──────────────────────────────────────────────────────────────

  private headers(spec: RequestSpec): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/json", "Accept-Language": this.language };
    if (spec.body !== undefined) h["Content-Type"] = "application/json";
    if (spec.auth) {
      if (!this.apiKey) {
        throw new YesWeCheckError("YesWeCheck: missing API key. Pass { apiKey } or set the YWC_API_KEY environment variable.");
      }
      h.Authorization = `Bearer ${this.apiKey}`;
    }
    if (!isBrowser()) {
      const node = (globalThis as Env).process?.versions?.node;
      h["User-Agent"] = `yeswecheck-js/${VERSION}${node ? ` node/${node}` : ""}`;
    }
    return h;
  }

  private url(spec: RequestSpec): string {
    const url = new URL(this.baseUrl + spec.path);
    for (const [k, v] of Object.entries(spec.query ?? {})) if (v !== undefined) url.searchParams.set(k, v);
    return url.toString();
  }

  private async request<T>(spec: RequestSpec): Promise<T> {
    const headers = this.headers(spec);
    const body = spec.body === undefined ? undefined : JSON.stringify(spec.body);
    const url = this.url(spec);

    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await this.doFetch(url, { method: spec.method, headers, body, signal: AbortSignal.timeout(this.timeoutMs) });
      } catch (err) {
        const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
        if (spec.replayable && attempt < this.maxRetries) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw new YesWeCheckConnectionError(
          timedOut
            ? `YesWeCheck: request timed out after ${this.timeoutMs} ms`
            : `YesWeCheck: network error (${err instanceof Error ? err.message : String(err)})`,
          timedOut,
          err,
        );
      }

      if (res.ok) return (await res.json()) as T;

      const error = await this.toApiError(res);
      const waitSeconds = error.retryAfter ?? 2 ** attempt;
      // 429 = refused before any processing (never billed), so it is safe to retry for every endpoint.
      const retryable =
        (res.status === 429 && error.code !== "API_KEY_BUDGET_EXCEEDED") ||
        (spec.replayable && [502, 503, 504].includes(res.status));
      if (retryable && attempt < this.maxRetries && waitSeconds <= this.maxRetryDelay) {
        await sleep(waitSeconds * 1000);
        continue;
      }
      throw error;
    }
  }

  private async toApiError(res: Response): Promise<YesWeCheckApiError> {
    const text = await res.text().catch(() => "");
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* plain-text body (per-IP rate limit) */
    }
    const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const raw = b.message;
    const message = Array.isArray(raw)
      ? raw.filter((m) => typeof m === "string").join("; ")
      : typeof raw === "string"
        ? raw
        : typeof body === "string" && body
          ? body
          : res.statusText || `HTTP ${res.status}`;
    return new YesWeCheckApiError({
      status: res.status,
      message: `YesWeCheck ${res.status}: ${message}`,
      code: typeof b.code === "string" ? b.code : undefined,
      details: b.details && typeof b.details === "object" ? (b.details as Record<string, unknown>) : undefined,
      retryAfter: parseRetryAfter(res.headers.get("retry-after")),
      body,
    });
  }
}

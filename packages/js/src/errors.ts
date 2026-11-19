/** Base class for every error thrown by the SDK. */
export class YesWeCheckError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "YesWeCheckError";
  }
}

/** The API answered with a non-2xx status. */
export class YesWeCheckApiError extends YesWeCheckError {
  /** HTTP status, e.g. 401, 402, 429. */
  readonly status: number;
  /**
   * Stable machine-readable code when the API sends one
   * (`UNAUTHORIZED`, `INSUFFICIENT_CREDITS`, `API_KEY_RATE_LIMITED`, `API_KEY_BUDGET_EXCEEDED`…).
   * Branch on this, never on the message.
   */
  readonly code?: string;
  /** Extra context sent by the API (e.g. the cap window for `API_KEY_BUDGET_EXCEEDED`). */
  readonly details?: Record<string, unknown>;
  /** Seconds to wait before retrying, from the `Retry-After` header. */
  readonly retryAfter?: number;
  /** Raw response body (parsed JSON, or text). */
  readonly body: unknown;

  constructor(init: {
    status: number;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    retryAfter?: number;
    body: unknown;
  }) {
    super(init.message);
    this.name = "YesWeCheckApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.retryAfter = init.retryAfter;
    this.body = init.body;
  }

  /** `401`: missing, invalid or revoked API key. */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /** `402 INSUFFICIENT_CREDITS`: top up, or fall back to a key without SMTP. */
  get isInsufficientCredits(): boolean {
    return this.status === 402;
  }

  /** `429`: rate limit or key cap reached. See `code` and `retryAfter`. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/** The request did not complete: network failure or client-side timeout. */
export class YesWeCheckConnectionError extends YesWeCheckError {
  /** True when the SDK's own timeout aborted the request. */
  readonly timedOut: boolean;

  constructor(message: string, timedOut: boolean, cause?: unknown) {
    super(message, { cause });
    this.name = "YesWeCheckConnectionError";
    this.timedOut = timedOut;
  }
}

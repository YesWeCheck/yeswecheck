/**
 * Types for the YesWeCheck API v2.
 * Source of truth: openapi/openapi.yaml at the root of this repository.
 */

/** Technical verdict. Branch your logic on this. */
export type Verdict = "valid" | "risky" | "invalid" | "unknown";

/** Business decision computed from the policy attached to your key (`accepted` when there is no policy). */
export type Decision = "accepted" | "rejected";

/** Result of one check. For risk checks, `result: "invalid"` means the signal was detected. */
export interface Feature {
  result: "valid" | "invalid" | "unknown";
  /** 0–100 */
  score: number;
  /** Human-readable explanation, in English. */
  message: string;
  /** Stable machine code, e.g. `MX_FOUND`, `MAILBOX_EXISTS`, `MAILBOX_NOT_FOUND`. */
  reasonCode?: string;
  details?: Record<string, unknown>;
}

export type WarningCode =
  | "DISPOSABLE_EMAIL"
  | "TYPOSQUAT_DOMAIN"
  | "TYPO_DETECTED"
  | "TYPO_CORRECTION_VERIFIED"
  | "MALICIOUS_DOMAIN"
  | "ROLE_ACCOUNT"
  | "NO_REPLY"
  | "CATCH_ALL_DOMAIN"
  | "RANDOM_LOCALPART"
  | "PROFANITY"
  | "TOR_EXIT_NODE"
  | "ANONYMOUS_NETWORK"
  | "DATACENTER_IP"
  | "DUPLICATED_SUBMITTER";

export interface Warning {
  code: WarningCode | (string & {});
  severity: "info" | "warning" | "error";
  message: string;
  data?: Record<string, unknown>;
}

export type PolicyReason =
  | "reject_disposable"
  | "reject_malicious_domain"
  | "reject_typosquat"
  | "reject_role_account"
  | "reject_no_reply"
  | "reject_catch_all"
  | "reject_free_provider"
  | "reject_unknown"
  | "reject_on_profanity"
  | "reject_on_random_detection"
  | "reject_low_quality_score"
  | "reject_low_domain_health"
  | "reject_vpn_or_tor"
  | "reject_datacenter_ip";

export interface PolicyDecision {
  decision?: Decision;
  reasons?: Array<PolicyReason | (string & {})>;
  rejectedByClientConfig?: boolean;
}

export interface EnrichmentDetails {
  firstName?: string;
  firstNameScore?: number;
  lastName?: string;
  lastNameScore?: number;
  gender?: "male" | "female" | "unisex" | "unknown";
  genderScore?: number;
  /** Absent when the selected country has no age data. */
  presumedAge?: number;
  presumedAgeRange?: string;
  presumedAgeScore?: number;
  ageBasis?: { country?: string; resolvedFrom?: "param" | "tld" | "default"; source?: string | null };
  status?: "success" | "partial" | "failed";
  [key: string]: unknown;
}

export interface EnrichmentFeature extends Omit<Feature, "details"> {
  details?: EnrichmentDetails;
}

/** Details of each check. A check disabled on your key is absent; `syntax` and `dns` are always present. */
export interface Features {
  syntax: Feature;
  dns: Feature;
  smtp?: Feature;
  catchAll?: { result: "unknown"; isCatchAll: boolean; reasonCode?: string; message?: string };
  disposable?: Feature;
  maliciousDomains?: Feature;
  roleAccount?: Feature;
  noReply?: Feature;
  profanity?: Feature;
  randomDetection?: Feature;
  aliasing?: Feature;
  typoDomain?: Feature;
  typosquat?: Feature;
  /** Present only when a corrected address was verified as deliverable. */
  typoCorrection?: { correctedDomain: string; correctedEmail: string };
  enrichment?: EnrichmentFeature;
  listCheck?: Feature;
  domainHealth?: Record<string, unknown>;
  network?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ValidationResponse {
  /** The verdict: valid | risky | invalid | unknown. */
  result: Verdict;
  /** Confidence, 0–100. Use it to sort or refine, not as a contractual threshold. */
  score: number;
  /** Consumer domain (webmail, internet provider) or disposable domain. */
  freeProvider: boolean;
  businessEmail: boolean;
  disposable: boolean;
  /** Sub-addressed address (`jane+tag@…`). Informational. */
  alias: boolean;
  /** Decision of your key's policy; `accepted` when there is no policy. */
  finalDecision?: Decision;
  policy?: PolicyDecision;
  /** Risk signals found. Absent when there are none. */
  warnings?: Warning[];
  features: Features;
  /** Support reference (e.g. `YWC-7KQ2M9AB`), valid 90 days. Opaque: do not build on it. */
  debug_ref?: string;
  metadata: {
    requestId?: string;
    timestamp?: string;
    /** Processing time in milliseconds. */
    processingTime?: number;
    credits?: {
      /** 1 when this call used a credit. */
      used?: 0 | 1;
      /** Balance after the call; only filled in when SMTP ran, 0 otherwise. */
      remaining?: number;
      breakdown?: Record<string, number>;
    };
    apiVersion?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ValidateOptions {
  /** Reference country for the presumed age (ISO 3166-1 alpha-2 or alpha-3), e.g. `GB`. */
  country?: string;
  /** Maximum wait for the remote mail server, in ms (1,000–30,000). No effect if the key has no SMTP. */
  smtpTimeout?: number;
}

export interface EnrichOptions {
  /** Reference country for the presumed age (ISO 3166-1 alpha-2 or alpha-3). */
  country?: string;
}

export type DomainType = "webmail" | "isp" | "professional" | "secure";

export interface DomainSuggestion {
  domain: string;
  provider?: string;
  type?: DomainType;
  /** 1–15 */
  popularity?: number;
  score?: number;
}

export interface SuggestDomainOptions {
  /** Country code (`GB`, `FR`, `DE`…) or `GLOBAL` (default). */
  country?: string;
  /** Maximum number of suggestions (default 15). */
  count?: number;
  type?: DomainType;
}

export interface SuggestDomainResponse {
  country: string;
  count: number;
  type: string | null;
  partial: string | null;
  suggestions: DomainSuggestion[];
  total: number;
}

export interface CountriesResponse {
  countries: Array<{ code: string; name: string }>;
}

export interface TypoDomainResponse {
  input: string;
  inputDomain: string;
  detected: boolean;
  suggestedDomain: string | null;
  /** `null` when the input contains no `@`. */
  suggestedEmail: string | null;
  score: number;
  message: string;
  reasonCode: string | null;
  details: Record<string, unknown> | null;
}

export interface SuggestLocalpartOptions {
  /** Adds the full `email` field to each suggestion. */
  domain?: string;
  includeNumbers?: boolean;
  /** Default 20. */
  maxResults?: number;
  /** Input already typed, used as a filter. */
  partial?: string;
}

export interface LocalpartSuggestion {
  localpart: string;
  pattern: string;
  popularity: number;
  email?: string;
}

export interface SuggestLocalpartResponse {
  firstName: string;
  lastName: string;
  domain?: string | null;
  partial: string | null;
  suggestions: LocalpartSuggestion[];
  total: number;
}

export interface NameSuggestion {
  firstName?: string;
  lastName?: string;
  source?: string;
  popularity?: number;
  gender?: string;
  score?: number;
  [key: string]: unknown;
}

export interface SuggestNameResponse {
  query: string;
  suggestions: NameSuggestion[];
  total: number;
}

export interface MeResponse {
  organization: { name: string };
  credits: { unlimited: boolean; /** `null` on an unlimited plan. */ balance: number | null };
  apiKey: {
    name: string;
    environment: "live" | "test" | (string & {});
    smtpEnabled: boolean;
    /** Tracked only when the key has a cap; otherwise `null`. */
    creditsUsedToday: number | null;
    creditsUsedThisMonth: number | null;
    maxCreditsPerDay: number | null;
    maxCreditsPerMonth: number | null;
  };
}

export interface CatalogPlan {
  code: string;
  name: string;
  amountCents: number;
  currency: string;
  monthlyCredits: number;
  unlimited: boolean;
  purchasable: boolean;
  displayOrder: number;
}

export interface CatalogPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  currency: string;
  unitPriceCents: number;
  purchasable: boolean;
  displayOrder: number;
}

export interface CatalogResponse {
  currency: string;
  taxBehavior: string;
  plans: CatalogPlan[];
  packs: CatalogPack[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

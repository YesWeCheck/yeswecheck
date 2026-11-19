"""Minimal YesWeCheck client and sign-up decision, for this example."""

import logging
import os
from dataclasses import dataclass
from typing import Literal, Optional

import httpx

API_URL = os.environ.get("YWC_BASE_URL", "https://api.yeswecheck.fr")
log = logging.getLogger("yeswecheck")


@dataclass(frozen=True)
class EmailCheck:
    ok: bool
    email: str
    message: Optional[str] = None
    suggestion: Optional[str] = None
    # Accepted, but worth a second look: "risky" (no-reply, lookalike…),
    # "unconfirmed" (the mail server gave no answer), "unchecked" (API unreachable).
    flag: Optional[Literal["risky", "unconfirmed", "unchecked"]] = None


def new_client() -> httpx.AsyncClient:
    """One client for the whole app: it keeps connections open between calls."""
    return httpx.AsyncClient(
        base_url=API_URL,
        timeout=30,  # a mailbox check can take a few seconds
        headers={
            "Authorization": f"Bearer {os.environ['YWC_API_KEY']}",
            "Accept-Language": "en-GB",  # error messages in English
        },
    )


def suggested_email(res: dict) -> Optional[str]:
    """The typo fix to offer: the verified corrected address first, otherwise the suggestion."""
    features = res.get("features") or {}
    corrected = (features.get("typoCorrection") or {}).get("correctedEmail")
    suggested = ((features.get("typoDomain") or {}).get("details") or {}).get("suggestedEmail")
    return corrected or suggested


def decide(email: str, res: dict) -> EmailCheck:
    """Turns a verdict into a sign-up decision. Adapt the risky and unknown branches to your context."""
    # 1. The policy attached to your key (set in the dashboard) can refuse a deliverable address.
    if res.get("finalDecision") == "rejected":
        return EmailCheck(False, email, "This email address is not accepted.")

    # 2. A typo: offer the fix rather than a bare error.
    suggestion = suggested_email(res)
    if suggestion and res["result"] != "valid":
        return EmailCheck(False, email, f"Did you mean {suggestion}?", suggestion)

    result = res["result"]
    if result == "valid":
        return EmailCheck(True, email)
    if result == "invalid":
        return EmailCheck(False, email, "This email address cannot receive email.")
    if result == "risky":
        if res.get("disposable"):
            return EmailCheck(False, email, "Please use a permanent email address, not a temporary one.")
        return EmailCheck(True, email, flag="risky")
    return EmailCheck(True, email, flag="unconfirmed")  # unknown: never billed, never block a real customer


async def check_email(client: httpx.AsyncClient, email: str) -> EmailCheck:
    try:
        response = await client.post("/v2/email/validate", json={"email": email})
    except httpx.HTTPError as exc:
        log.error("YesWeCheck unreachable: %r", exc)
        return EmailCheck(True, email, flag="unchecked")

    if response.status_code == 400:
        return EmailCheck(False, email, "This email address is not valid.")
    if response.status_code != 200:
        # No credits left, revoked key, rate limit, outage: log it, and never block a sign-up because of it.
        # Some 429 answers are plain text, so log the raw body rather than decoding it.
        log.error("YesWeCheck %s: %s", response.status_code, response.text[:300])
        return EmailCheck(True, email, flag="unchecked")
    return decide(email, response.json())

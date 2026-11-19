<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Accepts an email address only if it can receive mail.
 * Put it after 'bail' and 'email', so that no call is made for an empty or malformed value:
 *     'email' => ['bail', 'required', 'email', $rule = new DeliverableEmail()]
 */
class DeliverableEmail implements ValidationRule
{
    /** Typo fix to offer the user ("Did you mean…?"), filled in when the address is refused for a typo. */
    public ?string $suggestion = null;

    /** Accepted, but worth a second look: "risky" (no-reply, lookalike…), "unconfirmed" (no answer from the server), "unchecked" (API unreachable). */
    public ?string $flag = null;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            $response = Http::baseUrl(config('services.yeswecheck.url'))
                ->withToken(config('services.yeswecheck.key'))
                ->withHeaders(['Accept-Language' => 'en-GB']) // error messages in English
                ->acceptJson()
                ->timeout(30) // a mailbox check can take a few seconds
                ->post('/v2/email/validate', ['email' => $value]);
        } catch (ConnectionException $e) {
            Log::error('YesWeCheck unreachable', ['error' => $e->getMessage()]);
            $this->flag = 'unchecked';

            return;
        }

        if ($response->status() === 400) {
            $fail('This email address is not valid.');

            return;
        }
        if (! $response->ok()) {
            // No credits left, revoked key, rate limit, outage: log it, and never block a sign-up because of it.
            Log::error('YesWeCheck error', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 300)]);
            $this->flag = 'unchecked';

            return;
        }

        $res = $response->json();

        // 1. The policy attached to your key (set in the dashboard) can refuse a deliverable address.
        if (($res['finalDecision'] ?? null) === 'rejected') {
            $fail('This email address is not accepted.');

            return;
        }

        // 2. A typo: offer the fix rather than a bare error.
        $suggestion = $res['features']['typoCorrection']['correctedEmail']
            ?? $res['features']['typoDomain']['details']['suggestedEmail']
            ?? null;
        if ($suggestion && $res['result'] !== 'valid') {
            $this->suggestion = $suggestion;
            $fail("Did you mean {$suggestion}?");

            return;
        }

        switch ($res['result']) {
            case 'invalid':
                $fail('This email address cannot receive email.');
                break;
            case 'risky':
                if ($res['disposable'] ?? false) {
                    $fail('Please use a permanent email address, not a temporary one.');
                } else {
                    $this->flag = 'risky'; // no-reply, lookalike domain…
                }
                break;
            case 'unknown':
                $this->flag = 'unconfirmed'; // never billed; don't block a real customer
                break;
        }
    }
}

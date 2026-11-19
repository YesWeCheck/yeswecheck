<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Examples</a> › Laravel</sub>

# Laravel rule

`DeliverableEmail` is a validation rule that refuses undeliverable and temporary addresses. On a typo, it keeps the corrected address so the form can offer it.

**Stack:** Laravel 11+, PHP 8.2+, Laravel's HTTP client (no extra package).

```php
'email' => ['bail', 'required', 'email', new DeliverableEmail()],
```

## Files

| File | Role |
|---|---|
| [`app/Rules/DeliverableEmail.php`](app/Rules/DeliverableEmail.php) | The rule and the decision logic. **The file to copy.** |
| [`app/Http/Controllers/SignupController.php`](app/Http/Controllers/SignupController.php) | Validates the form and passes the suggestion to the view |
| [`resources/views/signup.blade.php`](resources/views/signup.blade.php) | The form, with the "Use jane@gmail.com" button |
| [`config/services.php`](config/services.php) | The entry to add to your own `config/services.php` |

## Set it up

1. Copy the files into your application, and the `yeswecheck` entry into `config/services.php`.
2. Add your key to `.env`:

   ```dotenv
   YWC_API_KEY=ywc_live_…
   ```

3. Add the routes to `routes/web.php`:

   ```php
   use App\Http\Controllers\SignupController;

   Route::get('/signup', [SignupController::class, 'create']);
   Route::post('/signup', [SignupController::class, 'store']);
   ```

## How it works

- **No call for a bad format.** With `bail`, Laravel stops at the first failing rule: `required` and `email` run before the API is called.
- **One-click fix.** The controller flashes `$rule->suggestion` to the session. The button in the view has `name="email"`; it comes after the text field and PHP keeps the last value sent, so the form is checked again with the corrected address.
- **Flags.** After a successful validation, `$rule->flag` is `"risky"`, `"unconfirmed"` or `"unchecked"` when the address is accepted but worth a second look.
- **Not blocking.** If the API cannot be reached, the rule logs the error and lets the address through.

For a JSON API, `$request->validate([...])` returns the `422` on its own; add the suggestion to the response if your front end offers the fix.

Change the `risky` and `unknown` branches to suit your form: see the [rules shared by every recipe](../README.md#the-same-rules-everywhere).

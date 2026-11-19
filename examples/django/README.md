<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Examples</a> › Django</sub>

# Django form

A regular Django form whose `clean_email()` refuses undeliverable and temporary addresses. On a typo, the template shows a button that resubmits the form with the corrected address.

**Stack:** Django 5.2+, httpx, Python 3.10+.

## Files

The [`signup/`](signup/) folder is a Django app:

| File | Role |
|---|---|
| [`ywc.py`](signup/ywc.py) | A minimal client and the decision logic. **The file to copy.** |
| [`forms.py`](signup/forms.py) | `SignupForm` and its `clean_email()` |
| [`views.py`](signup/views.py) | The view |
| [`templates/signup/signup.html`](signup/templates/signup/signup.html) | The form, with the "Use jane@gmail.com" button |

## Set it up

1. Copy `signup/` into your project and add `"signup"` to `INSTALLED_APPS`.
2. `pip install httpx`
3. In `settings.py`:

   ```python
   YWC_API_KEY = os.environ["YWC_API_KEY"]
   ```

4. In `urls.py`:

   ```python
   from signup import views

   urlpatterns = [
       path("signup/", views.signup, name="signup"),
       # path("welcome/", …, name="signup-done"),
   ]
   ```

## How it works

```python
def clean_email(self):
    email = self.cleaned_data["email"]  # EmailField has already checked the format
    check = ywc.check_email(email)
    if not check.ok:
        self.suggestion = check.suggestion
        raise ValidationError(check.message, code="undeliverable")
    self.email_flag = check.flag
    return check.email
```

- **No call for a bad format.** Django only runs `clean_email()` once `EmailField` has accepted the value.
- **One-click fix.** The suggestion button has `name="email"`: it comes after the text field, and Django keeps the last value sent, so the form is checked again with the corrected address.
- **Not blocking.** If the API cannot be reached, the error is logged and the address goes through, with `form.email_flag = "unchecked"`.

Change the `risky` and `unknown` branches of `decide()` to suit your form: see the [rules shared by every recipe](../README.md#the-same-rules-everywhere).

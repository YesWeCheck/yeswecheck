from django import forms
from django.core.exceptions import ValidationError

from . import ywc


class SignupForm(forms.Form):
    name = forms.CharField(max_length=100)
    email = forms.EmailField()

    suggestion: str | None = None  # typo fix to offer in the template
    email_flag: str | None = None  # "risky", "unconfirmed" or "unchecked": accepted, worth a second look

    def clean_email(self):
        # Django's EmailField has already checked the format: no call is made for a malformed value.
        email = self.cleaned_data["email"]
        check = ywc.check_email(email)
        if not check.ok:
            self.suggestion = check.suggestion
            raise ValidationError(check.message, code="undeliverable")
        self.email_flag = check.flag
        return check.email

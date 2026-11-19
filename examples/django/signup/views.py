from django.shortcuts import redirect, render

from .forms import SignupForm


def signup(request):
    form = SignupForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        # Create the account here. Keep form.email_flag if you want to review those sign-ups later.
        return redirect("signup-done")
    return render(request, "signup/signup.html", {"form": form})

# Security policy

We take the security of YesWeCheck and of our users' data seriously. Thank you for helping us keep it that way.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Instead, use one of these private channels:

- **GitHub**: [Report a vulnerability](https://github.com/YesWeCheck/yeswecheck/security/advisories/new) (private advisory);
- **Email**: [contact@yeswecheck.fr](mailto:contact@yeswecheck.fr) with `[Security]` in the subject.

Include what you found, the steps to reproduce it and its potential impact. We acknowledge every report within **3 working days** and keep you informed until it is resolved.

## Scope

- The code in this repository (SDKs, CLI, examples);
- the YesWeCheck API (`api.yeswecheck.fr`), dashboard (`app.yeswecheck.fr`) and website.

Please test only against your own account and data, and never run automated scans that could degrade the service for other users.

## Leaked API key?

If one of your API keys has been exposed, revoke or rotate it straight away from **API keys** in the [dashboard](https://app.yeswecheck.fr/uk). See the [FAQ](docs/faq.md#my-key-has-leaked).

<sub><a href="../../README.md">YesWeCheck</a> › <a href="../README.md">Examples</a> › FastAPI</sub>

# FastAPI endpoint

A `POST /signup` endpoint that refuses undeliverable and temporary addresses, and answers a typo with the corrected address. One `httpx.AsyncClient` is opened when the app starts and shared by every request.

**Stack:** FastAPI, httpx, Python 3.10+.

## Files

| File | Role |
|---|---|
| [`ywc.py`](ywc.py) | A minimal async client and the decision logic. **The file to copy.** |
| [`main.py`](main.py) | The app, its lifespan and the endpoint |

## Run it

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export YWC_API_KEY=ywc_live_…
fastapi dev main.py
```

Open http://127.0.0.1:8000/docs, or:

```bash
curl -s localhost:8000/signup -H 'content-type: application/json' -d '{"name":"Jane","email":"jane@gmial.com"}'
```

```json
{ "detail": { "field": "email", "message": "Did you mean jane@gmail.com?", "suggestion": "jane@gmail.com" } }
```

## How it works

```python
@app.post("/signup", status_code=201, response_model=SignupOut)
async def signup(body: SignupIn, request: Request):
    check = await ywc.check_email(request.app.state.ywc, body.email.strip())
    if not check.ok:
        raise HTTPException(422, detail={"field": "email", "message": check.message, "suggestion": check.suggestion})
    return SignupOut(email=check.email, flag=check.flag)
```

- `check.flag` is `"risky"`, `"unconfirmed"` or `"unchecked"` when the address is accepted but worth a second look.
- If the API cannot be reached, `check_email()` logs the error and lets the sign-up through. It reads error bodies as text first: some `429` answers are plain text.
- `YWC_BASE_URL` overrides the API address, handy for tests.

Change the `risky` and `unknown` branches of `decide()` to suit your endpoint: see the [rules shared by every recipe](../README.md#the-same-rules-everywhere).

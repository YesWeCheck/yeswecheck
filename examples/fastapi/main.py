from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

import ywc


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with ywc.new_client() as client:
        app.state.ywc = client
        yield


app = FastAPI(title="Sign-up with YesWeCheck", lifespan=lifespan)


class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)


class SignupOut(BaseModel):
    email: str
    flag: str | None = None


@app.post("/signup", status_code=201, response_model=SignupOut)
async def signup(body: SignupIn, request: Request):
    check = await ywc.check_email(request.app.state.ywc, body.email.strip())
    if not check.ok:
        raise HTTPException(422, detail={"field": "email", "message": check.message, "suggestion": check.suggestion})

    # Create the account here. Keep check.flag if you want to review those sign-ups later.
    return SignupOut(email=check.email, flag=check.flag)

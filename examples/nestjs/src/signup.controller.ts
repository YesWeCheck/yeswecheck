import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { DeliverableEmailPipe, type CheckedEmail } from "./yeswecheck/deliverable-email.pipe.js";

@Controller()
export class SignupController {
  @Post("signup")
  @HttpCode(201)
  signup(@Body("email", DeliverableEmailPipe) { email, flag }: CheckedEmail) {
    // Create the account here. Keep `flag` ("risky", "unconfirmed", "unchecked") if you want to review those sign-ups later.
    return { email, flag: flag ?? null };
  }
}

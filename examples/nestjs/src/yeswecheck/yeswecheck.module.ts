import { Global, Module } from "@nestjs/common";
import { YesWeCheck } from "@yeswecheck/sdk";
import { DeliverableEmailPipe } from "./deliverable-email.pipe.js";

@Global()
@Module({
  providers: [
    // One client for the whole app. Inject `YesWeCheck` anywhere to call other endpoints (me(), suggestTypo()…).
    { provide: YesWeCheck, useFactory: () => new YesWeCheck({ apiKey: process.env.YWC_API_KEY }) },
    DeliverableEmailPipe,
  ],
  exports: [YesWeCheck, DeliverableEmailPipe],
})
export class YesWeCheckModule {}

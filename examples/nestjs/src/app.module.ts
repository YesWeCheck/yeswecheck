import { Module } from "@nestjs/common";
import { YesWeCheckModule } from "./yeswecheck/yeswecheck.module.js";
import { SignupController } from "./signup.controller.js";

@Module({
  imports: [YesWeCheckModule],
  controllers: [SignupController],
})
export class AppModule {}

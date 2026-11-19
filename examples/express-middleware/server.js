import express from "express";
import { requireDeliverableEmail } from "./email-check.js";

const app = express();
app.use(express.json());

app.post("/signup", requireDeliverableEmail(), (req, res) => {
  const { email, flag } = req.emailCheck;
  // Create the account here. Keep `flag` ("risky", "unconfirmed", "unchecked") if you want to review those sign-ups later.
  res.status(201).json({ email, flag: flag ?? null });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));

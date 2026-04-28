const express = require("express");
const {Resend}= require("resend");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
require("dotenv").config();

const app = express();

const resend = new Resend(process.env.RESEND_API_KEY);

app.set("trust proxy", 1);

app.use(cors({
  origin: "https://devmique.vercel.app"
}));
app.use(express.json({ limit: "10kb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
  validate: { xForwardedForHeader: false }
});
app.use("/contact", limiter);

app.get("/", (req, res) => {
  res.send(`Portfolio Email API running |Resend: ${process.env.RESEND_API_KEY ? "✅ set" : "❌ missing"}`);
});

app.post("/contact", async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (email.length > 254 || message.length > 2000) {
    return res.status(400).json({ error: "Input too long" });
  }

    try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "Portfolio Contact",
      text: `From: ${email}\n\n${message}`,
      html: `<p><strong>From:</strong> ${email}</p><p>${message}</p>`
    });


    res.json({ success: true });
  } catch (error) {
    console.error(error?.response?.body?.errors || error);
    res.status(500).json({ error: "Email failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const { Resend } = require("resend");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Init Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Trust proxy (Railway)
app.set("trust proxy", 1);

// ✅ Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10kb" }));

// ✅ Rate limit (apply ke endpoint yang benar)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
});

app.use("/api/contact", limiter);

// ✅ Root route (health check)
app.get("/", (req, res) => {
  res.send("API is running");
});

// ✅ Optional: biar tidak bingung kalau dibuka di browser
app.get("/api/contact", (req, res) => {
  res.send("Use POST method to send message");
});

// ✅ Main endpoint
app.post("/api/contact", async (req, res) => {
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
      from: "onboarding@resend.dev",
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "Portfolio Contact",
      text: `From: ${email}\n\n${message}`,
      html: `<p><strong>From:</strong> ${email}</p><p>${message}</p>`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error?.response?.body?.errors || error);
    res.status(500).json({ error: "Email failed" });
  }
});

// ✅ PORT FIX (PENTING BANGET)
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
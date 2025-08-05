require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://ataul-4b4z.onrender.com",
        "http://localhost:3000",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["POST"],
  })
);

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Order submission endpoint
app.post("/submit-order", async (req, res) => {
  console.log("Получены данные:", req.body);

  try {
    // Save to Supabase
    const { data, error } = await supabase
      .from("orders")
      .insert([req.body])
      .select();

    if (error) throw error;

    // Send email notification
    await transporter.sendMail({
      from: `"Ataul Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "Новая заявка на сайте",
      html: `
        <h2>Новая заявка</h2>
        <p><strong>Имя:</strong> ${req.body.name}</p>
        <p><strong>Email:</strong> ${req.body.email}</p>
        <p><strong>Телефон:</strong> ${req.body.phone}</p>
        <p><strong>Тип сайта:</strong> ${req.body.site_type}</p>
        <p><strong>Комментарии:</strong> ${
          req.body.comments || "Не указаны"
        }</p>
      `,
    });

    // Send Telegram notification
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `📌 Новая заявка на сайте:\n\n👤 Имя: ${
            req.body.name
          }\n📞 Телефон: ${req.body.phone}\n📧 Email: ${
            req.body.email
          }\n🌐 Тип сайта: ${req.body.site_type}\n📅 Сроки: ${
            req.body.deadline || "Не указаны"
          }\n💰 Бюджет: ${req.body.budget || "Не указан"}`,
          parse_mode: "HTML",
        }),
      }
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      error: err.message,
      details: err.response?.data || err.stack,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

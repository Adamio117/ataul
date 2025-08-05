require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

const app = express();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Настройка почты (используем Yandex вместо Resend)
const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/submit-order", async (req, res) => {
  try {
    // 1. Сохраняем в Supabase
    const { data, error } = await supabase.from("orders").insert([req.body]);

    if (error) throw error;

    // 2. Отправляем письмо через Yandex
    await transporter.sendMail({
      from: `"Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "Новая заявка",
      html: `<p>Новая заявка от ${req.body.name}</p>`,
    });

    // 3. Отправляем в Telegram
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `Новая заявка: ${req.body.name}\nТелефон: ${req.body.phone}`,
        }),
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000);

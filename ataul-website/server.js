require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://ataul-4b4z.onrender.com",
        "https://ataull1onrender.com",
        "http://localhost:3000",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],

    credentials: true,
  })
);
app.options("*", cors());
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

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Order submission endpoint
app.post("/submit-order", async (req, res) => {
  console.log("Received order data:", req.body);

  try {
    // Validate required fields
    if (!req.body.name || !req.body.email || !req.body.phone) {
      return res.status(400).json({
        error: "Missing required fields: name, email, phone",
      });
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          company: req.body.company || null,
          site_type: req.body.site_type || null,
          pages: req.body.pages || null,
          features: req.body.features || null,
          deadline: req.body.deadline || null,
          budget: req.body.budget || null,
          comments: req.body.comments || null,
          created_at: new Date().toISOString(),
        },
      ])
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
        <p><strong>Компания:</strong> ${req.body.company || "Не указана"}</p>
        <p><strong>Тип сайта:</strong> ${req.body.site_type || "Не указан"}</p>
        <p><strong>Комментарии:</strong> ${
          req.body.comments || "Не указаны"
        }</p>
      `,
    });

    // Send Telegram notification
    if (process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHAT_ID) {
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
            }\n🏢 Компания: ${
              req.body.company || "Не указана"
            }\n🌐 Тип сайта: ${req.body.site_type || "Не указан"}\n📅 Сроки: ${
              req.body.deadline || "Не указаны"
            }\n💰 Бюджет: ${req.body.budget || "Не указан"}`,
            parse_mode: "HTML",
          }),
        }
      );
    }

    res.json({
      success: true,
      message: "Order submitted successfully",
      data,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

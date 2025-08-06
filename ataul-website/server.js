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
        "https://ataulll.onrender.com", // основной домен
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
    user: process.env.EMAIL_USER || "fallback@email.com", // защита от undefined
    pass: process.env.EMAIL_PASS || "fallback_password",
  },
});

// Добавьте проверку до отправки
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("Email credentials are missing!");
}

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
    // Проверка обязательных полей
    const requiredFields = ["name", "email", "phone"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Сохранение в Supabase
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

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("Database error");
    }

    // Отправка email
    await transporter.sendMail({
      from: `"Ataul Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "Новая заявка на сайте",
      html: `
      <h1>Новая заявка</h1>
      <p><strong>Имя:</strong> ${req.body.name}</p>
      <p><strong>Email:</strong> ${req.body.email}</p>
      <p><strong>Телефон:</strong> ${req.body.phone}</p>
      ${
        req.body.company
          ? `<p><strong>Компания:</strong> ${req.body.company}</p>`
          : ""
      }
      <!-- остальные поля -->
    `, // ваш HTML шаблон
    });

    // Успешный ответ
    res.json({
      success: true,
      message: "Order submitted successfully",
      data,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
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

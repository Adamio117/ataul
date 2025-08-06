require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const path = require("path");

// 1. Создаем экземпляр приложения (это было пропущено!)
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
        "https://ataulll.onrender.com",
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

// 2. Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 3. Добавьте базовый роут для проверки работы
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 4. Эндпоинт для заказов (ваш код)
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

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

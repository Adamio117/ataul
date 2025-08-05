require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Инициализация Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

// Настройка почтового клиента
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Функция генерации HTML для письма
const generateEmailTemplate = (data) => {
  return `
    <h2>Новая заявка с сайта Ataul</h2>
    <p><strong>Имя:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Телефон:</strong> ${data.phone}</p>
    <p><strong>Тип сайта:</strong> ${data.site_type}</p>
    <p><strong>Комментарий:</strong> ${data.comments || "Не указано"}</p>
  `;
};

// Обработчик формы
app.post("/submit-order", async (req, res) => {
  try {
    console.log("Получены данные:", req.body);

    // Сохранение в Supabase
    const { data, error } = await supabase.from("orders").insert([req.body]);

    if (error) {
      console.error("Ошибка Supabase:", error);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("Данные сохранены в Supabase:", data);

    // Отправка email
    await transporter.sendMail({
      from: `"Ataul Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "Новая заявка",
      html: generateEmailTemplate(req.body),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка сервера:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Тестовые функции
const testServices = async () => {
  try {
    // Тест Supabase
    const testData = {
      name: "TEST",
      email: "test@test.com",
      phone: "+70000000000",
      site_type: "test",
      created_at: new Date(),
    };

    const { data: sbData, error: sbError } = await supabase
      .from("orders")
      .insert([testData]);

    console.log("Тест Supabase:", { sbData, sbError });

    // Тест почты
    await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "ТЕСТОВОЕ ПИСЬМО",
      text: "Это тест отправки почты",
    });
    console.log("Тестовое письмо отправлено");
  } catch (e) {
    console.error("Ошибка тестов:", e);
  }
};

// Запуск тестов при старте
testServices();

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Настройки CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // Используйте middleware CORS
// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "ataul-website/public")));
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API endpoint to handle form submission
app.post("/submit-order", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      site_type,
      pages,
      features,
      deadline,
      budget,
      comments,
    } = req.body;

    // Insert data into Supabase
    const { data, error } = await supabase.from("orders").insert([
      {
        name,
        email,
        phone,
        company,
        site_type,
        pages,
        features,
        deadline,
        budget,
        comments,
      },
    ]);

    if (error) throw error;

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "Новая заявка на сайте Ataul",
      html: `
                <h2>Новая заявка</h2>
                <p><strong>Имя:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Телефон:</strong> ${phone}</p>
                <p><strong>Компания:</strong> ${company || "Не указано"}</p>
                <p><strong>Тип сайта:</strong> ${site_type}</p>
                <p><strong>Количество страниц:</strong> ${
                  pages || "Не указано"
                }</p>
                <p><strong>Функции:</strong> ${features || "Не указано"}</p>
                <p><strong>Сроки:</strong> ${deadline || "Не указано"}</p>
                <p><strong>Бюджет:</strong> ${budget || "Не указано"}</p>
                <p><strong>Комментарии:</strong> ${
                  comments || "Нет комментариев"
                }</p>
            `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Заявка успешно отправлена" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Ошибка при обработке заявки" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

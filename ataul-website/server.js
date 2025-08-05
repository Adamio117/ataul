// Настройка Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Логирование всех переменных
console.log("Env variables:", {
  supabaseUrl: process.env.SUPABASE_URL?.slice(0, 10) + "...",
  supabaseKey: process.env.SUPABASE_KEY?.slice(0, 5) + "...",
  emailUser: process.env.EMAIL_USER,
  notifyEmail: process.env.NOTIFICATION_EMAIL,
});
// Обработчик формы
app.post("/submit-order", async (req, res) => {
  try {
    // 1. Логируем полученные данные
    console.log("Form data received:", req.body);

    // 2. Сохраняем в Supabase
    const { data, error } = await supabase.from("orders").insert([req.body]);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("Supabase saved:", data);

    // 3. Отправляем email
    await transporter.sendMail({
      from: `"Ataul Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "Новая заявка",
      html: generateEmailTemplate(req.body), // Ваша функция генерации HTML
    });

    // 4. Отправляем ответ
    res.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
  const testEmail = async () => {
    try {
      await transporter.sendMail({
        from: `"Test" <${process.env.EMAIL_USER}>`,
        to: process.env.NOTIFICATION_EMAIL,
        subject: "ТЕСТОВОЕ ПИСЬМО",
        text: "Это тест",
      });
      console.log("Email отправлен успешно");
    } catch (e) {
      console.error("Email ошибка:", e);
    }
  };

  testEmail();
  const testSupabase = async () => {
    const testData = {
      name: "TEST",
      email: "test@test.com",
      created_at: new Date(),
    };

    const { data, error } = await supabase.from("orders").insert([testData]);

    console.log("Supabase Test:", { data, error });
  };

  testSupabase(); // Вызовите при старте сервера
});

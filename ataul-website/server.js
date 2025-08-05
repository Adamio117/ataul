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
});

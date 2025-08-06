app.post("/submit-order", async (req, res) => {
  console.log("Received order data:", req.body);

  try {
    // 1. Проверка обязательных полей
    const requiredFields = ["name", "email", "phone"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // 2. Сохранение в Supabase
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

    // 3. Успешный ответ (без отправки email)
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

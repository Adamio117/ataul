document.getElementById("order-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    company: document.getElementById("company").value,
    site_type: document.getElementById("site-type-order").value,
    pages: document.getElementById("pages-order").value,
    features: document.getElementById("features-order").value,
    deadline: document.getElementById("deadline").value,
    budget: document.getElementById("budget").value,
    comments: document.getElementById("comments").value,
  };

  try {
    const response = await fetch(
      "https://ataul-4b4z.onrender.com/submit-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Ошибка сервера");
    }

    const data = await response.json();
    alert("Заявка отправлена! Мы свяжемся с вами в ближайшее время.");
    e.target.reset();
  } catch (error) {
    console.error("Ошибка:", error);
    alert(`Ошибка: ${error.message}`);
  }
});

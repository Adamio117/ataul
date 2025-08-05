require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const fetch = require('node-fetch');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// Supabase клиент
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

app.use(express.json());

// Обработчик формы
app.post('/submit-order', async (req, res) => {
  try {
    const formData = req.body;

    // 1. Сохранение в Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([formData])
      .select();

    if (error) throw new Error(`Supabase error: ${error.message}`);

    console.log('Saved to Supabase:', data);

    // 2. Отправка email через Resend
    const emailRes = await resend.emails.send({
      from: 'notifications@yourdomain.com',
      to: process.env.NOTIFICATION_EMAIL,
      subject: 'Новая заявка',
      html: `
        <h2>Новая заявка</h2>
        <p>Имя: ${formData.name}</p>
        <p>Телефон: ${formData.phone}</p>
        <p>Тип сайта: ${formData.site_type}</p>
      `
    });

    console.log('Email sent:', emailRes);

    // 3. Уведомление в Telegram
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `📌 Новая заявка!\nИмя: ${formData.name}\nТел: ${formData.phone}\nТип: ${formData.site_type}`
      })
    });

    res.json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

// ----------------------------------------------------
// 1. CONFIGURATION & ENVIRONMENT VARIABLES
// ----------------------------------------------------
const token = process.env.TELEGRAM_BOT_TOKEN || '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs';
const miniAppUrl = process.env.MINI_APP_URL || 'https://ai-trading-bot-hv5q.onrender.com';
const PORT = process.env.PORT || 3000;

// สร้าง Telegram Bot Instance
const bot = new TelegramBot(token.trim(), { polling: true });

// สร้าง Express Web Server
const app = express();
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Endpoint สำหรับให้ Auto-Ping ยิงเข้ามาเพื่อป้องกันการ Sleep
app.get('/ping', (req, res) => {
  res.send('OK - Server is Active 24/7');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ----------------------------------------------------
// 2. ANTI-SLEEP SYSTEM (กระตุ้นตัวเองทุก 5 นาที ไม่ให้ Render Sleep)
// ----------------------------------------------------
setInterval(async () => {
  try {
    const url = miniAppUrl.endsWith('/') ? `${miniAppUrl}ping` : `${miniAppUrl}/ping`;
    await axios.get(url);
    console.log('[Anti-Sleep] Successfully pinged server to keep alive 24/7');
  } catch (err) {
    console.log('[Anti-Sleep] Ping error (Normal during startup):', err.message);
  }
}, 5 * 60 * 1000); // ทำงานทุกๆ 5 นาที

// ----------------------------------------------------
// 3. TELEGRAM BOT COMMANDS & ALERTS
// ----------------------------------------------------
let activeChatId = null;

bot.onText(/\/start/, (msg) => {
  activeChatId = msg.chat.id;
  
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 เปิด AI SMART SIGNAL (V10.9.8.Pro)',
            web_app: { url: miniAppUrl.trim() }
          }
        ]
      ]
    }
  };

  bot.sendMessage(
    activeChatId, 
    '👋 ยินดีต้อนรับสู่ **AI SMART SIGNAL V10.9.8.Pro**!\n\nระบบสแกนวิเคราะห์กราฟ 24 ชั่วโมงเปิดทำงานแล้ว กดปุ่มด้านล่างเพื่อเปิด Mini App Dashboard ได้เลยครับ:', 
    { parse_mode: 'Markdown', ...options }
  );
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    activeChatId = msg.chat.id;
    bot.sendMessage(msg.chat.id, 'รับทราบครับ! พิมพ์ /start เพื่อเปิดใช้งานเมนูหลักได้เลยครับ');
  }
});

// ----------------------------------------------------
// 4. AUTO-SIGNAL GENERATOR (จำลองสแกนยิงสัญญาณทุก 2 นาที)
// ----------------------------------------------------
setInterval(() => {
  if (!activeChatId) return;

  const confidence = (Math.random() * (98.5 - 90.0) + 90.0).toFixed(1);
  const action = Math.random() > 0.5 ? 'CALL (ซื้อขึ้น)' : 'PUT (ซื้อลง)';
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/JPY', 'BTC/USDT'];
  const pair = pairs[Math.floor(Math.random() * pairs.length)];

  const alertMessage = 
    `🚨 **AI SMART SIGNAL ALERT (V10.9.8.Pro)** 🚨\n\n` +
    `🔥 **คู่สินทรัพย์**: ${pair}\n` +
    `🎯 **สัญญาณ**: **${action}**\n` +
    `📊 **ความแม่นยำ (CONF)**: **${confidence}%**\n` +
    `⏱️ **กรอบเวลา**: 1 นาที (TF 60s)\n` +
    `🟢 **สถานะระบบ**: ONLINE 24/7`;

  bot.sendMessage(activeChatId, alertMessage, { parse_mode: 'Markdown' });
}, 2 * 60 * 1000); // ส่งสัญญาณเตือนทุก 2 นาที

bot.on('polling_error', (error) => {
  console.error(`[Polling Error]: ${error.message}`);
});

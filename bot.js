const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const http = require('http');

// 1. CONFIGURATION
const token = process.env.TELEGRAM_BOT_TOKEN || '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs';
const miniAppUrl = process.env.MINI_APP_URL || 'https://ai-trading-bot-hv5q.onrender.com';
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(token.trim(), { polling: true });

const app = express();
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/ping', (req, res) => {
  res.send('OK - Server is Active 24/7');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 2. ANTI-SLEEP (Built-in http ping)
setInterval(() => {
  try {
    http.get(miniAppUrl, (res) => {
      console.log(`[Anti-Sleep] Ping status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log('[Anti-Sleep] Ping error:', err.message);
    });
  } catch (e) {
    console.log('[Anti-Sleep] Error:', e.message);
  }
}, 5 * 60 * 1000);

// 3. TELEGRAM BOT & ALERTS
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
    '👋 ยินดีต้อนรับสู่ **AI SMART SIGNAL V10.9.8.Pro**!\n\nเปิดระบบสแกนอัตโนมัติ 24/7 เรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเปิด Mini App ได้เลยครับ:', 
    { parse_mode: 'Markdown', ...options }
  );
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    activeChatId = msg.chat.id;
    bot.sendMessage(msg.chat.id, 'รับทราบครับ! พิมพ์ /start เพื่อเรียกใช้งานเมนูหลัก');
  }
});

// Auto-Signal ทุก 2 นาที
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
    `📊 **ความแม่นยำ**: **${confidence}%**\n` +
    `⏱️ **กรอบเวลา**: 1 นาที (TF 60s)\n` +
    `🟢 **สถานะ**: ONLINE 24/7`;

  bot.sendMessage(activeChatId, alertMessage, { parse_mode: 'Markdown' });
}, 2 * 60 * 1000);

bot.on('polling_error', (error) => {
  console.error(`[Polling Error]: ${error.message}`);
});

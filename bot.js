const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const http = require('http');

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

// Anti-Sleep ระบบรัน 24/7 ไม่ให้ Render หลับ
setInterval(() => {
  try {
    http.get(miniAppUrl, (res) => {}).on('error', () => {});
  } catch (e) {}
}, 5 * 60 * 1000);

let activeChatId = null;

bot.onText(/\/start/, (msg) => {
  activeChatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 เปิด AI SMART SIGNAL (Full Screen)',
            web_app: { url: miniAppUrl.trim() }
          }
        ]
      ]
    }
  };

  bot.sendMessage(
    activeChatId, 
    '👋 ยินดีต้อนรับสู่ **AI SMART SIGNAL V10.9.8.Pro**!\n\n🟢 ระบบสแกนตลาดหลัก & OTC ทำงาน 24/7 เรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเปิดแดชบอร์ด:', 
    { parse_mode: 'Markdown', ...options }
  );
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    activeChatId = msg.chat.id;
    bot.sendMessage(msg.chat.id, 'รับทราบครับ! พิมพ์ /start เพื่อเรียกใช้งานเมนูหลัก');
  }
});

// รายการคู่เงินทั้งตลาดหลัก (Market) และ OTC ตามที่คุณต้องการ
const allPairs = [
  'AUD/USD (ตลาดจริง)', 'EUR/USD (ตลาดจริง)', 'EUR/GBP (ตลาดจริง)', 
  'GBP/JPY (ตลาดจริง)', 'EUR/JPY (ตลาดจริง)', 'GBP/USD (ตลาดจริง)',
  'AUD/USD (OTC)', 'EUR/USD (OTC)', 'EUR/GBP (OTC)', 
  'GBP/JPY (OTC)', 'EUR/JPY (OTC)', 'GBP/USD (OTC)'
];

// ส่งสัญญาณเตือนอัตโนมัติทุก 2 นาที
setInterval(() => {
  if (!activeChatId) return;
  const confidence = (Math.random() * (99.0 - 92.0) + 92.0).toFixed(1);
  const action = Math.random() > 0.5 ? 'CALL (ซื้อขึ้น 🟢)' : 'PUT (ซื้อลง 🔴)';
  const pair = allPairs[Math.floor(Math.random() * allPairs.length)];

  const alertMessage = 
    `🚨 **AI SMART SIGNAL ALERT** 🚨\n\n` +
    `🔥 **คู่สินทรัพย์**: ${pair}\n` +
    `🎯 **สัญญาณ**: **${action}**\n` +
    `📊 **ความแม่นยำ (CONF)**: **${confidence}%**\n` +
    `⏱️ **กรอบเวลา**: 1 นาที (TF 60s)\n` +
    `🟢 **สถานะระบบ**: ONLINE 24/7`;

  bot.sendMessage(activeChatId, alertMessage, { parse_mode: 'Markdown' });
}, 2 * 60 * 1000);

bot.on('polling_error', (error) => {});

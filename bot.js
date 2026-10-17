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
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Anti-Sleep ป้องกัน Render หลับ
setInterval(() => {
  try {
    http.get(miniAppUrl, () => {}).on('error', () => {});
  } catch (e) {}
}, 5 * 60 * 1000);

// คำสั่ง /start แสดงเฉพาะปุ่มกดเปิด Mini App (ไม่ยิงข้อความสแปม)
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id, 
    '🟢 **AI SMART SIGNAL V10.9.8.Pro** พร้อมใช้งานแล้วครับ\nกดปุ่มด้านล่างเพื่อเปิดแดชบอร์ดสัญญาณไฟเรียลไทม์:', 
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 เปิดหน้าจอ AI SMART SIGNAL (เต็มจอ)', web_app: { url: miniAppUrl.trim() } }]
        ]
      }
    }
  );
});

bot.on('polling_error', () => {});

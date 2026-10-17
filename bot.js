const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// API Token จาก BotFather
const token = process.env.TELEGRAM_BOT_TOKEN || '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs';
const miniAppUrl = process.env.MINI_APP_URL || 'https://ai-trading-bot-hv5q.onrender.com';

// สร้าง Telegram Bot instance
const bot = new TelegramBot(token.trim(), { polling: true });

// ตั้งค่า Express Web Server สำหรับ Render
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ตรวจจับคำสั่ง /start จากผู้ใช้
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 เปิด AI Trading Mini App',
            web_app: { url: miniAppUrl.trim() }
          }
        ]
      ]
    }
  };

  bot.sendMessage(
    chatId, 
    '👋 ยินดีต้อนรับสู่ **AI Trading Bot**!\n\nระบบสแกนสัญญาณเทรดอัตโนมัติทำงาน 24/7 เรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อเปิด Mini App ได้เลยครับ:', 
    { parse_mode: 'Markdown', ...options }
  );
});

// ตอบกลับข้อความทั่วไป
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, 'รับทราบครับ! พิมพ์ /start เพื่อเรียกใช้งานเมนูหลักได้เลยครับ');
  }
});

// จัดการข้อผิดพลาด polling
bot.on('polling_error', (error) => {
  console.error(`[Polling Error]: ${error.message}`);
});

const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8973009138:AAHvNh19v4CPYmAyDudLvPSyw3lUH73h56I';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on('polling_error', (error) => {
  console.log('Polling notice:', error.message);
});

app.use(express.json());

// 📂 กำหนดให้โฟลเดอร์ public เป็นหน้าเว็บหลัก
app.use(express.static(path.join(__dirname, 'public')));

// เพิ่มเส้นทางนี้เพื่อให้เปิดหน้าเว็บได้ถูกต้อง
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const MINI_APP_URL = 'https://ai-trading-bot-hv5q.onrender.com';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, 
    `🤖 *AI SMART SIGNAL DASHBOARD*\n\n` +
    `กดปุ่มด้านล่างเพื่อเปิดหน้าจอ Mini App ดูสถิติและผลการทำงานแบบเรียลไทม์ครับ`,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 เปิดหน้าจอ AI Mini App", web_app: { url: MINI_APP_URL } }]
        ]
      }
    }
  ).catch((err) => console.error('Send error:', err.message));
});

let db = null;
try {
  if (process.env.FIREBASE_CONFIG) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
      databaseURL: process.env.FIREBASE_DB_URL
    });
    db = admin.database();
  }
} catch (e) {}

let memoryStats = {
  EURUSD: { wins: 0, losses: 0, bias: 0.00012, totalTrades: 0, lastSignal: null }
};

async function getRealPrice(symbol = 'BTCUSDT') {
  try {
    const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    return parseFloat(res.data.price);
  } catch (e) {
    return 1.08500;
  }
}

let activeTrades = [];

setInterval(async () => {
  const now = new Date();
  const seconds = now.getSeconds();

  if (seconds === 58) {
    const price = await getRealPrice('BTCUSDT');
    const signalType = Math.random() > 0.48 ? 'CALL' : 'PUT';
    
    activeTrades.push({
      id: Date.now(),
      symbol: 'EUR/USD (OTC)',
      entryPrice: price,
      signal: signalType,
      timestamp: now.toISOString(),
      status: 'PENDING'
    });
  }

  if (seconds === 0 && activeTrades.length > 0) {
    const currentPrice = await getRealPrice('BTCUSDT');
    
    for (let trade of activeTrades) {
      if (trade.status === 'PENDING') {
        let isWin = (trade.signal === 'CALL' && currentPrice > trade.entryPrice) ||
                    (trade.signal === 'PUT' && currentPrice < trade.entryPrice);
        trade.status = isWin ? 'WIN' : 'LOSS';

        const stat = memoryStats.EURUSD;
        stat.totalTrades++;
        if (isWin) { stat.wins++; stat.bias += 0.00005; }
        else { stat.losses++; stat.bias -= 0.00008; }

        if (db) { db.ref('ai_stats/EURUSD').set(stat); }
      }
    }
    activeTrades = [];
  }
}, 1000);

app.get('/ping', (req, res) => res.send({ status: 'ALIVE' }));
app.get('/api/stats', (req, res) => res.json({ success: true, stats: memoryStats }));

app.listen(PORT, () => {
  console.log(`🚀 AI Signal Engine Running on port ${PORT}`);
});

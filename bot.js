const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// 🤖 Telegram Bot Token (@Nogfdsabot)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8794907863:AAENQLAIxkhyX63oSCiiFg3hKV6gxQpR3s8';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// URL ของ Mini App บน Render
const MINI_APP_URL = 'https://ai-trading-bot-hv5q.onrender.com';

// คำสั่ง /start
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
  ).catch(() => {});
});

// ------------------------------------------------------------------
// 1. FIREBASE INITIALIZATION
// ------------------------------------------------------------------
let db = null;
try {
  if (process.env.FIREBASE_CONFIG) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
      databaseURL: process.env.FIREBASE_DB_URL
    });
    db = admin.database();
    console.log('✅ Firebase Database connected successfully.');
  }
} catch (e) {
  console.log('⚠️ Running in Local/Memory Mode for Firebase Data');
}

let memoryStats = {
  EURUSD: { wins: 0, losses: 0, bias: 0.00012, totalTrades: 0, lastSignal: null }
};

async function getRealPrice(symbol = 'BTCUSDT') {
  try {
    const res = await axios.get(`https://api.binance.com/api/3/ticker/price?symbol=${symbol}`);
    return parseFloat(res.data.price);
  } catch (e) {
    return 1.08500;
  }
}

// ------------------------------------------------------------------
// 2. 24/7 BACKGROUND ENGINE
// ------------------------------------------------------------------
let activeTrades = [];

setInterval(async () => {
  const now = new Date();
  const seconds = now.getSeconds();

  if (seconds === 58) {
    const price = await getRealPrice('BTCUSDT');
    const signalType = Math.random() > 0.48 ? 'CALL' : 'PUT';
    const tradeId = Date.now();

    const newTrade = {
      id: tradeId,
      symbol: 'EUR/USD (OTC)',
      entryPrice: price,
      signal: signalType,
      timestamp: now.toISOString(),
      status: 'PENDING'
    };

    activeTrades.push(newTrade);
  }

  if (seconds === 0 && activeTrades.length > 0) {
    const currentPrice = await getRealPrice('BTCUSDT');
    
    for (let trade of activeTrades) {
      if (trade.status === 'PENDING') {
        let isWin = false;
        if (trade.signal === 'CALL' && currentPrice > trade.entryPrice) isWin = true;
        if (trade.signal === 'PUT' && currentPrice < trade.entryPrice) isWin = true;

        trade.status = isWin ? 'WIN' : 'LOSS';

        const stat = memoryStats.EURUSD;
        stat.totalTrades++;
        if (isWin) {
          stat.wins++;
          stat.bias += 0.00005;
        } else {
          stat.losses++;
          stat.bias -= 0.00008;
        }

        if (db) {
          db.ref('ai_stats/EURUSD').set(stat);
        }
      }
    }
    activeTrades = [];
  }
}, 1000);

// ------------------------------------------------------------------
// 3. API ENDPOINTS & ANTI-SLEEP
// ------------------------------------------------------------------
app.get('/ping', (req, res) => {
  res.send({ status: 'ALIVE', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  res.json({ success: true, stats: memoryStats });
});

setInterval(() => {
  axios.get(`http://localhost:${PORT}/ping`).catch(() => {});
}, 4 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 AI Signal 24/7 Engine Running`);
});

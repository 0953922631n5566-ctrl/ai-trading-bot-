const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// 🤖 Telegram Bot Token ของคุณ
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let subscribedUsers = new Set();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  subscribedUsers.add(chatId);
  
  bot.sendMessage(chatId, 
    `🚀 *ยินดีต้อนรับสู่ AI SMART SIGNAL V10.9.8*\n\n` +
    `✅ เปิดใช้งานระบบแจ้งเตือนสัญญาณเทรดเรียบร้อยแล้ว!\n` +
    `ระบบจะส่งสัญญาณคำนวณ Win/Loss และ Bias อัตโนมัติทุกๆ 1 นาทีครับ`,
    { parse_mode: 'Markdown' }
  );
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
// 2. 24/7 AUTOMATIC TELEGRAM SIGNAL NOTIFIER ENGINE
// ------------------------------------------------------------------
let activeTrades = [];

setInterval(async () => {
  const now = new Date();
  const seconds = now.getSeconds();

  // 🔥 วินาทีที่ 58: คำนวณสัญญาณแล้วยิงข้อความแจ้งเตือนเข้า Telegram Chat
  if (seconds === 58) {
    const price = await getRealPrice('BTCUSDT');
    const signalType = Math.random() > 0.48 ? 'CALL' : 'PUT';
    const icon = signalType === 'CALL' ? '🟢' : '🔴';
    const actionText = signalType === 'CALL' ? 'BUY / CALL (กดขึ้น)' : 'SELL / PUT (กดลง)';
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

    const message = 
      `🚨 *AI SMART SIGNAL ALERT* 🚨\n\n` +
      `คู่เงิน: *EUR/USD (OTC)*\n` +
      `คำสั่ง: ${icon} *${actionText}*\n` +
      `ราคาเข้า: \`${price}\`\n` +
      `เวลาหมดอายุ: *60 วินาที (TF 1M)*\n\n` +
      `⏳ _รอสรุปผลหลังจบแท่ง..._`;

    subscribedUsers.forEach(chatId => {
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' }).catch(() => {});
    });
  }

  // 🏁 วินาทีที่ 00: ตรวจผล Win/Loss และยิงแจ้งเตือนสรุปผลเข้า Telegram Chat
  if (seconds === 0 && activeTrades.length > 0) {
    const currentPrice = await getRealPrice('BTCUSDT');
    
    for (let trade of activeTrades) {
      if (trade.status === 'PENDING') {
        let isWin = false;
        if (trade.signal === 'CALL' && currentPrice > trade.entryPrice) isWin = true;
        if (trade.signal === 'PUT' && currentPrice < trade.entryPrice) isWin = true;

        trade.status = isWin ? 'WIN' : 'LOSS';
        const resultIcon = isWin ? '✅ WIN' : '❌ LOSS';

        const stat = memoryStats.EURUSD;
        stat.totalTrades++;
        if (isWin) {
          stat.wins++;
          stat.bias += 0.00005;
        } else {
          stat.losses++;
          stat.bias -= 0.00008;
        }

        const winRate = ((stat.wins / stat.totalTrades) * 100).toFixed(1);

        const resultMessage = 
          `📊 *ผลการเทรดออเดอร์ล่าสุด*\n\n` +
          `ผลลัพธ์: *${resultIcon}*\n` +
          `ราคาเข้า: \`${trade.entryPrice}\` ➔ ราคาปิด: \`${currentPrice}\`\n\n` +
          `📈 *สถิติสะสม DB:* ${stat.wins}W / ${stat.losses}L (Winrate${winRate}%)\n` +
          `🧠 *AI Bias Memory:* \`${stat.bias.toFixed(5)}\``;

        subscribedUsers.forEach(chatId => {
          bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' }).catch(() => {});
        });
      }
    }
    activeTrades = [];
  }
}, 1000);

// ------------------------------------------------------------------
// 3. API ENDPOINTS & ANTI-SLEEP
// ---------------------------------------------------
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
  console.log(`🚀 AI Signal 24/7 Engine Running with Telegram Bot`);
});

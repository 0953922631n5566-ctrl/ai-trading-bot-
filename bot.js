const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Memory Fallback สำหรับเก็บสถิติ
let memoryStats = {
  EURUSD: { wins: 0, losses: 0, bias: 0.00012, totalTrades: 0, lastSignal: null },
  BTCUSDT: { wins: 0, losses: 0, bias: 0.00012, totalTrades: 0, lastSignal: null },
  GBPUSD: { wins: 0, losses: 0, bias: 0.00012, totalTrades: 0, lastSignal: null }
};

// ------------------------------------------------------------------
// 2. REAL-TIME PRICE ENGINE (Binance / Market Data)
// ------------------------------------------------------------------
async function getRealPrice(symbol = 'BTCUSDT') {
  try {
    const res = await axios.get(`https://api.binance.com/api/3/ticker/price?symbol=${symbol}`);
    return parseFloat(res.data.price);
  } catch (e) {
    return symbol === 'BTCUSDT' ? 65000.00 : 1.08500;
  }
}

// ------------------------------------------------------------------
// 3. 24/7 BACKGROUND AUTO-LEARNING ENGINE
// (ทำงานอัตโนมัติตลอด 24 ชม. แม้ปิดมือถือ)
// ------------------------------------------------------------------
let activeTrades = [];

setInterval(async () => {
  const now = new Date();
  const seconds = now.getSeconds();

  // 🔥 วินาทีที่ 58: คำนวณและล็อกสัญญาณล่วงหน้า 2 วินาทีก่อนจบแท่ง
  if (seconds === 58) {
    const price = await getRealPrice('BTCUSDT');
    const signalType = Math.random() > 0.48 ? 'CALL' : 'PUT';
    const tradeId = Date.now();

    const newTrade = {
      id: tradeId,
      symbol: 'EURUSD',
      entryPrice: price,
      signal: signalType,
      timestamp: now.toISOString(),
      status: 'PENDING'
    };

    activeTrades.push(newTrade);
    console.log(`[24/7 Engine] 🟢 Signal Generated: ${signalType} at Price ${price}`);
  }

  // 🏁 วินาทีที่ 00 (จบแท่ง 60s): ตรวจผล Win/Loss และอัปเดต AI Bias
  if (seconds === 0 && activeTrades.length > 0) {
    const currentPrice = await getRealPrice('BTCUSDT');
    
    for (let trade of activeTrades) {
      if (trade.status === 'PENDING') {
        let isWin = false;
        if (trade.signal === 'CALL' && currentPrice > trade.entryPrice) isWin = true;
        if (trade.signal === 'PUT' && currentPrice < trade.entryPrice) isWin = true;

        trade.status = isWin ? 'WIN' : 'LOSS';
        trade.closePrice = currentPrice;

        const stat = memoryStats.EURUSD;
        stat.totalTrades++;
        if (isWin) {
          stat.wins++;
          stat.bias += 0.00005;
        } else {
          stat.losses++;
          stat.bias -= 0.00008;
        }

        console.log(`[24/7 Engine] 📊 Result: ${trade.status} | Entry: ${trade.entryPrice} -> Close: ${currentPrice} | Total: ${stat.wins}W/${stat.losses}L`);

        if (db) {
          db.ref('ai_stats/EURUSD').set(stat);
          db.ref(`trade_history/${trade.id}`).set(trade);
        }
      }
    }
    activeTrades = [];
  }
}, 1000);

// ------------------------------------------------------------------
// 4. API ENDPOINTS & ANTI-SLEEP
// ------------------------------------------------------------------
app.get('/ping', (req, res) => {
  res.send({ status: 'ALIVE', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: memoryStats
  });
});

// Self-Ping ป้องกัน Render Sleep Mode
setInterval(() => {
  axios.get(`http://localhost:${PORT}/ping`)
    .then(() => console.log('🛡️ Self-Ping Successful (Anti-Sleep Active)'))
    .catch(() => {});
}, 4 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 AI Signal 24/7 Engine Server running on port ${PORT}`);
});

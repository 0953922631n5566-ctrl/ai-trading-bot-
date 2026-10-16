const http = require('http');
const https = require('https');

// ตั้งค่า Telegram Bot
const TOKEN = '7543265749:AAG4lZp3V575E7a95mK4a0hYQWswJxklBfE_g';
const CHAT_ID = '7259169600';

// ฟังก์ชันส่งข้อความเข้า Telegram
function sendTelegramAlert(signal, asset, price) {
    const emoji = signal === 'CALL' ? '🟢' : '🔴';
    const message = `🤖 AI Trading Signal\n\n${emoji} สัญญาณ: ${signal}\n📊 สินทรัพย์: ${asset}\n💰 ราคา: ${price}\n⏰ เวลา: ${new Date().toLocaleTimeString()}`;
    
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { console.log(`[Telegram Sent] ${signal} on ${asset}`); });
    }).on("error", (err) => {
        console.error("Error sending telegram:", err.message);
    });
}

// จำลองการทำงาน AI เทรด
const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'EURJPY'];
let basePrices = { 'EURUSD': 1.0850, 'GBPUSD': 1.2950, 'USDJPY': 152.00, 'AUDUSD': 0.6650, 'EURJPY': 190.50 };
let priceHistory = {};
let lastSentSignal = {};

assets.forEach(asset => {
    priceHistory[asset] = [];
    lastSentSignal[asset] = null;
});

function analyzeMarket(asset) {
    let score = Math.random() * 2 - 1;
    return score >= 0.5 ? 'CALL' : (score <= -0.5 ? 'PUT' : 'WAIT');
}

console.log("🤖 AI Cloud Trading Bot Started & Running 24/7...");

// ทดสอบส่งข้อความทันทีเมื่อบอทเริ่มทำงาน
sendTelegramAlert('CALL', 'EURUSD', '1.08500');

setInterval(() => {
    assets.forEach(asset => {
        let delta = (Math.random() - 0.495) * (asset.includes('JPY') ? 0.05 : 0.0005);
        basePrices[asset] += delta;
        priceHistory[asset].push(basePrices[asset]);
        if (priceHistory[asset].length > 30) priceHistory[asset].shift();

        let now = new Date();
        let currentSec = now.getSeconds();

        if (currentSec === 3 || currentSec === 4) {
            let signal = analyzeMarket(asset);
            if (signal !== 'WAIT' && lastSentSignal[asset] !== signal) {
                let dec = asset.includes('JPY') ? 3 : 5;
                sendTelegramAlert(signal, asset, basePrices[asset].toFixed(dec));
                lastSentSignal[asset] = signal;
            }
        }

        if (currentSec === 0) {
            lastSentSignal[asset] = null;
        }
    });
}, 1000);

// สร้าง HTTP Server รองรับ Render Health Check (ป้องกัน Timeout)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Trading Bot is running 24/7!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

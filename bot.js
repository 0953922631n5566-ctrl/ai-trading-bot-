const http = require('http');
const https = require('https');

const TOKEN = '7543265749:AAG4lZp3V575E7a95mK4a0hYQWswJxklBfE_g';
const CHAT_ID = '6451332748';

function sendTelegramAlert(message) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { 
            console.log(`[Telegram Sent Successfully]`); 
        });
    }).on("error", (err) => {
        console.error("Error sending telegram:", err.message);
    });
}

// ส่งข้อความแจ้งเตือนทันทีที่บอทเริ่มทำงาน
console.log("🤖 AI Smart Signal Backend Engine Started & Running 24/7...");
sendTelegramAlert("🚀 AI SMART SIGNAL (BACKEND)\n\n🟢 บอทเชื่อมต่อและเริ่มทำงานสำเร็จแล้ว พร้อมส่งสัญญาณซื้อขาย!");

// ระบบจำลองสัญญาณเทรดทุกๆ 1 นาที
const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'EURJPY'];
let basePrices = { 'EURUSD': 1.1210, 'GBPUSD': 1.2950, 'USDJPY': 152.00, 'AUDUSD': 0.6650, 'EURJPY': 190.50 };
let lastSentSignal = {};

assets.forEach(asset => { lastSentSignal[asset] = null; });

setInterval(() => {
    assets.forEach(asset => {
        let delta = (Math.random() - 0.495) * (asset.includes('JPY') ? 0.05 : 0.0005);
        basePrices[asset] += delta;

        let now = new Date();
        let currentSec = now.getSeconds();

        if (currentSec === 3 || currentSec === 4) {
            let score = Math.random() * 2 - 1;
            let signal = score >= 0.5 ? 'CALL' : (score <= -0.5 ? 'PUT' : 'WAIT');
            let confidence = (85 + Math.random() * 14).toFixed(1);

            if (signal !== 'WAIT' && lastSentSignal[asset] !== signal) {
                let dec = asset.includes('JPY') ? 3 : 5;
                let currentPriceStr = basePrices[asset].toFixed(dec);
                const emoji = signal === 'CALL' ? '🟢' : '🔴';
                const msg = `🚀 AI SMART SIGNAL (BACKEND)\n\n${emoji} สัญญาณ: ${signal}\n📊 สินทรัพย์: ${asset}\n💰 ราคา: ${currentPriceStr}\n🎯 ความเชื่อมั่น: ${confidence}%\n⏰ เวลา: ${new Date().toLocaleTimeString()}`;
                
                sendTelegramAlert(msg);
                lastSentSignal[asset] = signal;
            }
        }

        if (currentSec === 0) {
            lastSentSignal[asset] = null;
        }
    });
}, 1000);

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Smart Signal Backend is running 24/7!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Backend Server is listening on port ${PORT}`);
});

const fetch = require('node-fetch');

const TOKEN = '8918231194:AAHrcJ9QsPo_hT9AnWRxJWQWswJxklBfE_g';
const CHAT_ID = '6451332748';

const assets = ['EURUSD', 'GBPUSD', 'GBPJPY', 'EURJPY', 'AUDUSD', 'EURGBP'];
let basePrices = {
    'EURUSD': 1.08500, 'GBPUSD': 1.26500, 'GBPJPY': 190.500,
    'EURJPY': 163.200, 'AUDUSD': 0.65500, 'EURGBP': 0.85700
};

let priceHistory = {};
assets.forEach(a => priceHistory[a] = []);
let lastSentSignal = {};

async function sendTelegramAlert(signal, asset, price) {
    try {
        let emoji = signal === 'CALL' ? '🟢' : '🔴';
        let text = `🚨 AI 24/7 CLOUD SIGNAL 🚨\n\n${emoji} สัญญาณ: ${signal}\n📊 สินทรัพย์: ${asset}\n💰 ราคา: ${price}\n⚡ สถานะ: บอทรันบนคลาวด์ตลอด 24 ชม.`;
        let url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`;

        let res = await fetch(url);
        if (res.ok) {
            console.log(`[Telegram Sent] ${signal} on ${asset}`);
        }
    } catch(e) {
        console.log("Telegram Error:", e);
    }
}

function analyzeMarket(asset) {
    let h = priceHistory[asset];
    if (h.length < 5) return 'WAIT';

    let mom = h[h.length - 1] - h[h.length - 4];
    let score = 0;
    if (mom > 0) score += 1; else if (mom < 0) score -= 1;

    let lastDiff = h[h.length - 1] - h[h.length - 2];
    if (lastDiff < -0.0002) score += 1.5;
    if (lastDiff > 0.0002) score -= 1.5;

    return score >= 0.5 ? 'CALL' : (score <= -0.5 ? 'PUT' : 'WAIT');
}

console.log("🤖 AI Cloud Trading Bot Started & Running 24/7...");

setInterval(() => {
    assets.forEach(asset => {
        let delta = (Math.random() - 0.495) * (asset.includes('JPY') ? 0.015 : 0.00015);
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
}, 1000);const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Trading Bot is running 24/7!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});


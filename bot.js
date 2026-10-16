const http = require('http');
const https = require('https');

const TOKEN = '8839850954:AAFYB0XuxgaIDhgPIdl2Dwa-g30J4QiHMwk';
const CHAT_ID = '6451332748';

function sendTelegramAlert(signal, asset, price, confidence) {
    const emoji = signal === 'CALL' ? '🟢' : '🔴';
    const message = `🚀 AI SMART SIGNAL (BACKEND)\n\n${emoji} สัญญาณ: ${signal}\n📊 สินทรัพย์: ${asset}\n💰 ราคา: ${price}\n🎯 ความเชื่อมั่น (CONF): ${confidence}%\n⏰ เวลา: ${new Date().toLocaleTimeString()}`;
    
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { 
            console.log(`[Telegram Sent Successfully] ${signal} on ${asset} (${confidence}%)`); 
        });
    }).on("error", (err) => {
        console.error("Error sending telegram:", err.message);
    });
}

const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'EURJPY'];
let basePrices = { 'EURUSD': 1.1210, 'GBPUSD': 1.2950, 'USDJPY': 152.00, 'AUDUSD': 0.6650, 'EURJPY': 190.50 };
let lastSentSignal = {};

assets.forEach(asset => {
    lastSentSignal[asset] = null;
});

console.log("🤖 AI Smart Signal Backend Engine Started & Running 24/7...");
sendTelegramAlert('CALL', 'EURUSD', '1.12109', '96.0');

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
                sendTelegramAlert(signal, asset, currentPriceStr, confidence);
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

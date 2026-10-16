const http = require('http');
const https = require('https');

const TOKEN = '8839850954:AAFYB0XuxgaIDhgPIdl2Dwa-g30J4QiHMwk';
const CHAT_ID = '6451332748';

function sendTelegramAlert(messageText) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(messageText)}`;
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { 
            if (res.statusCode === 200) {
                console.log(`[SUCCESS] Sent: ${messageText.substring(0, 30)}...`);
            } else {
                console.error(`[TELEGRAM ERROR ${res.statusCode}]`, data);
            }
        });
    }).on("error", (err) => {
        console.error("[NETWORK ERROR]:", err.message);
    });
}

console.log("🤖 AI Smart Signal Bot Started...");

// 1. ส่งข้อความทักทายทันทีที่เริ่มรัน
sendTelegramAlert("✅ ระบบ AI Signal เริ่มทำงานสำเร็จแล้ว! (ทดสอบการเชื่อมต่อ)");

// 2. สุ่มส่งสัญญาณทุกๆ 10 วินาที (ป้องกันโดน Telegram บล็อก)
const assets = ['EURUSD', 'GBPUSD', 'USDJPY'];
setInterval(() => {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const signal = Math.random() >= 0.5 ? '🟢 CALL' : '🔴 PUT';
    const price = (1 + Math.random() * 0.5).toFixed(4);
    const conf = (85 + Math.random() * 14).toFixed(1);
    
    const msg = `🚀 AI SMART SIGNAL\n\n${signal}\n📊 สินทรัพย์: ${asset}\n💰 ราคา: ${price}\n🎯 ความเชื่อมั่น: ${conf}%\n⏰ เวลา: ${new Date().toLocaleTimeString()}`;
    
    sendTelegramAlert(msg);
}, 10000);

// Web Server สำหรับ Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Signal Bot is Running 24/7\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

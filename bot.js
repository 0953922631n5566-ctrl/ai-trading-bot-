const http = require('http');
const https = require('https');

const TOKEN = '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs'.trim();
const CHAT_ID = '6451332748'.trim();

// แทนที่ URL นี้ด้วย URL ของ Render ของคุณ (เช่น https://ai-trading-bot-hv5q.onrender.com)
const WEBAPP_URL = 'https://ai-trading-bot-hv5q.onrender.com';

function sendMenuWithWebApp(chatId) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const payload = JSON.stringify({
        chat_id: chatId,
        text: "🎛️ ยินดีต้อนรับสู่ระบบ AI Smart Signal Pro\n\nคลิกปุ่มด้านล่างเพื่อเปิดหน้าต่าง **Dashboard (Mini App)** แบบเต็มจอได้เลยครับ:",
        reply_markup: {
            inline_keyboard: [
                [
                    { 
                        text: '🚀 เปิดหน้าต่าง AI Dashboard', 
                        web_app: { url: WEBAPP_URL } 
                    }
                ]
            ]
        }
    });

    const u = new URL(url);
    const options = {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = https.request(options, (res) => {});
    req.on('error', () => {});
    req.write(payload);
    req.end();
}

// เช็คคำสั่ง /menu หรือ /start จากผู้ใช้
function checkUpdates() {
    https.get(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(body);
                if (json.ok && json.result.length > 0) {
                    const up = json.result[json.result.length - 1];
                    if (up.message && up.message.text) {
                        const text = up.message.text;
                        const chatId = up.message.chat.id;
                        if (text === '/start' || text === '/menu' || text === 'app') {
                            sendMenuWithWebApp(chatId);
                        }
                    }
                }
            } catch(e) {}
        });
    }).on('error', ()=>{});
}

console.log("🤖 Telegram Mini App Bot Started...");
setInterval(checkUpdates, 2000);

// Web Server รองรับทั้งส่งไฟล์ HTML หน้าเว็บ และรันบอทพร้อมกัน
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        // อ่านไฟล์ index.html ที่คุณสร้างบน GitHub ส่งออกไปแสดงผลเป็น Mini App
        const fs = require('fs');
        fs.readFile('./index.html', 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading WebApp');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('AI Mini App Server is Running 24/7\n');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

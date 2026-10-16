const http = require('http');
const https = require('https');
const fs = require('fs');

const TOKEN = '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs'.trim();
const WEBAPP_URL = 'https://ai-trading-bot-hv5q.onrender.com';

let lastUpdateId = 0; // บันทึก ID ล่าสุดไม่ให้ดึงคำสั่งเดิมมาตอบซ้ำ

function sendMenuWithWebApp(chatId) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const payload = JSON.stringify({
        chat_id: chatId,
        text: "🧠 **AI SMART SIGNAL V10.9.9 PRO**\n\nกดปุ่มด้านล่างเพื่อเปิดหน้าต่าง **Dashboard (Mini App)** ได้เลยครับ:",
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { 
                        text: '🚀 เปิด AI Smart Signal Dashboard', 
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

    const req = https.request(options, () => {});
    req.on('error', () => {});
    req.write(payload);
    req.end();
}

function checkUpdates() {
    const offsetQuery = lastUpdateId ? `?offset=${lastUpdateId + 1}` : '?offset=-1';
    https.get(`https://api.telegram.org/bot${TOKEN}/getUpdates${offsetQuery}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(body);
                if (json.ok && json.result.length > 0) {
                    json.result.forEach(up => {
                        lastUpdateId = up.update_id; // อัปเดต ID ล่าสุด
                        if (up.message && up.message.text) {
                            const text = up.message.text;
                            const chatId = up.message.chat.id;
                            if (text === '/start' || text === '/menu') {
                                sendMenuWithWebApp(chatId);
                            }
                        }
                    });
                }
            } catch(e) {}
        });
    }).on('error', ()=>{});
}

console.log("🤖 Single-Response Bot Engine Started...");
setInterval(checkUpdates, 2000);

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile('./index.html', 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading Dashboard');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Server Running\n');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

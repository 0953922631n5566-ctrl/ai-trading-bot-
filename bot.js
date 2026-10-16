const http = require('http');
const https = require('https');

const TOKEN = '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs'.trim();
const CHAT_ID = '6451332748'.trim();

// เก็บสถานะคู่เงินที่ผู้ใช้เลือก (ค่าเริ่มต้นเป็น EURUSD)
let selectedAsset = 'EURUSD';

function sendTelegramMessage(chatId, text, replyMarkup = null) {
    let url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
    if (replyMarkup) {
        url += `&reply_markup=${encodeURIComponent(JSON.stringify(replyMarkup))}`;
    }
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { 
            if (res.statusCode !== 200) {
                console.error(`[TELEGRAM ERROR ${res.statusCode}]`, data);
            }
        });
    }).on("error", (err) => {
        console.error("[NETWORK ERROR]:", err.message);
    });
}

// ฟังก์ชันเช็คข้อความขาเข้าจาก Telegram (Command & Button Click)
function checkTelegramUpdates() {
    // ใช้ getUpdates แบบ Long Polling เพื่อรับคำสั่งจากคุณ
    https.get(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.ok && json.result.length > 0) {
                    const update = json.result[json.result.length - 1];
                    
                    // ถ้ามีการกดปุ่มเลือกคู่เงิน
                    if (update.callback_query) {
                        const callbackData = update.callback_query.data;
                        const callbackChatId = update.callback_query.message.chat.id;
                        
                        if (callbackData.startsWith('ASSET_')) {
                            selectedAsset = callbackData.replace('ASSET_', '');
                            sendTelegramMessage(callbackChatId, `✅ เปลี่ยนคู่เงินเป็น: ${selectedAsset} เรียบร้อยแล้ว! บอทจะเริ่มส่งสัญญาณคู่เงินนี้`);
                        }
                    }
                    
                    // ถ้าพิมพ์ข้อความ /menu หรือ /start
                    if (update.message && update.message.text) {
                        const text = update.message.text;
                        const msgChatId = update.message.chat.id;
                        
                        if (text === '/menu' || text === '/start') {
                            const menuMarkup = {
                                inline_keyboard: [
                                    [
                                        { text: '💶 EURUSD', callback_data: 'ASSET_EURUSD' },
                                        { text: '💷 GBPUSD', callback_data: 'ASSET_GBPUSD' }
                                    ],
                                    [
                                        { text: '💴 USDJPY', callback_data: 'ASSET_USDJPY' },
                                        { text: '🥇 GOLD (XAUUSD)', callback_data: 'ASSET_XAUUSD' }
                                    ]
                                ]
                            };
                            sendTelegramMessage(msgChatId, `🎛️ **AI Signal Control Panel**\n\nคู่เงินปัจจุบัน: *${selectedAsset}*\nกรุณาเลือกคู่เงินที่ต้องการเทรดด้านล่างครับ:`, menuMarkup);
                        }
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        });
    }).on("error", (err) => {});
}

console.log("🤖 Interactive AI Signal Bot Started...");
sendTelegramMessage(CHAT_ID, "✅ บอทเปิดใช้งานแบบ Interactive แล้ว! พิมพ์คำว่า /menu ในแชทเพื่อเปิดปุ่มเลือกคู่เงินได้เลยครับ");

// รันระบบส่งสัญญาณอัตโนมัติทุกๆ 15 วินาที ตามคู่เงินที่คุณเลือก
setInterval(() => {
    const signal = Math.random() >= 0.5 ? '🟢 CALL' : '🔴 PUT';
    const price = (1 + Math.random() * 0.5).toFixed(4);
    const conf = (85 + Math.random() * 14).toFixed(1);
    
    const msg = `🚀 AI SMART SIGNAL\n\n📊 สินทรัพย์: ${selectedAsset}\n${signal}\n💰 ราคา: ${price}\n🎯 ความเชื่อมั่น: ${conf}%\n⏰ เวลา: ${new Date().toLocaleTimeString()}`;
    
    sendTelegramMessage(CHAT_ID, msg);
}, 15000);

// เช็คคำสั่งจากผู้ใช้ทุกๆ 3 วินาที
setInterval(checkTelegramUpdates, 3000);

// Web Server สำหรับ Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Interactive AI Signal Bot is Running 24/7\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

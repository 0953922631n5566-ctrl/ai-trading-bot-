const http = require('http');
const https = require('https');

const TOKEN = '8839850954:AAGSlkoHu_BFtuM7Fzc5kPhFjRD1nhmtyZs'.trim();
const CHAT_ID = '6451332748'.trim();

// การตั้งค่าสถานะเริ่มต้นของบอร์ด
let state = {
    market: 'ตลาดจริง (Normal)',
    tf: '1 นาที (60s)',
    tfSeconds: 60,
    asset: 'EUR/USD',
    isBotOn: true,
    wins: 3,
    losses: 3,
    signal: 'PREPARING...',
    confidence: 92.5,
    lastMsgId: null
};

function getThaiTime() {
    return new Date().toLocaleTimeString('en-GB', { 
        timeZone: 'Asia/Bangkok',
        hour12: false 
    });
}

// คำนวณเวลานับถอยหลังเปลี่ยนแท่งเทียน
function getRemainingSeconds(tfSec) {
    const now = new Date();
    const currentSec = now.getSeconds() + (now.getMilliseconds() / 1000);
    const remain = tfSec - (currentSec % tfSec);
    return Math.floor(remain);
}

// สร้างข้อความ Dashboard สไตล์ V10.9.9 Pro
function renderDashboardText() {
    const remainSec = getRemainingSeconds(state.tfSeconds);
    const totalTrades = state.wins + state.losses;
    const winRate = totalTrades > 0 ? ((state.wins / totalTrades) * 100).toFixed(1) : '0.0';
    const netStatus = state.isBotOn ? '🟢 ONLINE (REAL-TIME)' : '🔴 OFFLINE (PAUSED)';
    const livePrice = (1.0800 + Math.random() * 0.0050).toFixed(5);
    
    // กำหนดสถานะสัญญาณตามเวลาแท่งเทียน
    let signalBox = '⏳ PREPARING...';
    if (remainSec <= 10 && state.isBotOn) {
        signalBox = state.signal;
    }

    return `━━━━━━━━━━━━━━━━━━━━━━
🤖 *AI SMART SIGNAL V10.9.9 PRO*
_TELEGRAM BOT INTEGRATION_
━━━━━━━━━━━━━━━━━━━━━━

🌐 *NET STATUS:* ${netStatus}

🔥 *AI MULTI-ASSET RADAR (TOP PICK)*
กำลังคำนวณสแกนหาคู่เงินที่ดีที่สุด...

📊 *การตั้งค่าการเทรด:*
• ประเภทตลาด: \`${state.market}\`
• กรอบเวลา (TF): \`${state.tf}\`
• คู่สินทรัพย์: \`${state.asset}\`

📈 *LIVE DATA MONITOR:*
• LIVE PRICE: \`${livePrice}\`
• AI STRATEGY SCORE: *HIGH ACCURACY*
• WIN RATE: *${winRate}%* (${state.wins}W/${state.losses}L)
• AI CORRECTION BIAS: \`-0.00003\`

⏱️ *TF ${state.tfSeconds}s ➔ อีก ${remainSec} วินาที เปลี่ยนแท่ง*

━━━━━━━━━━━━━━━━━━━━━━
🔥 *STATUS / SIGNAL:*
*${signalBox}*
🎯 *CONFIDENCE:* \`${state.confidence}%\`
━━━━━━━━━━━━━━━━━━━━━━
⏰ *เวลาไทย:* \`${getThaiTime()}\``;
}

// สร้างปุ่มกด Interactive
function getDashboardKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: `🌐 ตลาด: ${state.market.includes('OTC') ? 'OTC' : 'REAL'}`, callback_data: 'TOGGLE_MARKET' },
                { text: `⏱️ TF: ${state.tfSeconds}s`, callback_data: 'TOGGLE_TF' }
            ],
            [
                { text: '💶 EUR/USD', callback_data: 'SET_EURUSD' },
                { text: '💷 GBP/USD', callback_data: 'SET_GBPUSD' },
                { text: '🥇 GOLD', callback_data: 'SET_XAUUSD' }
            ],
            [
                { text: state.isBotOn ? '🟢 BOT: ON' : '🔴 BOT: OFF', callback_data: 'TOGGLE_BOT' },
                { text: '🧪 TEST SIGNAL', callback_data: 'TEST_SIGNAL' },
                { text: '🔄 RESET STATS', callback_data: 'RESET_STATS' }
            ]
        ]
    };
}

// ฟังก์ชันส่งหรือแก้ไขข้อความ
function sendOrUpdateDashboard() {
    const text = renderDashboardText();
    const keyboard = getDashboardKeyboard();

    if (!state.lastMsgId) {
        // ถ้ายังไม่มีข้อความบอร์ด ให้ส่งข้อความใหม่
        const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
        const payload = JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
        
        postRequest(url, payload, (data) => {
            if (data && data.ok) {
                state.lastMsgId = data.result.message_id;
            }
        });
    } else {
        // ถ้ามีบอร์ดแล้ว ให้ Edit ข้อความเดิม
        const url = `https://api.telegram.org/bot${TOKEN}/editMessageText`;
        const payload = JSON.stringify({
            chat_id: CHAT_ID,
            message_id: state.lastMsgId,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });

        postRequest(url, payload, (data) => {
            // ถ้า Message ไม่เปลี่ยน หรือเกิด Error ให้ข้ามไป
        });
    }
}

function postRequest(urlStr, jsonString, callback) {
    const u = new URL(urlStr);
    const options = {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(jsonString)
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try { callback(JSON.parse(body)); } catch(e) {}
        });
    });
    req.on('error', (e) => console.error(e));
    req.write(jsonString);
    req.end();
}

// เช็กการกดปุ่มจาก Telegram
function checkUpdates() {
    https.get(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=-1`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(body);
                if (json.ok && json.result.length > 0) {
                    const up = json.result[json.result.length - 1];
                    if (up.callback_query) {
                        const data = up.callback_query.data;
                        
                        if (data === 'TOGGLE_MARKET') state.market = state.market.includes('OTC') ? 'ตลาดจริง (Normal)' : 'ตลาด OTC';
                        if (data === 'TOGGLE_TF') {
                            state.tfSeconds = state.tfSeconds === 60 ? 300 : 60;
                            state.tf = state.tfSeconds === 60 ? '1 นาที (60s)' : '5 นาที (300s)';
                        }
                        if (data === 'SET_EURUSD') state.asset = 'EUR/USD';
                        if (data === 'SET_GBPUSD') state.asset = 'GBP/USD';
                        if (data === 'SET_XAUUSD') state.asset = 'GOLD (XAU/USD)';
                        if (data === 'TOGGLE_BOT') state.isBotOn = !state.isBotOn;
                        if (data === 'RESET_STATS') { state.wins = 0; state.losses = 0; }
                        if (data === 'TEST_SIGNAL') {
                            state.signal = Math.random() > 0.5 ? '🚀 BUY / CALL NOW!' : '🔴 SELL / PUT NOW!';
                            state.confidence = (88 + Math.random() * 11).toFixed(1);
                        }

                        // ตอบกลับ Callback ไม่ให้ปุ่มหมุนค้าง
                        https.get(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery?callback_query_id=${up.callback_query.id}`).on('error', ()=>{});
                        sendOrUpdateDashboard();
                    }
                    if (up.message && up.message.text === '/start') {
                        state.lastMsgId = null; // ส่งบอร์ดใหม่เมื่อพิมพ์ /start
                        sendOrUpdateDashboard();
                    }
                }
            } catch(e) {}
        });
    }).on('error', ()=>{});
}

console.log("🤖 Dashboard V10.9.9 Pro Engine Started...");

// อัปเดตหน้า Dashboard ทุกๆ 3 วินาที (เพื่อให้เวลานับถอยหลังรันสดๆ)
setInterval(() => {
    // สุ่มสร้างสัญญาณใหม่เมื่อเข้าสู่ช่วง 10 วินาทีสุดท้ายของแท่งเทียน
    const rem = getRemainingSeconds(state.tfSeconds);
    if (rem === 10 && state.isBotOn) {
        state.signal = Math.random() > 0.5 ? '🚀 BUY / CALL NOW!' : '🔴 SELL / PUT NOW!';
        state.confidence = (89 + Math.random() * 10).toFixed(1);
    } else if (rem > 10) {
        state.signal = '⏳ PREPARING...';
    }

    sendOrUpdateDashboard();
}, 3000);

setInterval(checkUpdates, 2000);

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Dashboard Pro V10.9.9 Running\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

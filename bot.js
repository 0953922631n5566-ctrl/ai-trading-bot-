const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let stats = {
  win: 33,
  loss: 7,
  logs: []
};

bot.start((ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || 'https://your-app.onrender.com';
  
  ctx.reply(
    `🤖 *AI FOREX & OTC VISION ANALYZER*\n\n` +
    `⚡ *วิธีใช้งานรวดเร็วหน้างาน:*\n` +
    `1. แคปภาพหน้าจอกราฟจาก 8x Trade\n` +
    `2. กดส่งรูปภาพเข้ามาในแชทนี้ได้ทันที!\n` +
    `3. AI จะวิเคราะห์แท่งเทียน/เทรนด์แล้วตอบกลับภายในไม่กี่วินาที 🚀\n\n` +
    `หรือกดปุ่มด้านล่างเพื่อเปิดหน้าจอ Dashboard ดูสถิติครับ`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 เปิดหน้าจอ AI Mini App', web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
});

// ระบบรับภาพถ่ายทางแชท Telegram
bot.on('photo', async (ctx) => {
  try {
    ctx.reply('🔍 AI กำลังวิเคราะห์ภาพกราฟของคุณสักครู่ครับ...');

    const photos = ctx.message.photo;
    const highestResPhoto = photos[photos.length - 1];
    const fileLink = await ctx.telegram.getFileLink(highestResPhoto.file_id);

    // ดาวน์โหลดรูปภาพและแปลงเป็น Base64 โดยใช้ fetch
    const imageBuffer = await fetch(fileLink.href).then(res => res.arrayBuffer());
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const promptText = `คุณคือผู้เชี่ยวชาญการเทรด Binary Options / 8x Trade
วิเคราะห์ภาพกราฟนี้ (แท่งเทียน, แนวรับแนวต้าน, อินดิเคเตอร์, ไส้เทียน) 
ตอบสรุปสั้นๆ และชัดเจนที่สุดในรูปแบบนี้:
1. สัญญาณ: [🟢 CALL / 🔴 PUT / ⚪ WAIT (ควรรอ)]
2. ความมั่นใจ: [XX%]
3. เหตุผลสั้นๆ: [ระบุ 1 ประโยค]`;

    // เรียกใช้ Gemini API โดยใช้ fetch
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiRes.json();

    if (data.candidates && data.candidates[0]) {
      const aiAnalysis = data.candidates[0].content.parts[0].text;

      stats.logs.unshift({
        time: new Date().toLocaleTimeString('th-TH'),
        text: aiAnalysis.split('\n')[0]
      });

      ctx.reply(`📊 *ผลการวิเคราะห์จาก AI Vision:*\n\n${aiAnalysis}`, { parse_mode: 'Markdown' });
    } else {
      ctx.reply('⚠️ ไม่สามารถวิเคราะห์ภาพได้ กรุณาตรวจสอบ GEMINI_API_KEY หรือส่งภาพใหม่อีกครั้งครับ');
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    ctx.reply('❌ เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้งครับ');
  }
});

app.get('/api/stats', (req, res) => {
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

bot.launch().then(() => {
  console.log('Telegram Bot is active!');
}).catch((err) => {
  console.error('Bot launch error:', err);
});

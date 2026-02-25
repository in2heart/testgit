const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

// ===== ใส่ข้อมูลของคุณที่นี่ =====
const config = {
  channelAccessToken: 'XzYBPDQVa7HbImxmmzz4QgYcpusPqCB/Y3IddYzHq8jVfsXKbWWmfsVDEp6pnlPD4iRRo9+u5C3iQ8FRHE7/tSqMz33Fpwj3Vq7l/V63P8XLEN5+B2A+DZsb9cIXReU2lhRbUFEUp9WG65r61hw4egdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'be395dd1028244d17061b7ffcc35f563'
};

const STACK_AI_FLOW_ID = '699da919279f002824f43dd3';
const STACK_AI_API_KEY = 'eb2a532c-c03b-448e-b9ba-dd5992880151';
// ===================================

const app = express();
const client = new line.Client(config);

// หน้าแรก - ทดสอบว่า Server ทำงาน
app.get('/', (req, res) => {
  res.send('LINE Bot is running! 🤖');
});

// Webhook - รับข้อความจาก LINE
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).end();
  }
});

// ฟังก์ชันจัดการข้อความ
async function handleEvent(event) {
  // ตรวจสอบว่าเป็นข้อความหรือไม่
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userMessage = event.message.text;

  try {
    console.log(`📩 รับข้อความ: ${userMessage}`);
    console.log(`🚀 กำลังเรียก Stack AI...`);

    // เรียก Stack AI API
    const response = await axios.post(
      `https://api.stack-ai.com/run/flow/${STACK_AI_FLOW_ID}`,
      { 'in-0': userMessage },
      {
        headers: {
          'Authorization': `Bearer ${STACK_AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 วินาที
      }
    );

    const aiReply = response.data['out-0'] || 'ขออภัย ไม่สามารถประมวลผลได้';
    console.log(`✅ ตอบกลับ: ${aiReply.substring(0, 100)}...`);

    // ตอบกลับไปยัง LINE
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiReply
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // ตอบกลับเมื่อเกิด Error
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    });
  }
}

// เริ่ม Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🌐 http://localhost:${port}`);
});
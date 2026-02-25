const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

// ===== อ่านจาก Environment Variables =====
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || 'XzYBPDQVa7HbImxmmzz4QgYcpusPqCB/Y3IddYzHq8jVfsXKbWWmfsVDEp6pnlPD4iRRo9+u5C3iQ8FRHE7/tSqMz33Fpwj3Vq7l/V63P8XLEN5+B2A+DZsb9cIXReU2lhRbUFEUp9WG65r61hw4egdB04t89/1O/w1cDnyilFU=',
  channelSecret: process.env.CHANNEL_SECRET || 'be395dd1028244d17061b7ffcc35f563'
};

const STACK_AI_FLOW_ID = process.env.STACK_AI_FLOW_ID || '699da919279f002824f43dd3';
const STACK_AI_API_KEY = process.env.STACK_AI_API_KEY || 'eb2a532c-c03b-448e-b9ba-dd5992880151';
// =====================================================

const app = express();
const client = new line.Client(config);

// หน้าแรก
app.get('/', (req, res) => {
  res.send('LINE Bot is running! 🤖');
});

// Webhook
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error('❌ Webhook Error:', err);
    res.status(500).end();
  }
});

// ฟังก์ชันจัดการข้อความ
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userMessage = event.message.text;
  const userId = event.source.userId;

  try {
    console.log(`📩 รับข้อความ: ${userMessage}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`🚀 กำลังเรียก Stack AI...`);
    console.log(`📝 Flow ID: ${STACK_AI_FLOW_ID}`);

    // เรียก Stack AI API (แก้ไข URL)
    const response = await axios.post(
      // `https://www.stack-ai.com/api/v7/run/${STACK_AI_FLOW_ID}`,
      `https://api.stack-ai.com/inference/v7/run/3b4e412a-5451-44f0-8bfb-007dcde6f15c/699da919279f002824f43dd3`,
      { 
        'in-0': userMessage
      },
      {
        headers: {
          'Authorization': `Bearer ${STACK_AI_API_KEY}`,
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        timeout: 60000
      }
    );

    console.log('✅ Stack AI Response:', JSON.stringify(response.data, null, 2));

    const aiReply = response.data['out-0'] || response.data.output || 'ขออภัย ไม่สามารถประมวลผลได้';
    console.log(`✅ ตอบกลับ: ${aiReply.substring(0, 100)}...`);

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiReply
    });

  } catch (error) {
    console.error('❌ Error Details:');
    console.error('  - Status:', error.response?.status);
    console.error('  - Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('  - Message:', error.message);
    console.error('  - URL:', error.config?.url);
    
    let errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    
    if (error.response?.status === 404) {
      errorMessage = 'ไม่พบ Flow ที่ระบุ กรุณาตรวจสอบ Flow ID';
    } else if (error.response?.status === 401) {
      errorMessage = 'API Key ไม่ถูกต้อง กรุณาตรวจสอบ API Key';
    } else if (error.response?.status === 405) {
      errorMessage = 'API Endpoint ไม่ถูกต้อง กำลังแก้ไข...';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'หมดเวลาในการเชื่อมต่อ กรุณาลองใหม่';
    }
    
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: errorMessage
    });
  }
}

// เริ่ม Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`📝 Flow ID: ${STACK_AI_FLOW_ID}`);
  console.log(`🔑 API Key: ${STACK_AI_API_KEY ? '***' + STACK_AI_API_KEY.slice(-4) : 'Not set'}`);
});
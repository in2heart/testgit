const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

// ===== อ่านจาก Environment Variables =====
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || 'XzYBPDQVa7HbImxmmzz4QgYcpusPqCB/Y3IddYzHq8jVfsXKbWWmfsVDEp6pnlPD4iRRo9+u5C3iQ8FRHE7/tSqMz33Fpwj3Vq7l/V63P8XLEN5+B2A+DZsb9cIXReU2lhRbUFEUp9WG65r61hw4egdB04t89/1O/w1cDnyilFU=',
  channelSecret: process.env.CHANNEL_SECRET || 'be395dd1028244d17061b7ffcc35f563'
};

const STACK_AI_ORG_ID = process.env.STACK_AI_ORG_ID || '3b4e412a-5451-44f0-8bfb-007dcde6f15c';
const STACK_AI_FLOW_ID = process.env.STACK_AI_FLOW_ID || '699da919279f002824f43dd3';
const STACK_AI_API_KEY = process.env.STACK_AI_API_KEY || 'eb2a532c-c03b-448e-b9ba-dd5992880151';
// =====================================================

const app = express();
const client = new line.Client(config);

app.get('/', (req, res) => {
  res.send('LINE Bot is running! 🤖');
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error('❌ Webhook Error:', err);
    res.status(500).end();
  }
});

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
    console.log(`📝 ORG_ID: ${STACK_AI_ORG_ID}`);
    console.log(`📝 Flow ID: ${STACK_AI_FLOW_ID}`);

    // ใช้ API v0 (ไม่ใช่ v7)
    const apiUrl = `https://api.stack-ai.com/inference/v0/run/${STACK_AI_ORG_ID}/${STACK_AI_FLOW_ID}`;
    console.log(`🌐 API URL: ${apiUrl}`);

    const response = await axios.post(
      apiUrl,
      { 
        'in-0': userMessage,
        'user_id': userId
      },
      {
        headers: {
          'Authorization': `Bearer ${STACK_AI_API_KEY}`,
          'Content-Type': 'application/json'
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
      errorMessage = 'ไม่พบ Flow ที่ระบุ กรุณาตรวจสอบ API Endpoint';
      console.error('  💡 Hint: ตรวจสอบว่าใช้ API Version ที่ถูกต้อง (v0 หรือ v1)');
    } else if (error.response?.status === 401) {
      errorMessage = 'API Key ไม่ถูกต้อง';
    } else if (error.response?.status === 405) {
      errorMessage = 'API Method ไม่ถูกต้อง';
    }
    
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: errorMessage
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`📝 ORG_ID: ${STACK_AI_ORG_ID}`);
  console.log(`📝 Flow ID: ${STACK_AI_FLOW_ID}`);
  console.log(`🔑 API Key: ${STACK_AI_API_KEY ? '***' + STACK_AI_API_KEY.slice(-4) : 'Not set'}`);
});
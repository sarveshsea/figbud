// Test OpenRouter free models directly
const axios = require('axios');
require('dotenv').config();

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log('🔍 Testing OpenRouter API...\n');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

  const models = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-2-9b-it:free',
    'deepseek/deepseek-chat'
  ];

  for (const model of models) {
    console.log(`\n📝 Testing model: ${model}`);
    
    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful UI design assistant.'
          },
          {
            role: 'user',
            content: 'Say hello in one sentence.'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://figma.com',
          'X-Title': 'FigBud Assistant',
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0]?.message?.content;
      console.log('✅ Success:', content);
      console.log('   Model:', response.data.model);
      console.log('   Usage:', response.data.usage);
      
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.statusText);
      if (error.response?.data) {
        console.log('   Details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  // Check account info
  console.log('\n📊 Checking account info...');
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('Account info:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('Could not fetch account info:', error.response?.status);
  }
}

testOpenRouter().catch(console.error);
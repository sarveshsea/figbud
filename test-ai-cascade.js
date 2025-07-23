#!/usr/bin/env node

const axios = require('axios');

async function testAICascade() {
  console.log('🤖 Testing AI Cascade Configuration...\n');
  
  // Check if server is running
  try {
    const health = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running! Start it with: npm run server\n');
    return;
  }
  
  // Test messages to trigger different AI models
  const testMessages = [
    {
      message: "Hello",
      expected: "Should use free model first"
    },
    {
      message: "Create a button component",
      expected: "Should use free model or DeepSeek direct"
    },
    {
      message: "Explain design systems in detail",
      expected: "Longer response might trigger paid model"
    }
  ];
  
  console.log('📊 Model Priority Order:');
  console.log('1. OpenRouter Free Llama (Priority 1)');
  console.log('2. OpenRouter Free Gemma (Priority 2)');
  console.log('3. DeepSeek Direct API (Priority 3) - $0.14/million tokens');
  console.log('4. Claude Haiku via OpenRouter (Priority 4) - $0.25/million tokens');
  console.log('\n');
  
  // Test each message
  for (const test of testMessages) {
    console.log(`\n📝 Testing: "${test.message}"`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post('http://localhost:3000/api/chat/message', {
        message: test.message,
        context: { source: 'ai-cascade-test' }
      });
      const duration = Date.now() - startTime;
      
      const data = response.data;
      const metadata = data.metadata || {};
      
      console.log(`   ✅ Response received in ${duration}ms`);
      console.log(`   🤖 Model used: ${metadata.usedModel || 'unknown'}`);
      console.log(`   💰 Free model: ${metadata.isFree ? 'Yes' : 'No'}`);
      
      // Check attempts to see cascade behavior
      if (metadata.attempts && metadata.attempts.length > 0) {
        console.log(`   🔄 Attempts made: ${metadata.attempts.length}`);
        metadata.attempts.forEach((attempt, idx) => {
          if (attempt.success) {
            console.log(`      ${idx + 1}. ${attempt.model} - ✅ Success`);
          } else {
            console.log(`      ${idx + 1}. ${attempt.model} - ❌ Failed: ${attempt.error?.substring(0, 50)}...`);
          }
        });
      }
      
      // Show cost if available
      if (data.cost !== undefined) {
        console.log(`   💵 Estimated cost: $${data.cost.toFixed(6)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n\n📊 Summary:');
  console.log('The cascade should work as follows:');
  console.log('1. Try free OpenRouter models first (Llama, Gemma)');
  console.log('2. If free models fail, use DeepSeek direct API');
  console.log('3. Only use expensive OpenRouter models as last resort');
  console.log('\n💰 Cost Savings:');
  console.log('- DeepSeek direct: $0.14/million tokens');
  console.log('- DeepSeek via OpenRouter: $0.28/million tokens (avoided!)');
  console.log('- Savings: 50% on DeepSeek usage');
}

testAICascade().catch(console.error);
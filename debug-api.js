// Debug script to test API connectivity

const fetch = require('node-fetch');

async function testBackend() {
  console.log('🔍 Testing FigBud Backend API...\n');

  // 1. Test health endpoint
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ Health check passed:', data);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    console.log('   Make sure to run: npm run server');
    return;
  }

  // 2. Test chat endpoint
  try {
    console.log('\n2. Testing chat endpoint...');
    const chatResponse = await fetch('http://localhost:3000/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Create a primary button',
        context: { test: true }
      })
    });

    if (chatResponse.ok) {
      const data = await chatResponse.json();
      console.log('✅ Chat endpoint responded:');
      console.log('   Message:', data.text);
      console.log('   Model used:', data.metadata?.usedModel || data.metadata?.model);
      console.log('   Is Free:', data.metadata?.isFree);
      console.log('   Conversation ID:', data.conversationId);
      
      if (data.metadata?.attempts) {
        console.log('\n   Model attempts:');
        data.metadata.attempts.forEach((attempt, i) => {
          console.log(`   ${i + 1}. ${attempt.model}: ${attempt.success ? '✅' : '❌'} ${attempt.error || ''}`);
        });
      }
    } else {
      console.log('❌ Chat endpoint failed:', chatResponse.status);
      const error = await chatResponse.text();
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ Chat request failed:', error.message);
  }

  // 3. Check DeepSeek off-hours
  console.log('\n3. DeepSeek Off-Hours Status:');
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const totalMinutes = utcHours * 60 + utcMinutes;
  const isOffHours = (totalMinutes >= 990) || (totalMinutes <= 30);
  
  console.log(`   Current UTC: ${now.toUTCString()}`);
  console.log(`   Current PST: ${new Date(now.getTime() - 8 * 60 * 60 * 1000).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
  console.log(`   Off-hours active: ${isOffHours ? '✅ YES (50% discount)' : '❌ NO'}`);
  console.log(`   Off-hours window: 8:30 AM - 4:30 PM PST`);
}

// Run the test
testBackend().catch(console.error);
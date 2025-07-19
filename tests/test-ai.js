// Enhanced test script to verify smart AI integration
const axios = require('axios');

async function testAI() {
  console.log('Testing FigBud Smart AI Integration...\n');
  console.log('Strategy:', process.env.AI_STRATEGY || 'cost_optimized');
  console.log('Default Provider:', process.env.DEFAULT_AI_PROVIDER || 'smart');
  console.log('Current time:', new Date().toLocaleString());
  console.log('=' .repeat(60) + '\n');

  try {
    // Test messages
    const testMessages = [
      'Hello, can you help me?',
      'Create a button',
      'Make a card component',
      'Show me an input field',
      'Build a toggle switch',
      'What are design best practices?'
    ];

    let totalCost = 0;
    let freeRequests = 0;
    let paidRequests = 0;

    for (const message of testMessages) {
      console.log(`\nTesting: "${message}"`);
      console.log('-'.repeat(50));

      const startTime = Date.now();
      
      try {
        const response = await axios.post('http://localhost:3000/api/chat/message', {
          message: message,
          context: {
            selectedNodes: [],
            currentPage: 'Page 1',
            userLevel: 'beginner',
            startTime: startTime
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const duration = Date.now() - startTime;

        if (response.data.success) {
          console.log('✅ Response:', response.data.response.substring(0, 100) + '...');
          console.log('📦 Provider:', response.data.provider);
          console.log('🤖 Model:', response.data.model);
          console.log('💰 Free:', response.data.isFree ? 'YES' : 'NO');
          console.log('⏱️  Duration:', duration + 'ms');
          
          if (response.data.metadata) {
            if (response.data.metadata.action) {
              console.log('🎯 Action:', response.data.metadata.action);
            }
            if (response.data.metadata.componentType) {
              console.log('🔧 Component:', response.data.metadata.componentType);
            }
            if (response.data.metadata.teacherNote) {
              console.log('💡 Teacher Note:', response.data.metadata.teacherNote);
            }
          }

          // Track costs
          if (response.data.isFree) {
            freeRequests++;
          } else {
            paidRequests++;
          }

          // Show cascade attempts if any
          if (response.data.attempts && response.data.attempts.length > 1) {
            console.log('\n🔄 Model Cascade:');
            response.data.attempts.forEach((attempt, idx) => {
              console.log(`   ${idx + 1}. ${attempt.model}: ${attempt.success ? '✅' : '❌'} ${attempt.error || ''}`);
            });
          }
        } else {
          console.log('❌ Error:', response.data.message);
          console.log('Available providers:', response.data.availableProviders);
        }
      } catch (error) {
        console.error('❌ Request failed:', error.message);
        if (error.response && error.response.data) {
          console.error('Details:', error.response.data);
        }
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('SUMMARY:');
    console.log(`Total requests: ${testMessages.length}`);
    console.log(`Free requests: ${freeRequests}`);
    console.log(`Paid requests: ${paidRequests}`);
    console.log(`Success rate: ${((freeRequests + paidRequests) / testMessages.length * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend server is running (npm run server:dev)');
    console.log('2. API keys are set in .env file');
    console.log('3. Port 3000 is not blocked');
  }
}

// Check environment
console.log('Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('Has OpenRouter key:', !!process.env.OPENROUTER_API_KEY);
console.log('Has DeepSeek key:', !!process.env.DEEPSEEK_API_KEY);
console.log('');

// Run the test
testAI();
// Test AI Provider Fallback Mechanism

const API_URL = 'http://localhost:3000/api';

async function testMultipleRequests() {
  console.log('🔍 Testing AI Provider Fallback Mechanism\n');
  
  const testMessages = [
    'Hello, can you help me create a button?',
    'Create a card with a shadow',
    'I need an input field for email',
    'Make a badge that says "New"',
    'Create a large heading'
  ];
  
  console.log('📤 Sending multiple requests to test fallback...\n');
  
  for (let i = 0; i < testMessages.length; i++) {
    console.log(`\n--- Request ${i + 1} ---`);
    console.log(`Message: "${testMessages[i]}"`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessages[i],
          context: {
            timestamp: new Date().toISOString(),
            requestNumber: i + 1
          }
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        console.error(`❌ Request failed with status: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`✅ Success in ${duration}ms`);
      console.log(`Model used: ${data.metadata?.model || 'unknown'}`);
      console.log(`Provider: ${data.metadata?.provider || 'unknown'}`);
      console.log(`Component type: ${data.metadata?.componentType || 'none'}`);
      
      if (data.text) {
        console.log(`Response preview: ${data.text.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n📊 Test Summary:');
  console.log('The cascading AI provider should have tried models in this order:');
  console.log('1. Free OpenRouter models (Llama, Gemma)');
  console.log('2. DeepSeek direct API (if during off-hours)');
  console.log('3. OpenRouter DeepSeek (paid fallback)');
  console.log('\nCheck the server logs for detailed fallback behavior.');
}

// Run the test
testMultipleRequests().catch(console.error);
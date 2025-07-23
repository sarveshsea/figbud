// Test script to verify backend API response structure

const API_URL = 'http://localhost:3000/api';

async function testChatEndpoint() {
  console.log('Testing backend chat API endpoint...\n');
  
  try {
    const response = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me create a button?',
        context: {
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      console.error(`API returned status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Response received successfully!');
    console.log('\n📋 Response structure:');
    console.log('- Has "text" field:', !!data.text);
    console.log('- Has "message" field:', !!data.message);
    console.log('- Has "metadata" field:', !!data.metadata);
    console.log('- Has "conversationId" field:', !!data.conversationId);
    
    if (data.text) {
      console.log('\n📝 Text field content:');
      console.log(data.text.substring(0, 200) + (data.text.length > 200 ? '...' : ''));
    }
    
    if (data.message) {
      console.log('\n📝 Message field content:');
      console.log(data.message.substring(0, 200) + (data.message.length > 200 ? '...' : ''));
    }
    
    if (data.metadata) {
      console.log('\n🔧 Metadata:');
      console.log('- Component type:', data.metadata.componentType);
      console.log('- Suggestions:', data.metadata.suggestions);
      console.log('- Model used:', data.metadata.model);
      console.log('- Provider:', data.metadata.provider);
    }
    
    console.log('\n📦 Full response (first 500 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error('Make sure the backend server is running on port 3000');
  }
}

// Test health endpoint first
async function testHealthEndpoint() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log('✅ Health check passed - Backend is running');
      return true;
    } else {
      console.error('❌ Health check failed - Status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to backend at', API_URL);
    console.error('Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🔍 Testing FigBud Backend API\n');
  
  const isHealthy = await testHealthEndpoint();
  if (isHealthy) {
    console.log('\n---\n');
    await testChatEndpoint();
  } else {
    console.log('\n⚠️  Please make sure the backend server is running:');
    console.log('   cd /Users/sarveshchidambaram/Desktop/figbud');
    console.log('   npm run server');
  }
}

runTests();
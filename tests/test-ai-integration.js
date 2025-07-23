const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

async function testAIIntegration() {
  console.log('🧪 Testing FigBud AI Integration\n');
  
  // Test 1: Basic chat message
  console.log('1️⃣ Testing basic chat message...');
  try {
    const response = await axios.post(`${API_URL}/chat/message`, {
      message: 'Create a button component',
      context: {}
    });
    
    console.log('✅ Response received:');
    console.log('- Provider:', response.data.provider);
    console.log('- Model:', response.data.model);
    console.log('- Is Free:', response.data.isFree);
    console.log('- Response:', response.data.response.substring(0, 100) + '...');
    
    if (response.data.metadata?.intent) {
      console.log('\n📊 Intent Detection:');
      console.log('- Action:', response.data.metadata.intent.action);
      console.log('- Components:', response.data.metadata.intent.componentTypes);
      console.log('- Confidence:', response.data.metadata.intent.confidence);
    }
    
    if (response.data.metadata?.components) {
      console.log('\n📦 Detected Components:', response.data.metadata.components.length);
    }
    
    if (response.data.metadata?.tutorials) {
      console.log('\n📹 Related Tutorials:', response.data.metadata.tutorials.length);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Tutorial search
  console.log('2️⃣ Testing tutorial search...');
  try {
    const response = await axios.post(`${API_URL}/chat/message`, {
      message: 'Show me a tutorial on how to create forms in Figma',
      context: {}
    });
    
    console.log('✅ Response received:');
    console.log('- Response:', response.data.response.substring(0, 100) + '...');
    
    if (response.data.metadata?.tutorials && response.data.metadata.tutorials.length > 0) {
      console.log('\n📹 Tutorials found:');
      response.data.metadata.tutorials.slice(0, 3).forEach((tutorial, idx) => {
        console.log(`\n${idx + 1}. ${tutorial.title}`);
        console.log(`   Duration: ${tutorial.duration}`);
        console.log(`   Channel: ${tutorial.channelTitle}`);
        if (tutorial.timestamps && tutorial.timestamps.length > 0) {
          console.log('   Timestamps:');
          tutorial.timestamps.slice(0, 3).forEach(ts => {
            console.log(`   - ${ts.time}: ${ts.title}`);
          });
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Component search
  console.log('3️⃣ Testing component search...');
  try {
    const response = await axios.post(`${API_URL}/chat/components/search`, {
      keywords: ['button', 'primary'],
      types: ['button'],
      limit: 5
    });
    
    console.log('✅ Components found:', response.data.total);
    if (response.data.components.length > 0) {
      console.log('\nComponents:');
      response.data.components.forEach((comp, idx) => {
        console.log(`${idx + 1}. ${comp.name} (${comp.type})`);
        console.log(`   Category: ${comp.category}`);
        console.log(`   Usage Count: ${comp.usage_count}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Provider availability
  console.log('4️⃣ Testing AI provider availability...');
  try {
    const response = await axios.post(`${API_URL}/chat/message`, {
      message: 'test',
      context: {}
    }, {
      headers: {
        'x-ai-provider': 'smart'
      }
    });
    
    console.log('✅ Available providers:', response.data.availableProviders);
    console.log('\n📊 Model attempts:');
    if (response.data.attempts) {
      response.data.attempts.forEach(attempt => {
        console.log(`- ${attempt.model}: ${attempt.success ? '✅' : '❌'} ${attempt.error || ''}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests
testAIIntegration().catch(console.error);
#!/usr/bin/env node

const axios = require('axios');

async function testYouTubeIntegration() {
  console.log('🔍 Testing YouTube Integration...\n');
  
  // Test messages that should trigger YouTube searches
  const testMessages = [
    {
      message: "How do I create a button in Figma?",
      expected: "button tutorials"
    },
    {
      message: "I need help with auto layout",
      expected: "auto layout tutorials"
    },
    {
      message: "Show me a tutorial on design systems",
      expected: "design system tutorials"
    },
    {
      message: "I want to create a new card component",
      expected: "card component tutorials"
    },
    {
      message: "Learn how to make modals",
      expected: "modal tutorials"
    }
  ];
  
  // Check if server is running
  try {
    const health = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running! Start it with: npm run server\n');
    return;
  }
  
  // Test each message
  for (const test of testMessages) {
    console.log(`📝 Testing: "${test.message}"`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat/message', {
        message: test.message,
        context: { source: 'youtube-test' }
      });
      
      const data = response.data;
      const tutorials = data.metadata?.tutorials || [];
      
      if (tutorials.length > 0) {
        console.log(`   ✅ Found ${tutorials.length} tutorials:`);
        tutorials.forEach((tutorial, idx) => {
          console.log(`      ${idx + 1}. ${tutorial.title}`);
          console.log(`         Duration: ${tutorial.duration} | Channel: ${tutorial.channelTitle}`);
          if (tutorial.timestamps && tutorial.timestamps.length > 0) {
            console.log(`         Timestamps: ${tutorial.timestamps.length} chapters`);
          }
        });
      } else {
        console.log(`   ⚠️  No tutorials found`);
      }
      
      // Check if AI response was natural
      if (data.text) {
        try {
          const aiResponse = JSON.parse(data.text);
          console.log(`   💬 AI said: "${aiResponse.message?.substring(0, 100)}..."`);
        } catch {
          console.log(`   💬 AI response: "${data.text.substring(0, 100)}..."`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log();
  }
  
  // Test YouTube service directly
  console.log('\n🔧 Testing YouTube Service Directly...\n');
  
  try {
    // Import and test the service
    const { YouTubeService } = require('./server/services/youtube-service');
    
    // Test component search
    console.log('Testing searchByComponent("button")...');
    const buttonTutorials = await YouTubeService.searchByComponent('button');
    console.log(`✅ Found ${buttonTutorials.length} button tutorials`);
    
    if (buttonTutorials.length > 0) {
      const first = buttonTutorials[0];
      console.log(`   First result: ${first.title}`);
      console.log(`   Timestamps: ${first.timestamps.length} found`);
    }
    
    // Test topic search
    console.log('\nTesting searchByTopic("auto layout")...');
    const autoLayoutTutorials = await YouTubeService.searchByTopic('auto layout');
    console.log(`✅ Found ${autoLayoutTutorials.length} auto layout tutorials`);
    
  } catch (error) {
    console.log(`❌ Direct service test failed: ${error.message}`);
    console.log('   This might be because the service requires environment variables');
  }
  
  console.log('\n📊 Summary:');
  console.log('- Server endpoint is working');
  console.log('- YouTube integration should return tutorials based on queries');
  console.log('- Tutorials should include timestamps when available');
  console.log('- Check .env file for YOUTUBE_API_KEY if no tutorials are found');
}

testYouTubeIntegration().catch(console.error);
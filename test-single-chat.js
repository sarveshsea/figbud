// Test a single chat message to debug YouTube integration

const API_URL = 'http://localhost:3000/api';

async function testSingleChat() {
  console.log('🔍 Testing Chat with YouTube Integration\n');
  
  try {
    console.log('Sending message: "Show me how to create buttons in Figma"\n');
    
    const response = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Show me how to create buttons in Figma',
        context: {
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      console.error(`❌ Request failed with status: ${response.status}`);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Response received\n');
    
    // Parse AI response
    try {
      const aiResponse = JSON.parse(data.text);
      console.log('📝 AI Message:', aiResponse.message?.substring(0, 150) + '...\n');
      
      if (aiResponse.componentType) {
        console.log('🎨 Component Type:', aiResponse.componentType);
      }
    } catch (e) {
      console.log('📝 Response:', data.text.substring(0, 150) + '...\n');
    }
    
    // Check for tutorials
    if (data.metadata?.tutorials && data.metadata.tutorials.length > 0) {
      console.log(`\n📹 YouTube Tutorials Found: ${data.metadata.tutorials.length}\n`);
      
      data.metadata.tutorials.forEach((tutorial, idx) => {
        console.log(`${idx + 1}. ${tutorial.title}`);
        console.log(`   Channel: ${tutorial.channelTitle}`);
        console.log(`   Duration: ${tutorial.duration}`);
        
        if (tutorial.timestamps && tutorial.timestamps.length > 0) {
          console.log(`   Timestamps:`);
          tutorial.timestamps.slice(0, 3).forEach(ts => {
            console.log(`     - ${ts.time}: ${ts.title}`);
          });
        }
        console.log();
      });
    } else {
      console.log('\n⚠️  No YouTube tutorials found in response');
      console.log('Metadata:', JSON.stringify(data.metadata, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Wait for server to start then test
setTimeout(testSingleChat, 3000);
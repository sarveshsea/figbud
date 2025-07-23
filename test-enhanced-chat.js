// Test Enhanced Chat with YouTube Integration

const API_URL = 'http://localhost:3000/api';

async function testEnhancedChat() {
  console.log('🔍 Testing Enhanced Natural Language Chat & YouTube Integration\n');
  
  const testConversations = [
    {
      message: "Hey! I'm new to Figma and want to learn how to create buttons",
      expectedFeatures: ['conversational response', 'button component', 'tutorials']
    },
    {
      message: "Can you show me a tutorial on auto layout?",
      expectedFeatures: ['tutorial search', 'auto layout tutorials']
    },
    {
      message: "I need a card with a shadow effect for my project",
      expectedFeatures: ['card component', 'shadow properties', 'design tips']
    },
    {
      message: "How do I create a design system in Figma?",
      expectedFeatures: ['educational response', 'design system tutorials']
    },
    {
      message: "Make me a primary button that says 'Get Started'",
      expectedFeatures: ['button creation', 'specific properties', 'next steps']
    },
    {
      message: "What's the best way to design forms?",
      expectedFeatures: ['form design advice', 'best practices', 'tutorials']
    }
  ];
  
  console.log('📤 Testing natural language understanding...\n');
  
  for (let i = 0; i < testConversations.length; i++) {
    const test = testConversations[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${i + 1}: "${test.message}"`);
    console.log(`Expected: ${test.expectedFeatures.join(', ')}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          context: {
            timestamp: new Date().toISOString()
          }
        })
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        console.error(`❌ Request failed with status: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`⏱️  Response time: ${duration}ms`);
      
      // Parse the AI response
      try {
        const aiResponse = JSON.parse(data.text);
        
        console.log('\n📝 AI Response:');
        console.log(`Message: ${aiResponse.message.substring(0, 200)}${aiResponse.message.length > 200 ? '...' : ''}`);
        
        if (aiResponse.componentType) {
          console.log(`\n🎨 Component Detection:`);
          console.log(`Type: ${aiResponse.componentType}`);
          console.log(`Properties:`, JSON.stringify(aiResponse.properties, null, 2));
        }
        
        if (aiResponse.suggestions) {
          console.log(`\n💡 Suggestions:`);
          aiResponse.suggestions.forEach((s, idx) => console.log(`${idx + 1}. ${s}`));
        }
        
        if (aiResponse.teacherNote) {
          console.log(`\n📚 Teacher Note: ${aiResponse.teacherNote}`);
        }
        
        if (aiResponse.tutorialQuery) {
          console.log(`\n🔍 Tutorial Query: "${aiResponse.tutorialQuery}"`);
        }
      } catch (e) {
        console.log('\n📝 Response (non-JSON):', data.text.substring(0, 300));
      }
      
      // Check for YouTube tutorials
      if (data.metadata?.tutorials && data.metadata.tutorials.length > 0) {
        console.log(`\n📹 YouTube Tutorials Found: ${data.metadata.tutorials.length}`);
        
        data.metadata.tutorials.forEach((tutorial, idx) => {
          console.log(`\n${idx + 1}. ${tutorial.title}`);
          console.log(`   Channel: ${tutorial.channelTitle}`);
          console.log(`   Duration: ${tutorial.duration}`);
          console.log(`   URL: ${tutorial.url}`);
          
          if (tutorial.timestamps && tutorial.timestamps.length > 0) {
            console.log(`   Timestamps: ${tutorial.timestamps.length} chapters`);
            tutorial.timestamps.slice(0, 3).forEach(ts => {
              console.log(`     - ${ts.time}: ${ts.title}`);
            });
          }
        });
      } else {
        console.log('\n📹 No YouTube tutorials found');
      }
      
      // Analyze quality
      console.log('\n✅ Quality Check:');
      const responseText = JSON.stringify(data);
      console.log(`- Conversational tone: ${responseText.includes('!') || responseText.includes('?') ? '✓' : '✗'}`);
      console.log(`- Educational content: ${responseText.includes('learn') || responseText.includes('try') || responseText.includes('tip') ? '✓' : '✗'}`);
      console.log(`- Component detected: ${responseText.includes('componentType') ? '✓' : '✗'}`);
      console.log(`- Tutorials included: ${data.metadata?.tutorials?.length > 0 ? '✓' : '✗'}`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n\n📊 Summary:');
  console.log('The enhanced chat should now:');
  console.log('✓ Use conversational, friendly language');
  console.log('✓ Focus on teaching, not just task completion');
  console.log('✓ Include relevant YouTube tutorials when appropriate');
  console.log('✓ Extract component specifications from natural language');
  console.log('✓ Provide contextual suggestions for learning');
}

// First check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log('✅ Server is running\n');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running');
    console.log('Please start the server with: npm run server');
    return false;
  }
}

// Run tests
async function runTests() {
  const serverOk = await checkServer();
  if (serverOk) {
    await testEnhancedChat();
  }
}

runTests().catch(console.error);
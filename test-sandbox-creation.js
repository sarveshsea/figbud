// Test Sandbox Component Creation

const API_URL = 'http://localhost:3000/api';

async function testSandboxCreation() {
  console.log('🔍 Testing Sandbox Component Creation\n');
  
  const componentRequests = [
    {
      message: 'Create a primary button with the text "Click Me"',
      expectedType: 'button'
    },
    {
      message: 'Make a card with a title "Welcome" and description "This is a test card"',
      expectedType: 'card'
    },
    {
      message: 'Create an input field for entering a username',
      expectedType: 'input'
    },
    {
      message: 'Make a success badge that says "Active"',
      expectedType: 'badge'
    },
    {
      message: 'Create a large heading that says "Dashboard"',
      expectedType: 'text'
    }
  ];
  
  console.log('📤 Testing component creation requests...\n');
  
  for (let i = 0; i < componentRequests.length; i++) {
    const req = componentRequests[i];
    console.log(`\n--- Component ${i + 1}: ${req.expectedType} ---`);
    console.log(`Request: "${req.message}"`);
    
    try {
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: req.message,
          context: {
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ Request failed with status: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`✅ Response received`);
      
      // Check component metadata
      if (data.metadata?.componentType) {
        console.log(`📦 Component type: ${data.metadata.componentType}`);
        console.log(`✓ Type matches expected: ${data.metadata.componentType === req.expectedType}`);
        
        if (data.metadata.properties) {
          console.log(`🔧 Properties:`);
          Object.entries(data.metadata.properties).forEach(([key, value]) => {
            console.log(`   - ${key}: ${JSON.stringify(value)}`);
          });
        }
        
        if (data.metadata.teacherNote) {
          console.log(`📚 Teacher note: ${data.metadata.teacherNote.substring(0, 100)}...`);
        }
      } else {
        console.log('⚠️  No component type in metadata');
      }
      
      // Check if response indicates component creation
      if (data.text && data.text.toLowerCase().includes('created')) {
        console.log('✅ Response indicates component was created');
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n📊 Sandbox Creation Summary:');
  console.log('The system should:');
  console.log('1. Parse natural language requests for component specifications');
  console.log('2. Extract component type and properties');
  console.log('3. Return metadata with componentType and properties');
  console.log('4. Include educational content (teacher notes)');
  console.log('5. The plugin would then create these components in the Figma sandbox');
}

// Run the test
testSandboxCreation().catch(console.error);
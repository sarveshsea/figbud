const axios = require('axios');
require('dotenv').config();

// Test cases for AI response validation
const VALIDATION_TEST_CASES = [
  {
    name: 'Component creation request',
    message: 'Create a button for me',
    expectedValidation: {
      hasComponentType: true,
      hasAction: true,
      componentType: 'button',
      action: 'component_created'
    }
  },
  {
    name: 'Tutorial request',
    message: 'Show me a tutorial on how to use auto layout',
    expectedValidation: {
      hasTutorials: true,
      minTutorials: 1
    }
  },
  {
    name: 'General question',
    message: 'What are the best practices for Figma design?',
    expectedValidation: {
      hasGuidance: true,
      responseLength: 100 // Minimum characters
    }
  },
  {
    name: 'Multiple component request',
    message: 'I need to create a card with a button inside',
    expectedValidation: {
      hasComponentType: true,
      componentTypes: ['card', 'button']
    }
  }
];

// Test retry behavior
const RETRY_TEST_CASES = [
  {
    name: 'Simulated failure and retry',
    message: 'Create a complex navigation bar',
    simulateFailure: true,
    expectedRetries: 3
  }
];

async function testAIResponseValidation() {
  console.log('🧪 Testing AI Response Validation\n');
  console.log('=' .repeat(60) + '\n');
  
  console.log('1️⃣ Testing validation rules...\n');
  
  for (const testCase of VALIDATION_TEST_CASES) {
    console.log(`Test: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat/message', {
        message: testCase.message,
        context: { test: true },
        widgetSessionId: 'test-validation-' + Date.now()
      });
      
      if (response.data.success) {
        const metadata = response.data.metadata || {};
        const validation = testCase.expectedValidation;
        
        console.log('Response received:');
        
        // Check component validation
        if (validation.hasComponentType) {
          const hasComponent = !!metadata.intent?.componentTypes?.length;
          console.log(`- Has component type: ${hasComponent ? '✅' : '❌'}`);
          
          if (validation.componentType) {
            const matchesType = metadata.intent?.componentTypes?.includes(validation.componentType);
            console.log(`- Correct component type (${validation.componentType}): ${matchesType ? '✅' : '❌'}`);
          }
        }
        
        // Check action validation
        if (validation.hasAction) {
          const hasAction = !!metadata.intent?.action;
          console.log(`- Has action: ${hasAction ? '✅' : '❌'}`);
          
          if (validation.action) {
            const matchesAction = metadata.intent?.action === validation.action;
            console.log(`- Correct action (${validation.action}): ${matchesAction ? '✅' : '❌'}`);
          }
        }
        
        // Check tutorial validation
        if (validation.hasTutorials) {
          const hasTutorials = metadata.tutorials && metadata.tutorials.length > 0;
          console.log(`- Has tutorials: ${hasTutorials ? '✅' : '❌'}`);
          
          if (validation.minTutorials) {
            const meetsTutorialCount = (metadata.tutorials?.length || 0) >= validation.minTutorials;
            console.log(`- Minimum tutorials (${validation.minTutorials}): ${meetsTutorialCount ? '✅' : '❌'}`);
          }
        }
        
        // Check response length
        if (validation.responseLength) {
          const meetsLength = response.data.response.length >= validation.responseLength;
          console.log(`- Response length (>=${validation.responseLength}): ${meetsLength ? '✅' : '❌'}`);
        }
        
        // Show attempts if any
        if (metadata.attempts && metadata.attempts.length > 1) {
          console.log(`\nValidation attempts: ${metadata.attempts.length}`);
          metadata.attempts.forEach((attempt, idx) => {
            console.log(`  ${idx + 1}. ${attempt.model}: ${attempt.success ? '✅' : '❌'} ${attempt.validationError || ''}`);
          });
        }
        
      } else {
        console.log('❌ Request failed:', response.data.message);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('\n' + '-'.repeat(40) + '\n');
  }
  
  console.log('=' .repeat(60) + '\n');
}

async function testRetryLogic() {
  console.log('2️⃣ Testing retry logic...\n');
  
  // Test with intentionally bad prompt to trigger validation failure
  const badPrompts = [
    {
      message: 'x', // Too short
      expectedError: 'Response too short'
    },
    {
      message: 'error error error', // Might trigger error detection
      expectedError: 'Response contains error message'
    }
  ];
  
  for (const test of badPrompts) {
    console.log(`Testing bad prompt: "${test.message}"`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat/message', {
        message: test.message,
        context: { test: true, forceValidation: true },
        widgetSessionId: 'test-retry-' + Date.now()
      });
      
      if (response.data.metadata?.attempts) {
        console.log(`Attempts made: ${response.data.metadata.attempts.length}`);
        
        const hasRetries = response.data.metadata.attempts.some(a => a.validationError);
        console.log(`Had validation failures: ${hasRetries ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      console.log('Request failed (expected for bad prompts)');
    }
    
    console.log('');
  }
  
  console.log('=' .repeat(60) + '\n');
}

async function testProviderFallback() {
  console.log('3️⃣ Testing provider fallback...\n');
  
  // Test with different providers
  const providers = ['deepseek', 'openrouter', 'smart'];
  
  for (const provider of providers) {
    console.log(`Testing with provider: ${provider}`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat/message', {
        message: 'Create a simple card component',
        context: { test: true },
        widgetSessionId: 'test-provider-' + Date.now(),
        provider: provider
      });
      
      if (response.data.success) {
        console.log(`✅ Success with ${response.data.provider}`);
        console.log(`- Model: ${response.data.model}`);
        console.log(`- Free: ${response.data.isFree ? 'YES' : 'NO'}`);
        
        if (response.data.metadata?.attempts) {
          const attempts = response.data.metadata.attempts;
          if (attempts.length > 1) {
            console.log(`- Fallback used: YES (${attempts.length} attempts)`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed with ${provider}`);
    }
    
    console.log('');
  }
  
  console.log('=' .repeat(60) + '\n');
}

async function testResponseQuality() {
  console.log('4️⃣ Testing response quality metrics...\n');
  
  const qualityTests = [
    {
      message: 'How do I create a button?',
      checkFor: ['helpful', 'actionable', 'specific']
    },
    {
      message: 'Create a login form',
      checkFor: ['component', 'steps', 'guidance']
    },
    {
      message: 'Tutorial on variants',
      checkFor: ['tutorial', 'youtube', 'learning']
    }
  ];
  
  for (const test of qualityTests) {
    console.log(`Message: "${test.message}"`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat/message', {
        message: test.message,
        context: { test: true },
        widgetSessionId: 'test-quality-' + Date.now()
      });
      
      if (response.data.success) {
        const responseText = response.data.response.toLowerCase();
        const metadata = response.data.metadata || {};
        
        console.log('Quality checks:');
        console.log(`- Response length: ${response.data.response.length} chars`);
        console.log(`- Has actionable content: ${metadata.actionableSteps?.length > 0 ? '✅' : '❌'}`);
        console.log(`- Has suggestions: ${metadata.suggestions?.length > 0 ? '✅' : '❌'}`);
        console.log(`- Intent confidence: ${metadata.intent?.confidence || 'N/A'}`);
        
        // Check for expected content
        test.checkFor.forEach(keyword => {
          const hasKeyword = responseText.includes(keyword) || 
                           JSON.stringify(metadata).toLowerCase().includes(keyword);
          console.log(`- Contains "${keyword}": ${hasKeyword ? '✅' : '❌'}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Quality test failed:', error.message);
    }
    
    console.log('\n' + '-'.repeat(40) + '\n');
  }
  
  console.log('=' .repeat(60) + '\n');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 FigBud AI Validation Test Suite\n');
  console.log('Prerequisites:');
  console.log('- Server running on port 3000');
  console.log('- AI providers configured');
  console.log('\n');
  
  // Check if server is running
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running\n');
  } catch {
    console.error('❌ Server is not running. Start with: npm run server:dev');
    return;
  }
  
  try {
    await testAIResponseValidation();
    await testRetryLogic();
    await testProviderFallback();
    await testResponseQuality();
    
    console.log('✅ All AI validation tests completed!\n');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAIResponseValidation,
  testRetryLogic,
  testProviderFallback,
  testResponseQuality
};
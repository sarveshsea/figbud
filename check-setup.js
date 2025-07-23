#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 FigBud Setup Checker\n');

// Check environment variables
console.log('1. Checking Environment Variables...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasOpenRouter = envContent.includes('OPENROUTER_API_KEY');
  const hasDeepSeek = envContent.includes('DEEPSEEK_API_KEY');
  const hasYouTube = envContent.includes('YOUTUBE_API_KEY');
  
  console.log(`   ${hasOpenRouter ? '✅' : '❌'} OPENROUTER_API_KEY ${hasOpenRouter ? 'configured' : 'missing (REQUIRED for AI chat)'}`);
  console.log(`   ${hasDeepSeek ? '✅' : '⚠️'} DEEPSEEK_API_KEY ${hasDeepSeek ? 'configured' : 'missing (optional)'}`);
  console.log(`   ${hasYouTube ? '✅' : '⚠️'} YOUTUBE_API_KEY ${hasYouTube ? 'configured' : 'missing (optional)'}`);
} else {
  console.log('❌ .env file not found!');
  console.log('   Run: cp .env.example .env');
  console.log('   Then add your API keys');
}

// Check if server can run
console.log('\n2. Checking Server Dependencies...');
try {
  require('express');
  require('cors');
  require('dotenv');
  console.log('✅ All server dependencies installed');
} catch (e) {
  console.log('❌ Missing dependencies. Run: npm install');
}

// Check server health
console.log('\n3. Checking Server Status...');
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Server is running!');
    console.log(`   Status: ${data.status}`);
    console.log('   AI chat should work!');
    testAIEndpoint();
  })
  .catch(() => {
    console.log('❌ Server is NOT running');
    console.log('   Run: npm run server');
    console.log('   Without the server, only basic fallback responses will work');
  });

// Test AI endpoint
async function testAIEndpoint() {
  console.log('\n4. Testing AI Chat Endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        context: { source: 'setup-check' }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI endpoint working!');
      if (data.text) {
        const aiResponse = JSON.parse(data.text);
        console.log(`   AI responded: "${aiResponse.message?.substring(0, 50)}..."`);
      }
    } else {
      console.log(`⚠️  AI endpoint returned ${response.status}`);
    }
  } catch (e) {
    console.log('❌ Could not test AI endpoint');
  }
}

console.log('\n📝 Summary:');
console.log('For AI chat to work, you need:');
console.log('1. A valid OPENROUTER_API_KEY in .env file');
console.log('2. The server running (npm run server)');
console.log('3. The Figma plugin loaded in Figma');
console.log('\nWithout these, FigBud will use basic pattern matching instead of AI.');
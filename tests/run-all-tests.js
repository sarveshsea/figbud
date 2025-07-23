#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running FigBud Complete Test Suite\n');
console.log('This will test all enhanced features:\n');
console.log('1. YouTube timestamp extraction');
console.log('2. AI response validation');
console.log('3. Figma channel prioritization');
console.log('4. Supabase caching');
console.log('5. Chat integration\n');

// Test files in order
const testFiles = [
  'test-youtube-timestamps.js',
  'test-ai-validation.js',
  'test-chat-sessions.js'
];

let allPassed = true;

// Run each test file
for (const testFile of testFiles) {
  console.log('=' .repeat(60));
  console.log(`Running: ${testFile}`);
  console.log('=' .repeat(60) + '\n');
  
  try {
    execSync(`node ${path.join(__dirname, testFile)}`, {
      stdio: 'inherit',
      env: process.env
    });
    console.log(`\n✅ ${testFile} completed successfully\n`);
  } catch (error) {
    console.error(`\n❌ ${testFile} failed\n`);
    allPassed = false;
  }
}

// Summary
console.log('\n' + '=' .repeat(60));
console.log('TEST SUITE SUMMARY');
console.log('=' .repeat(60) + '\n');

if (allPassed) {
  console.log('✅ All tests passed!');
  console.log('\nYour FigBud enhancements are working correctly:');
  console.log('- YouTube API integration with timestamps ✅');
  console.log('- AI response validation and retry logic ✅');
  console.log('- Figma channel prioritization ✅');
  console.log('- Supabase caching for performance ✅');
  console.log('- Complete chat integration ✅');
} else {
  console.log('❌ Some tests failed');
  console.log('\nPlease check the error messages above and ensure:');
  console.log('1. All environment variables are set in .env');
  console.log('2. The server is running (npm run server:dev)');
  console.log('3. Supabase tables are created');
  console.log('4. API keys are valid');
  process.exit(1);
}

console.log('\n🎉 Testing complete!');
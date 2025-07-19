// Plugin verification script
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying FigBud Plugin Setup...\n');

// Check required files
const requiredFiles = [
  'manifest.json',
  'code.js',
  'ui.html',
  'dist/code.js',
  'dist/ui.html',
  'dist/ui.js',
  '.env.example'
];

const errors = [];
const warnings = [];

// Check files exist
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`❌ Missing required file: ${file}`);
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

// Check manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  
  if (manifest.main !== 'code.js') {
    errors.push('❌ manifest.json: main should be "code.js"');
  }
  
  if (manifest.ui !== 'ui.html') {
    errors.push('❌ manifest.json: ui should be "ui.html"');
  }
  
  if (!manifest.networkAccess || manifest.networkAccess.allowedDomains[0] !== '*') {
    warnings.push('⚠️  manifest.json: networkAccess should allow all domains for API calls');
  }
  
  console.log('✅ manifest.json is valid');
} catch (error) {
  errors.push(`❌ Error reading manifest.json: ${error.message}`);
}

// Check .env file
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  warnings.push('⚠️  No .env file found. Copy .env.example to .env and add your API keys');
}

// Check node_modules
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  errors.push('❌ node_modules not found. Run "npm install"');
}

// Summary
console.log('\n📊 Summary:');
console.log(`✅ Files checked: ${requiredFiles.length}`);

if (errors.length > 0) {
  console.log(`\n❌ Errors (${errors.length}):`);
  errors.forEach(error => console.log(`   ${error}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  warnings.forEach(warning => console.log(`   ${warning}`));
}

if (errors.length === 0) {
  console.log('\n🎉 Plugin is ready to import into Figma!');
  console.log('\nNext steps:');
  console.log('1. Open Figma Desktop');
  console.log('2. Go to Plugins → Development → Import plugin from manifest');
  console.log('3. Select manifest.json from this directory');
  console.log('4. Start the backend server: npm run server:dev');
} else {
  console.log('\n❌ Please fix the errors above before importing the plugin');
  process.exit(1);
}

// Check if backend server dependencies are configured
console.log('\n🔧 Backend Configuration:');
try {
  const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  if (envExample.includes('OPENAI_API_KEY')) {
    console.log('✅ AI providers configured in .env.example');
  }
  if (envExample.includes('SUPABASE_URL')) {
    console.log('✅ Database options configured in .env.example');
  }
} catch (error) {
  console.log('⚠️  Could not check .env.example');
}
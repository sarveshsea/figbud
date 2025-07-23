const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building FigBud Figma plugin...');

// Step 1: Clean dist directory
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Step 2: Build UI with webpack
console.log('📦 Building UI with webpack...');
try {
  execSync('npm run build:ui', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to build UI:', error);
  process.exit(1);
}

// Step 3: Build code with webpack
console.log('📦 Building plugin code...');
try {
  execSync('npm run build:code', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to build code:', error);
  process.exit(1);
}

// Step 4: Read the generated files
console.log('📄 Reading generated files...');
const uiHtmlPath = path.join(distDir, 'ui.html');
const codeJsPath = path.join(distDir, 'code.js');

if (!fs.existsSync(uiHtmlPath)) {
  console.error('❌ ui.html not found in dist directory');
  process.exit(1);
}

if (!fs.existsSync(codeJsPath)) {
  console.error('❌ code.js not found in dist directory');
  process.exit(1);
}

const htmlContent = fs.readFileSync(uiHtmlPath, 'utf8');
const codeContent = fs.readFileSync(codeJsPath, 'utf8');

// Step 5: Copy files to root directory
console.log('📋 Copying files to root...');
fs.copyFileSync(codeJsPath, path.join(__dirname, '../code.js'));
fs.copyFileSync(uiHtmlPath, path.join(__dirname, '../ui.html'));

// Step 7: Copy manifest.json to root if it exists
const manifestSrc = path.join(__dirname, '../src/manifest.json');
const manifestDest = path.join(__dirname, '../manifest.json');
if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDest)) {
  fs.copyFileSync(manifestSrc, manifestDest);
}

console.log('✅ Build complete! Your plugin is ready in the root directory:');
console.log('   📁 code.js');
console.log('   📁 ui.html');
console.log('   📁 manifest.json');
console.log('');
console.log('🎯 Next steps:');
console.log('   1. Open Figma');
console.log('   2. Go to Plugins → Development → Import plugin from manifest');
console.log('   3. Select the manifest.json file in this directory');
console.log('   4. Run your plugin!');
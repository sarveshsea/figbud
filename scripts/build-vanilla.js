const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building FigBud Vanilla JS version...');

// First, build with webpack
console.log('📦 Running webpack build...');
execSync('npm run build:vanilla', { stdio: 'inherit' });

// Read the built code.js
const codeJsPath = path.join(__dirname, '..', 'dist', 'code.js');
const codeJs = fs.readFileSync(codeJsPath, 'utf8');

// Extract the HTML content from the webpack output
// The html-loader will have converted the HTML to a module export
const htmlMatch = codeJs.match(/export default "(.*?)"/s);
if (!htmlMatch) {
  console.error('❌ Could not find HTML content in built code.js');
  process.exit(1);
}

// Decode the HTML (html-loader escapes it)
let html = htmlMatch[1]
  .replace(/\\n/g, '\n')
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, '\\');

// Create the final code.js with inline HTML
const finalCode = `// FigBud Vanilla JS Plugin
const __html__ = \`${html}\`;

${codeJs.replace(/import.*?from.*?;/g, '').replace(/export default.*?;/s, '')}`;

// Write the final code.js
fs.writeFileSync(codeJsPath, finalCode);

console.log('✅ Build complete!');
console.log('📁 Output: dist/code.js');
console.log('🎯 Ready to load in Figma!');
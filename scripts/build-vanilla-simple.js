const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building FigBud Vanilla JS version (simple approach)...');

// Step 1: Compile TypeScript
console.log('📦 Compiling TypeScript...');
execSync('npx tsc --project tsconfig.vanilla.json', { stdio: 'inherit' });

// Step 2: Read the HTML
const htmlPath = path.join(__dirname, '..', 'src', 'ui-vanilla.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Step 3: Read the compiled JS
const compiledJsPath = path.join(__dirname, '..', 'dist', 'code-vanilla.js');
let compiledJs = fs.readFileSync(compiledJsPath, 'utf8');

// Step 4: Remove the import statement and exports
compiledJs = compiledJs
  .replace(/^"use strict";\s*/, '')
  .replace(/Object\.defineProperty\(exports.*?\);\s*/, '')
  .replace(/const.*?require\(.*?\);\s*/g, '')
  .replace(/exports\..*?=.*?;\s*/g, '');

// Step 5: Create the final code.js WITHOUT declaring __html__ (Figma provides it)
const finalCode = `// FigBud Vanilla JS Plugin
${compiledJs}`;

// Step 6: Write the final code.js to both dist and root
const distPath = path.join(__dirname, '..', 'dist', 'code.js');
const rootPath = path.join(__dirname, '..', 'code.js');
fs.writeFileSync(distPath, finalCode);
fs.writeFileSync(rootPath, finalCode);

console.log('✅ Build complete!');
console.log('📁 Output: code.js (root) and dist/code.js');
console.log('🎯 Ready to load in Figma!');

// Optional: Show file size
const stats = fs.statSync(rootPath);
console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)}KB`);
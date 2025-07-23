const fs = require('fs');
const path = require('path');

// Read the generated files
const htmlPath = path.join(__dirname, '..', 'ui.html');
const jsPath = path.join(__dirname, '..', 'ui.js');

try {
  // Read the HTML and JS files
  let html = fs.readFileSync(htmlPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');
  
  // Find the script tag and replace it with inline script
  html = html.replace(
    /<script[^>]*src="ui\.js"[^>]*><\/script>/,
    `<script>${js}</script>`
  );
  
  // Write the updated HTML back
  fs.writeFileSync(htmlPath, html);
  
  console.log('✅ Successfully inlined ui.js into ui.html');
  console.log(`📦 HTML size: ${(html.length / 1024).toFixed(2)}KB`);
  
  // Optional: Remove the ui.js file since it's now inlined
  // fs.unlinkSync(jsPath);
  
} catch (error) {
  console.error('❌ Error inlining JavaScript:', error);
  process.exit(1);
}
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Figma plugin with data URI approach...');

try {
  // Read files
  const htmlTemplate = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.html'), 'utf8');
  const jsContent = fs.readFileSync(path.join(__dirname, '..', 'ui.js'), 'utf8');
  
  // Convert JS to base64 data URI
  const jsBase64 = Buffer.from(jsContent).toString('base64');
  const jsDataUri = `data:text/javascript;base64,${jsBase64}`;
  
  // Create HTML with data URI script
  const finalHtml = htmlTemplate.replace(
    '</body>',
    `<script src="${jsDataUri}"></script></body>`
  );
  
  // Write the final HTML
  fs.writeFileSync(path.join(__dirname, '..', 'ui-datauri.html'), finalHtml);
  
  console.log('✅ Created ui-datauri.html');
  console.log(`📊 Size: ${(finalHtml.length / 1024).toFixed(2)}KB`);
  
} catch (error) {
  console.error('❌ Error:', error);
}
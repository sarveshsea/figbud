// Since direct database connection is having issues, let's create a script 
// that opens the Supabase dashboard with the SQL ready to paste

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 FigBud Supabase Setup\n');

// Generate the complete SQL
const sql = fs.readFileSync(path.join(__dirname, 'supabase-complete-setup.sql'), 'utf8');

// Create a temporary HTML file with the SQL and instructions
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>FigBud Supabase Setup</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .step { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
    .sql-box { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 14px; }
    button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
    button:hover { background: #0056b3; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 FigBud Supabase Setup</h1>
    
    <div class="step">
      <h2>Step 1: Copy the SQL</h2>
      <p>Click the button below to copy all the SQL commands:</p>
      <button onclick="copySQL()">📋 Copy SQL to Clipboard</button>
      <span id="copyStatus"></span>
    </div>
    
    <div class="step">
      <h2>Step 2: Open Supabase SQL Editor</h2>
      <p>Click this link to open your Supabase SQL Editor:</p>
      <a href="https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new" target="_blank">
        <button>🔗 Open Supabase SQL Editor</button>
      </a>
    </div>
    
    <div class="step">
      <h2>Step 3: Paste and Run</h2>
      <ol>
        <li>Paste the SQL in the editor (Cmd+V or Ctrl+V)</li>
        <li>Click "Run" or press Cmd+Enter</li>
        <li>You should see "Success" messages</li>
      </ol>
    </div>
    
    <div class="step">
      <h2>What This Creates:</h2>
      <ul>
        <li>✅ 6 tables: users, chat_sessions, chat_conversations, chat_messages, intent_analysis, figma_components</li>
        <li>✅ Stored functions for session management</li>
        <li>✅ Row Level Security policies</li>
        <li>✅ Sample data for testing</li>
      </ul>
    </div>
    
    <details>
      <summary><h3>View SQL Commands</h3></summary>
      <div class="sql-box">
        <pre id="sqlContent">${sql.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>
    </details>
  </div>
  
  <script>
    function copySQL() {
      const sql = \`${sql.replace(/`/g, '\\`')}\`;
      navigator.clipboard.writeText(sql).then(() => {
        document.getElementById('copyStatus').innerHTML = ' <span class="success">✅ Copied!</span>';
        setTimeout(() => {
          document.getElementById('copyStatus').innerHTML = '';
        }, 3000);
      }).catch(err => {
        document.getElementById('copyStatus').innerHTML = ' <span class="warning">⚠️ Please select and copy manually</span>';
      });
    }
  </script>
</body>
</html>
`;

// Write HTML file
const htmlPath = path.join(__dirname, 'supabase-setup.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('✅ Setup page created!\n');
console.log('Opening setup page in your browser...\n');

// Open in browser
const openCommand = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';

exec(`${openCommand} ${htmlPath}`, (error) => {
  if (error) {
    console.log('Could not open browser automatically.\n');
    console.log('Please open this file manually:');
    console.log(htmlPath);
  }
});

console.log('📝 Instructions:');
console.log('1. The setup page will open in your browser');
console.log('2. Copy the SQL using the button');
console.log('3. Click to open Supabase SQL Editor');
console.log('4. Paste and run the SQL');
console.log('\nThis will create all necessary tables for FigBud!');
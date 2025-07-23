const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const sql = fs.readFileSync(path.join(__dirname, 'supabase-complete-setup.sql'), 'utf8');

// Copy to clipboard based on OS
const copyToClipboard = (text) => {
  const platform = process.platform;
  
  let command;
  if (platform === 'darwin') {
    command = 'pbcopy';
  } else if (platform === 'win32') {
    command = 'clip';
  } else {
    command = 'xclip -selection clipboard';
  }
  
  const proc = exec(command);
  proc.stdin.write(text);
  proc.stdin.end();
  
  return new Promise((resolve, reject) => {
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Copy command failed with code ${code}`));
      }
    });
  });
};

console.log('🚀 FigBud Supabase Setup\n');
console.log('Copying SQL to your clipboard...');

copyToClipboard(sql)
  .then(() => {
    console.log('✅ SQL copied to clipboard!\n');
    console.log('📝 Now follow these steps:\n');
    console.log('1. Open this link in your browser:');
    console.log('   https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new\n');
    console.log('2. Paste the SQL (Cmd+V or Ctrl+V)');
    console.log('3. Click "Run" or press Cmd+Enter\n');
    console.log('This will create:');
    console.log('   ✅ 6 tables for chat data');
    console.log('   ✅ Functions for session management');
    console.log('   ✅ Indexes for performance');
    console.log('   ✅ RLS policies for security');
    console.log('   ✅ Sample data for testing\n');
    
    // Open the URL
    const openCommand = process.platform === 'darwin' ? 'open' : 
                       process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${openCommand} https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new`);
    
    console.log('🌐 Opening Supabase SQL Editor in your browser...');
  })
  .catch((error) => {
    console.error('❌ Could not copy to clipboard:', error.message);
    console.log('\nPlease copy the SQL manually from:');
    console.log(path.join(__dirname, 'supabase-complete-setup.sql'));
  });
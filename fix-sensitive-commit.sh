#!/bin/bash

echo "🔒 Fixing sensitive data in git history..."
echo "This will rewrite the commit that introduced the hardcoded keys."
echo ""

# Create a clean version of the file
cat > scripts/setup-supabase-clean.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Load from environment variables - NEVER hardcode keys!
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables!');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file');
  process.exit(1);
}

// Use service role for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey);
EOF

# Use filter-branch to replace the file content in history
export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch -f --tree-filter '
  if [ -f scripts/setup-supabase.js ]; then
    # Get the current content after line 15 (preserving the rest of the file)
    tail -n +16 scripts/setup-supabase.js > scripts/setup-supabase-rest.tmp 2>/dev/null || true
    
    # Combine clean header with rest of file
    cat scripts/setup-supabase-clean.js > scripts/setup-supabase.js
    if [ -f scripts/setup-supabase-rest.tmp ]; then
      cat scripts/setup-supabase-rest.tmp >> scripts/setup-supabase.js
    fi
    
    rm -f scripts/setup-supabase-rest.tmp
  fi
' -- --all

# Clean up
rm -f scripts/setup-supabase-clean.js
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d
git gc --prune=now

echo "✅ History cleaned!"
echo ""
echo "⚠️  CRITICAL NEXT STEPS:"
echo "1. Force push to GitHub: git push --force origin main"
echo "2. Go to your Supabase dashboard NOW and regenerate all keys"
echo "3. Update your .env file with the new keys"
echo "4. Notify any team members to re-clone the repository"
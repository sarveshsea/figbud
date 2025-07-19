#!/bin/bash

echo "⚠️  WARNING: This will rewrite git history!"
echo "Make sure you have a backup of your repository."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "🔧 Cleaning sensitive data from git history..."

# Use git filter-branch to remove sensitive data from the file
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch scripts/setup-supabase.js' \
--prune-empty --tag-name-filter cat -- --all

# Clean up the backup refs
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d

# Force garbage collection
git gc --prune=now --aggressive

echo "✅ Git history cleaned!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Review the changes with 'git log'"
echo "2. Force push to remote: git push --force --all"
echo "3. Notify team members to re-clone the repository"
echo "4. IMMEDIATELY rotate your Supabase keys in the dashboard!"
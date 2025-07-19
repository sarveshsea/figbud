# Quick Supabase Setup Instructions

## Step 1: Access Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Log in to your account
3. Select your project: `faummrgmlwhfehylhfvx`
4. Click on "SQL Editor" in the left sidebar

## Step 2: Run the Setup Script

1. Click "New Query" button
2. Copy ALL contents from the file `supabase-setup.sql`
3. Paste into the SQL editor
4. Click "Run" button

## Step 3: Verify Tables Were Created

After running the script, you should see:
- Navigate to "Table Editor" in sidebar
- You should now see 7 tables:
  - users
  - once_ui_components
  - api_calls
  - api_cache
  - component_usage
  - tutorials
  - subscriptions

## Step 4: Check Sample Data

1. Click on "once_ui_components" table
2. You should see 5 components (Button, Card, Input, Badge, Flex)
3. Click on "tutorials" table
4. You should see 3 sample tutorials

## Troubleshooting

If you get errors:
1. Make sure you're logged in as the project owner
2. If "uuid-ossp" extension error appears, it might already be enabled
3. If tables already exist, you might see "already exists" errors - this is OK

## Alternative: Using pgAdmin or CLI

If the web interface doesn't work, you can connect using:
- Host: `db.faummrgmlwhfehylhfvx.supabase.co`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: `zFk7NhKVkMwy1e6r`

Then run the SQL script through your preferred tool.
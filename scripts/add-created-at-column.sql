-- Fix for missing created_at column in chat_sessions table
-- Run this in your Supabase SQL editor

-- Add created_at column if it doesn't exist
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_sessions(created_at);

-- Update any existing rows that might have NULL created_at
UPDATE chat_sessions 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
AND column_name = 'created_at';
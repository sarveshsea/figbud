-- Reset FigBud Supabase Schema
-- ⚠️  WARNING: This will DROP all existing tables and recreate them
-- All data will be lost!

-- Drop existing tables
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS components_created CASCADE;
DROP TABLE IF EXISTS api_cache CASCADE;
DROP TABLE IF EXISTS api_calls CASCADE;
DROP MATERIALIZED VIEW IF EXISTS component_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS refresh_component_stats();
DROP FUNCTION IF EXISTS get_component_stats();

-- Now run the main schema from supabase-schema.sql
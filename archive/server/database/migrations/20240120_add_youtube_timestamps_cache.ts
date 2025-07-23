import { Migration } from '../types';

export const migration: Migration = {
  version: 20240120,
  name: 'add_youtube_timestamps_cache',
  up: async (db) => {
    // Create youtube_timestamps table
    await db.query(`
      CREATE TABLE IF NOT EXISTS youtube_timestamps (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL UNIQUE,
        video_title TEXT,
        channel_name TEXT,
        timestamps JSONB DEFAULT '[]',
        extraction_method VARCHAR(50), -- 'description', 'ai_generated', 'manual'
        extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 1,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_youtube_timestamps_video_id ON youtube_timestamps(video_id);
      CREATE INDEX IF NOT EXISTS idx_youtube_timestamps_access ON youtube_timestamps(last_accessed);
    `);

    // Create update trigger for updated_at
    await db.query(`
      CREATE OR REPLACE FUNCTION update_youtube_timestamps_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_youtube_timestamps_updated_at
      BEFORE UPDATE ON youtube_timestamps
      FOR EACH ROW
      EXECUTE FUNCTION update_youtube_timestamps_updated_at();
    `);

    // Create function to get or cache timestamps
    await db.query(`
      CREATE OR REPLACE FUNCTION get_or_cache_youtube_timestamps(
        p_video_id VARCHAR(255),
        p_video_title TEXT DEFAULT NULL,
        p_channel_name TEXT DEFAULT NULL,
        p_timestamps JSONB DEFAULT NULL,
        p_extraction_method VARCHAR(50) DEFAULT 'description'
      ) RETURNS JSONB AS $$
      DECLARE
        v_result RECORD;
      BEGIN
        -- Try to get existing timestamps
        SELECT * INTO v_result
        FROM youtube_timestamps
        WHERE video_id = p_video_id;
        
        IF FOUND THEN
          -- Update access info
          UPDATE youtube_timestamps
          SET last_accessed = CURRENT_TIMESTAMP,
              access_count = access_count + 1
          WHERE video_id = p_video_id;
          
          RETURN v_result.timestamps;
        ELSE
          -- Insert new timestamps if provided
          IF p_timestamps IS NOT NULL THEN
            INSERT INTO youtube_timestamps (
              video_id, video_title, channel_name, 
              timestamps, extraction_method
            ) VALUES (
              p_video_id, p_video_title, p_channel_name,
              p_timestamps, p_extraction_method
            );
            RETURN p_timestamps;
          ELSE
            RETURN '[]'::JSONB;
          END IF;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Add RLS policies
    await db.query(`
      ALTER TABLE youtube_timestamps ENABLE ROW LEVEL SECURITY;
      
      -- Allow all users to read timestamps
      CREATE POLICY "youtube_timestamps_read_all" ON youtube_timestamps
        FOR SELECT USING (true);
      
      -- Only allow service role to insert/update
      CREATE POLICY "youtube_timestamps_write_service" ON youtube_timestamps
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    `);

    console.log('✅ Created youtube_timestamps table with caching functions');
  },

  down: async (db) => {
    await db.query(`
      DROP TRIGGER IF EXISTS update_youtube_timestamps_updated_at ON youtube_timestamps;
      DROP FUNCTION IF EXISTS update_youtube_timestamps_updated_at();
      DROP FUNCTION IF EXISTS get_or_cache_youtube_timestamps(VARCHAR, TEXT, TEXT, JSONB, VARCHAR);
      DROP TABLE IF EXISTS youtube_timestamps;
    `);
  }
};
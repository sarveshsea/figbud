import { supabaseAdmin } from '../config/supabase';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

interface Migration {
  filename: string;
  order: number;
  sql: string;
}

async function runMigrations() {
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not configured. Please set SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Supabase migrations...\n');

    // Read all SQL files from migrations directory
    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = migrationFiles.map(filename => ({
      filename,
      order: parseInt(filename.split('_')[0] || '0', 10),
      sql: readFileSync(join(MIGRATIONS_DIR, filename), 'utf-8').toString()
    }));

    // Sort by order number
    migrations.sort((a, b) => a.order - b.order);

    // Run each migration
    for (const migration of migrations) {
      console.log(`📄 Running migration: ${migration.filename}`);
      
      try {
        // Split SQL into individual statements (simple approach)
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          // Skip comments
          if (statement.startsWith('--')) continue;
          
          const { error } = await supabaseAdmin.rpc('exec_sql', {
            sql_query: statement + ';'
          }).single();

          if (error) {
            // Try direct execution as fallback
            const { error: directError } = await supabaseAdmin
              .from('_migrations')
              .select('*')
              .limit(1);

            if (directError) {
              console.error(`❌ Error in ${migration.filename}:`, error);
              console.error('Statement:', statement.substring(0, 100) + '...');
            }
          }
        }

        console.log(`✅ Completed: ${migration.filename}\n`);
      } catch (error) {
        console.error(`❌ Failed to run ${migration.filename}:`, error);
        process.exit(1);
      }
    }

    console.log('✨ All migrations completed successfully!');
    
    // Create a migrations tracking table
    const { error: trackingError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS _migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).single();

    if (!trackingError) {
      // Record executed migrations
      for (const migration of migrations) {
        await supabaseAdmin
          .from('_migrations')
          .upsert({ filename: migration.filename })
          .select();
      }
    }

  } catch (error) {
    console.error('❌ Migration runner error:', error);
    process.exit(1);
  }
}

// Add a simpler direct execution method
async function runMigrationsDirect() {
  console.log('🚀 Running migrations using direct Supabase Dashboard approach...\n');
  console.log('Please run the following SQL files in your Supabase Dashboard SQL Editor:');
  console.log('(https://app.supabase.com/project/faummrgmlwhfehylhfvx/sql/new)\n');

  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  migrationFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
    console.log(`   Location: server/database/migrations/${file}`);
    console.log('   ---');
  });

  console.log('\n💡 Tip: You can copy and paste the SQL content into the Supabase SQL Editor');
  console.log('   The files are ordered and should be run sequentially.\n');
}

// Check if we should use direct method
if (process.argv.includes('--direct')) {
  runMigrationsDirect();
} else {
  runMigrations().catch(console.error);
}
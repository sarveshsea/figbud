import { config } from 'dotenv';
import { Database } from './database';
import { FileDatabase } from '../database/fileDatabase';
import { PostgresDatabase } from '../database/postgresDatabase';
import { SupabaseDatabase } from '../database/supabaseDatabase';
import { initializeDatabase as initPostgres } from '../database/postgres';

config();

// Check if PostgreSQL is configured
const isPostgresConfigured = () => {
  return !!(process.env.DATABASE_URL || 
    (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER));
};

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
};

// Database interface that both implementations follow
export interface DatabaseInterface {
  // User operations
  findUserById(id: string): Promise<any>;
  findUserByEmail(email: string): Promise<any>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, updates: any): Promise<any>;
  deleteUser(id: string): Promise<boolean>;
  
  // Session operations
  createSession(session: any): Promise<any>;
  findSessionByToken(token: string): Promise<any>;
  deleteSession(token: string): Promise<boolean>;
  cleanExpiredSessions(): void | Promise<void>;
  
  // Tutorial operations
  cacheTutorial(tutorial: any): Promise<any>;
  findCachedTutorials(query: string): Promise<any[]>;
  
  // Template operations
  findTemplatesByCategory(category: string): Promise<any[]>;
  incrementTemplateUsage(id: string): void | Promise<void>;
}

// Export the appropriate database based on configuration
export let DB: DatabaseInterface;

export const initializeDatabase = async () => {
  if (isSupabaseConfigured()) {
    console.log('Using Supabase database');
    try {
      DB = SupabaseDatabase;
      // Test connection
      const { supabase } = await import('../config/supabase');
      const { error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to initialize Supabase, falling back to PostgreSQL:', error);
      if (isPostgresConfigured()) {
        try {
          await initPostgres();
          DB = PostgresDatabase;
        } catch (pgError) {
          console.error('Failed to initialize PostgreSQL, falling back to file-based database:', pgError);
          DB = FileDatabase;
        }
      } else {
        DB = FileDatabase;
      }
    }
  } else if (isPostgresConfigured()) {
    console.log('Using PostgreSQL database');
    try {
      await initPostgres();
      DB = PostgresDatabase;
    } catch (error) {
      console.error('Failed to initialize PostgreSQL, falling back to file-based database:', error);
      DB = FileDatabase;
    }
  } else {
    console.log('Using file-based database (configure SUPABASE_URL for Supabase or DATABASE_URL for PostgreSQL)');
    DB = FileDatabase;
  }
};

// For backward compatibility, export Database methods through DB proxy
export const DatabaseConfig = {
  readUsers: () => DB === FileDatabase ? (Database as any).readUsers() : [],
  writeUsers: (users: any[]) => DB === FileDatabase ? (Database as any).writeUsers(users) : null,
  readSessions: () => DB === FileDatabase ? (Database as any).readSessions() : [],
  writeSessions: (sessions: any[]) => DB === FileDatabase ? (Database as any).writeSessions(sessions) : null,
  readTutorials: () => DB === FileDatabase ? (Database as any).readTutorials() : [],
  writeTutorials: (tutorials: any[]) => DB === FileDatabase ? (Database as any).writeTutorials(tutorials) : null,
  readTemplates: () => DB === FileDatabase ? (Database as any).readTemplates() : [],
  writeTemplates: (templates: any[]) => DB === FileDatabase ? (Database as any).writeTemplates(templates) : null,
};
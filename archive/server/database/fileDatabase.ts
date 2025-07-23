import { Database } from '../config/database';
import { User, Session, Tutorial, DemoTemplate } from '../models/User';

// Async wrapper for the file-based database
export class FileDatabase {
  // User operations
  static async findUserById(id: string): Promise<User | null> {
    return Database.findUserById(id);
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    return Database.findUserByEmail(email);
  }

  static async createUser(user: User): Promise<User> {
    return Database.createUser(user);
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return Database.updateUser(id, updates);
  }

  static async deleteUser(id: string): Promise<boolean> {
    return Database.deleteUser(id);
  }

  // Session operations
  static async createSession(session: Session): Promise<Session> {
    return Database.createSession(session);
  }

  static async findSessionByToken(token: string): Promise<Session | null> {
    return Database.findSessionByToken(token);
  }

  static async deleteSession(token: string): Promise<boolean> {
    return Database.deleteSession(token);
  }

  static async cleanExpiredSessions(): Promise<void> {
    Database.cleanExpiredSessions();
  }

  // Tutorial operations
  static async cacheTutorial(tutorial: Tutorial): Promise<Tutorial> {
    return Database.cacheTutorial(tutorial);
  }

  static async findCachedTutorials(query: string): Promise<Tutorial[]> {
    return Database.findCachedTutorials(query);
  }

  // Template operations
  static async findTemplatesByCategory(category: string): Promise<DemoTemplate[]> {
    return Database.findTemplatesByCategory(category);
  }

  static async incrementTemplateUsage(id: string): Promise<void> {
    Database.incrementTemplateUsage(id);
  }
}
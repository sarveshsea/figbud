import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { User, Session, Tutorial, DemoTemplate } from '../models/User';

const DATA_DIR = join(__dirname, '../../data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');
const TUTORIALS_FILE = join(DATA_DIR, 'tutorials.json');
const TEMPLATES_FILE = join(DATA_DIR, 'templates.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  require('fs').mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty files if they don't exist
const initializeFile = (filePath: string, defaultData: any = []) => {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initializeFile(USERS_FILE);
initializeFile(SESSIONS_FILE);
initializeFile(TUTORIALS_FILE);
initializeFile(TEMPLATES_FILE);

// Simple file-based database operations
export class Database {
  static readUsers(): User[] {
    try {
      const data = readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        analytics: {
          ...user.analytics,
          lastActiveAt: new Date(user.analytics.lastActiveAt),
        },
      }));
    } catch {
      return [];
    }
  }

  static writeUsers(users: User[]): void {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }

  static findUserById(id: string): User | null {
    const users = this.readUsers();
    return users.find(user => user.id === id) || null;
  }

  static findUserByEmail(email: string): User | null {
    const users = this.readUsers();
    return users.find(user => user.email === email) || null;
  }

  static createUser(user: User): User {
    const users = this.readUsers();
    users.push(user);
    this.writeUsers(users);
    return user;
  }

  static updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.readUsers();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates, updatedAt: new Date() } as User;
    this.writeUsers(users);
    return users[index] || null;
  }

  static deleteUser(id: string): boolean {
    const users = this.readUsers();
    const filtered = users.filter(user => user.id !== id);
    if (filtered.length === users.length) return false;
    
    this.writeUsers(filtered);
    return true;
  }

  // Session operations
  static readSessions(): Session[] {
    try {
      const data = readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data).map((session: any) => ({
        ...session,
        expiresAt: new Date(session.expiresAt),
        createdAt: new Date(session.createdAt),
        lastAccessedAt: new Date(session.lastAccessedAt),
      }));
    } catch {
      return [];
    }
  }

  static writeSessions(sessions: Session[]): void {
    writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  }

  static createSession(session: Session): Session {
    const sessions = this.readSessions();
    sessions.push(session);
    this.writeSessions(sessions);
    return session;
  }

  static findSessionByToken(token: string): Session | null {
    const sessions = this.readSessions();
    return sessions.find(session => session.token === token && session.expiresAt > new Date()) || null;
  }

  static deleteSession(token: string): boolean {
    const sessions = this.readSessions();
    const filtered = sessions.filter(session => session.token !== token);
    if (filtered.length === sessions.length) return false;
    
    this.writeSessions(filtered);
    return true;
  }

  static cleanExpiredSessions(): void {
    const sessions = this.readSessions();
    const active = sessions.filter(session => session.expiresAt > new Date());
    this.writeSessions(active);
  }

  // Tutorial cache operations
  static readTutorials(): Tutorial[] {
    try {
      const data = readFileSync(TUTORIALS_FILE, 'utf-8');
      return JSON.parse(data).map((tutorial: any) => ({
        ...tutorial,
        publishedAt: new Date(tutorial.publishedAt),
        cacheExpiry: new Date(tutorial.cacheExpiry),
      }));
    } catch {
      return [];
    }
  }

  static writeTutorials(tutorials: Tutorial[]): void {
    writeFileSync(TUTORIALS_FILE, JSON.stringify(tutorials, null, 2));
  }

  static cacheTutorial(tutorial: Tutorial): Tutorial {
    const tutorials = this.readTutorials();
    const index = tutorials.findIndex(t => t.videoId === tutorial.videoId);
    
    if (index >= 0) {
      tutorials[index] = tutorial;
    } else {
      tutorials.push(tutorial);
    }
    
    this.writeTutorials(tutorials);
    return tutorial;
  }

  static findCachedTutorials(query: string): Tutorial[] {
    const tutorials = this.readTutorials();
    const now = new Date();
    
    return tutorials.filter(tutorial => 
      tutorial.cacheExpiry > now &&
      (tutorial.title.toLowerCase().includes(query.toLowerCase()) ||
       tutorial.description.toLowerCase().includes(query.toLowerCase()) ||
       tutorial.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
    );
  }

  // Demo template operations
  static readTemplates(): DemoTemplate[] {
    try {
      const data = readFileSync(TEMPLATES_FILE, 'utf-8');
      return JSON.parse(data).map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt),
      }));
    } catch {
      return [];
    }
  }

  static writeTemplates(templates: DemoTemplate[]): void {
    writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
  }

  static findTemplatesByCategory(category: string): DemoTemplate[] {
    const templates = this.readTemplates();
    return templates.filter(template => template.category === category);
  }

  static incrementTemplateUsage(id: string): void {
    const templates = this.readTemplates();
    const index = templates.findIndex(template => template.id === id);
    
    if (index >= 0 && templates[index]) {
      templates[index]!.usageCount += 1;
      templates[index]!.updatedAt = new Date();
      this.writeTemplates(templates);
    }
  }
}
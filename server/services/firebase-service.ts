import { config } from 'dotenv';

config();

// Mock Firebase types when firebase-admin is not installed
type App = any;
type Firestore = any;
type FieldValue = any;

let initializeApp: any;
let cert: any;
let getFirestore: any;
let FieldValueModule: any;

// Try to import firebase-admin if available
try {
  const firebaseApp = require('firebase-admin/app');
  const firebaseFirestore = require('firebase-admin/firestore');
  
  initializeApp = firebaseApp.initializeApp;
  cert = firebaseApp.cert;
  getFirestore = firebaseFirestore.getFirestore;
  FieldValueModule = firebaseFirestore.FieldValue;
  
  console.log('[Firebase] firebase-admin module found');
} catch (error) {
  console.log('[Firebase] firebase-admin not installed - Firebase features disabled');
  // Create mock FieldValue
  FieldValueModule = {
    serverTimestamp: () => new Date().toISOString(),
    increment: (n: number) => n
  };
}

export interface SearchResult {
  id: string;
  type: 'tutorial' | 'component' | 'design_pattern';
  title: string;
  description: string;
  tags: string[];
  relevance: number;
  metadata?: any;
}

export class FirebaseService {
  private app: App | null = null;
  private db: Firestore | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Check if firebase-admin is available
      if (!initializeApp || !cert || !getFirestore) {
        console.log('[Firebase] firebase-admin not available - Firebase search disabled');
        return;
      }

      // Check if Firebase credentials are available
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        console.log('[Firebase] Missing credentials - Firebase search disabled');
        return;
      }

      // Initialize Firebase Admin SDK
      this.app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        })
      });

      this.db = getFirestore(this.app);
      this.initialized = true;
      console.log('[Firebase] Successfully initialized');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error);
      this.initialized = false;
    }
  }

  /**
   * Search for design patterns and learning resources
   */
  async searchResources(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!this.initialized || !this.db) {
      console.log('[Firebase] Service not initialized - returning empty results');
      return [];
    }

    try {
      const results: SearchResult[] = [];
      
      // Convert query to lowercase for case-insensitive search
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      // Search in multiple collections
      const collections = ['tutorials', 'components', 'design_patterns'];
      
      for (const collectionName of collections) {
        const collection = this.db.collection(collectionName);
        
        // Search by tags
        const tagQuery = collection
          .where('tags', 'array-contains-any', searchTerms)
          .limit(Math.floor(limit / collections.length));
        
        const snapshot = await tagQuery.get();
        
        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Calculate relevance score
          const relevance = this.calculateRelevance(query, data);
          
          results.push({
            id: doc.id,
            type: collectionName.slice(0, -1) as any, // Remove 's' from collection name
            title: data.title || '',
            description: data.description || '',
            tags: data.tags || [],
            relevance,
            metadata: data.metadata || {}
          });
        });
      }
      
      // Sort by relevance and return top results
      return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
    } catch (error) {
      console.error('[Firebase] Search error:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(query: string, data: any): number {
    const queryLower = query.toLowerCase();
    const titleLower = (data.title || '').toLowerCase();
    const descLower = (data.description || '').toLowerCase();
    const tags = (data.tags || []).map((t: string) => t.toLowerCase());
    
    let score = 0;
    
    // Title match (highest weight)
    if (titleLower.includes(queryLower)) {
      score += 10;
    }
    
    // Description match
    if (descLower.includes(queryLower)) {
      score += 5;
    }
    
    // Tag matches
    const queryWords = queryLower.split(' ');
    queryWords.forEach(word => {
      if (tags.includes(word)) {
        score += 3;
      }
    });
    
    // Partial matches
    queryWords.forEach(word => {
      if (titleLower.includes(word)) score += 2;
      if (descLower.includes(word)) score += 1;
    });
    
    return score;
  }

  /**
   * Index a new learning resource
   */
  async indexResource(resource: {
    type: 'tutorial' | 'component' | 'design_pattern';
    title: string;
    description: string;
    tags: string[];
    metadata?: any;
  }): Promise<string | null> {
    if (!this.initialized || !this.db) {
      console.log('[Firebase] Service not initialized - cannot index resource');
      return null;
    }

    try {
      const collection = this.db.collection(`${resource.type}s`);
      const docRef = await collection.add({
        ...resource,
        tags: resource.tags.map(tag => tag.toLowerCase()),
        createdAt: FieldValueModule.serverTimestamp(),
        lastUpdated: FieldValueModule.serverTimestamp()
      });
      
      console.log(`[Firebase] Indexed ${resource.type}: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('[Firebase] Index error:', error);
      return null;
    }
  }

  /**
   * Get trending searches and topics
   */
  async getTrendingTopics(limit: number = 5): Promise<string[]> {
    if (!this.initialized || !this.db) {
      return ['buttons', 'cards', 'auto layout', 'components', 'design systems'];
    }

    try {
      const searchesRef = this.db.collection('search_analytics');
      const snapshot = await searchesRef
        .orderBy('count', 'desc')
        .limit(limit)
        .get();
      
      const topics: string[] = [];
      snapshot.forEach(doc => {
        topics.push(doc.data().query);
      });
      
      return topics.length > 0 ? topics : ['buttons', 'cards', 'auto layout'];
    } catch (error) {
      console.error('[Firebase] Error fetching trending topics:', error);
      return ['buttons', 'cards', 'auto layout'];
    }
  }

  /**
   * Track search analytics
   */
  async trackSearch(query: string, resultsCount: number): Promise<void> {
    if (!this.initialized || !this.db) {
      return;
    }

    try {
      const analyticsRef = this.db.collection('search_analytics');
      const queryDoc = analyticsRef.doc(query.toLowerCase());
      
      await queryDoc.set({
        query: query.toLowerCase(),
        count: FieldValueModule.increment(1),
        lastSearched: FieldValueModule.serverTimestamp(),
        averageResults: resultsCount
      }, { merge: true });
    } catch (error) {
      console.error('[Firebase] Error tracking search:', error);
    }
  }

  /**
   * Get related/similar resources
   */
  async getRelatedResources(resourceId: string, type: string, limit: number = 3): Promise<SearchResult[]> {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      // Get the original resource
      const docRef = this.db.collection(`${type}s`).doc(resourceId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return [];
      }
      
      const data = doc.data();
      const tags = data?.tags || [];
      
      // Find resources with similar tags
      const collection = this.db.collection(`${type}s`);
      const relatedQuery = collection
        .where('tags', 'array-contains-any', tags.slice(0, 3)) // Use first 3 tags
        .limit(limit + 1); // Get one extra to exclude self
      
      const snapshot = await relatedQuery.get();
      const results: SearchResult[] = [];
      
      snapshot.forEach(relatedDoc => {
        if (relatedDoc.id !== resourceId) {
          const relatedData = relatedDoc.data();
          results.push({
            id: relatedDoc.id,
            type: type as any,
            title: relatedData.title || '',
            description: relatedData.description || '',
            tags: relatedData.tags || [],
            relevance: this.calculateTagSimilarity(tags, relatedData.tags || []),
            metadata: relatedData.metadata || {}
          });
        }
      });
      
      return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
    } catch (error) {
      console.error('[Firebase] Error getting related resources:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between tag sets
   */
  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    const set1 = new Set(tags1.map(t => t.toLowerCase()));
    const set2 = new Set(tags2.map(t => t.toLowerCase()));
    
    let commonCount = 0;
    set1.forEach(tag => {
      if (set2.has(tag)) {
        commonCount++;
      }
    });
    
    // Jaccard similarity coefficient
    const unionSize = new Set([...set1, ...set2]).size;
    return unionSize > 0 ? commonCount / unionSize : 0;
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
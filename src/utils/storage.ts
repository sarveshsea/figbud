// Storage wrapper that works in Figma plugin context
// Figma plugins can't use localStorage, so we use a memory-based fallback

class StorageWrapper {
  private memoryStorage: Map<string, string> = new Map();
  private canUseLocalStorage: boolean = false;

  constructor() {
    // Test if localStorage is available
    try {
      const testKey = '__figbud_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.canUseLocalStorage = true;
    } catch (e) {
      console.log('[FigBud] localStorage not available, using memory storage');
      this.canUseLocalStorage = false;
    }
  }

  getItem(key: string): string | null {
    if (this.canUseLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        // Fallback to memory storage
      }
    }
    return this.memoryStorage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (this.canUseLocalStorage) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        // Fallback to memory storage
      }
    }
    this.memoryStorage.set(key, value);
  }

  removeItem(key: string): void {
    if (this.canUseLocalStorage) {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        // Fallback to memory storage
      }
    }
    this.memoryStorage.delete(key);
  }

  clear(): void {
    if (this.canUseLocalStorage) {
      try {
        localStorage.clear();
        return;
      } catch (e) {
        // Fallback to memory storage
      }
    }
    this.memoryStorage.clear();
  }
}

// Export singleton instance
export const storage = new StorageWrapper();
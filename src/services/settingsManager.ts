/**
 * Settings Manager for FigBud
 * Securely manages API keys and user preferences using Figma's clientStorage
 */

export interface ApiKeys {
  openRouterKey?: string;
  deepSeekKey?: string;
  youtubeKey?: string;
  openAIKey?: string;
  assemblyAIKey?: string;
  figmaKey?: string;
}

export interface UserSettings {
  apiKeys: ApiKeys;
  aiStrategy: 'cost_optimized' | 'performance' | 'balanced';
  enableYouTube: boolean;
  enableSandbox: boolean;
  enableAIFallback: boolean;
  preferredModel?: string;
  theme?: 'light' | 'dark' | 'auto';
}

const STORAGE_KEYS = {
  API_KEYS: 'figbud_api_keys',
  SETTINGS: 'figbud_settings',
  LAST_UPDATED: 'figbud_last_updated',
} as const;

// Encryption helper (basic obfuscation for added security)
const obfuscate = (value: string): string => {
  return btoa(value.split('').reverse().join(''));
};

const deobfuscate = (value: string): string => {
  try {
    return atob(value).split('').reverse().join('');
  } catch {
    return value; // Return as-is if decoding fails
  }
};

export class SettingsManager {
  /**
   * Get a specific API key
   */
  static async getApiKey(keyName: keyof ApiKeys): Promise<string | null> {
    try {
      const keys = await this.getAllApiKeys();
      return keys[keyName] || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Set a specific API key
   */
  static async setApiKey(keyName: keyof ApiKeys, value: string): Promise<void> {
    try {
      const keys = await this.getAllApiKeys();
      keys[keyName] = value;
      
      // Obfuscate all keys before storing
      const obfuscatedKeys: ApiKeys = {};
      for (const [key, val] of Object.entries(keys)) {
        if (val) {
          obfuscatedKeys[key as keyof ApiKeys] = obfuscate(val);
        }
      }
      
      await figma.clientStorage.setAsync(STORAGE_KEYS.API_KEYS, obfuscatedKeys);
      await figma.clientStorage.setAsync(STORAGE_KEYS.LAST_UPDATED, Date.now());
    } catch (error) {
      console.error('Error setting API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  /**
   * Remove a specific API key
   */
  static async removeApiKey(keyName: keyof ApiKeys): Promise<void> {
    try {
      const keys = await this.getAllApiKeys();
      delete keys[keyName];
      
      const obfuscatedKeys: ApiKeys = {};
      for (const [key, val] of Object.entries(keys)) {
        if (val) {
          obfuscatedKeys[key as keyof ApiKeys] = obfuscate(val);
        }
      }
      
      await figma.clientStorage.setAsync(STORAGE_KEYS.API_KEYS, obfuscatedKeys);
    } catch (error) {
      console.error('Error removing API key:', error);
      throw new Error('Failed to remove API key');
    }
  }

  /**
   * Get all API keys
   */
  static async getAllApiKeys(): Promise<ApiKeys> {
    try {
      const obfuscatedKeys = await figma.clientStorage.getAsync(STORAGE_KEYS.API_KEYS) || {};
      
      // Deobfuscate all keys
      const keys: ApiKeys = {};
      for (const [key, val] of Object.entries(obfuscatedKeys)) {
        if (val && typeof val === 'string') {
          keys[key as keyof ApiKeys] = deobfuscate(val);
        }
      }
      
      return keys;
    } catch (error) {
      console.error('Error getting all API keys:', error);
      return {};
    }
  }

  /**
   * Clear all API keys
   */
  static async clearAllApiKeys(): Promise<void> {
    try {
      await figma.clientStorage.setAsync(STORAGE_KEYS.API_KEYS, {});
    } catch (error) {
      console.error('Error clearing API keys:', error);
      throw new Error('Failed to clear API keys');
    }
  }

  /**
   * Get all user settings
   */
  static async getSettings(): Promise<UserSettings> {
    try {
      const [apiKeys, settings] = await Promise.all([
        this.getAllApiKeys(),
        figma.clientStorage.getAsync(STORAGE_KEYS.SETTINGS)
      ]);

      const defaultSettings: UserSettings = {
        apiKeys,
        aiStrategy: 'cost_optimized',
        enableYouTube: true,
        enableSandbox: true,
        enableAIFallback: true,
      };

      return {
        ...defaultSettings,
        ...settings,
        apiKeys // Ensure API keys are always from the secure storage
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        apiKeys: {},
        aiStrategy: 'cost_optimized',
        enableYouTube: true,
        enableSandbox: true,
        enableAIFallback: true,
      };
    }
  }

  /**
   * Update user settings (excluding API keys)
   */
  static async updateSettings(settings: Partial<Omit<UserSettings, 'apiKeys'>>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        apiKeys: currentSettings.apiKeys // Preserve API keys
      };

      // Store settings without API keys
      const { apiKeys, ...settingsWithoutKeys } = updatedSettings;
      await figma.clientStorage.setAsync(STORAGE_KEYS.SETTINGS, settingsWithoutKeys);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Validate an API key format
   */
  static validateApiKey(keyType: keyof ApiKeys, key: string): boolean {
    const patterns: Record<keyof ApiKeys, RegExp> = {
      openRouterKey: /^sk-or-v1-[a-zA-Z0-9]{64}$/,
      deepSeekKey: /^sk-[a-zA-Z0-9]{32,}$/,
      youtubeKey: /^[a-zA-Z0-9_-]{39}$/,
      openAIKey: /^sk-[a-zA-Z0-9]{48}$/,
      assemblyAIKey: /^[a-zA-Z0-9]{32}$/,
      figmaKey: /^[a-zA-Z0-9-]{40,}$/,
    };

    const pattern = patterns[keyType];
    return pattern ? pattern.test(key) : true;
  }

  /**
   * Check if any API keys are configured
   */
  static async hasApiKeys(): Promise<boolean> {
    const keys = await this.getAllApiKeys();
    return Object.values(keys).some(key => !!key);
  }

  /**
   * Get the last updated timestamp
   */
  static async getLastUpdated(): Promise<number | null> {
    try {
      return await figma.clientStorage.getAsync(STORAGE_KEYS.LAST_UPDATED) || null;
    } catch {
      return null;
    }
  }

  /**
   * Export settings (for backup)
   */
  static async exportSettings(): Promise<string> {
    const settings = await this.getSettings();
    // Remove API keys from export for security
    const { apiKeys, ...safeSettings } = settings;
    return JSON.stringify(safeSettings, null, 2);
  }

  /**
   * Import settings (from backup)
   */
  static async importSettings(jsonString: string): Promise<void> {
    try {
      const settings = JSON.parse(jsonString);
      // Remove any API keys that might be in the import
      delete settings.apiKeys;
      await this.updateSettings(settings);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw new Error('Invalid settings format');
    }
  }
}

// Helper function to send API keys with requests
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const apiKeys = await SettingsManager.getAllApiKeys();
  const headers: Record<string, string> = {};

  if (apiKeys.openRouterKey) {
    headers['X-OpenRouter-Key'] = apiKeys.openRouterKey;
  }
  if (apiKeys.deepSeekKey) {
    headers['X-DeepSeek-Key'] = apiKeys.deepSeekKey;
  }
  if (apiKeys.youtubeKey) {
    headers['X-YouTube-Key'] = apiKeys.youtubeKey;
  }
  if (apiKeys.openAIKey) {
    headers['X-OpenAI-Key'] = apiKeys.openAIKey;
  }

  return headers;
}
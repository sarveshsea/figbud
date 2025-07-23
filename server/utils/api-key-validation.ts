/**
 * API Key Validation Utilities
 * Validates API keys for different services before use
 */

export interface APIKeyValidationResult {
  isValid: boolean;
  service: string;
  error?: string;
}

export class APIKeyValidator {
  /**
   * Validate API key format for different services
   */
  static validate(key: string, service: string): APIKeyValidationResult {
    if (!key || typeof key !== 'string') {
      return {
        isValid: false,
        service,
        error: 'API key is required and must be a string'
      };
    }

    // Remove whitespace
    const trimmedKey = key.trim();

    switch (service.toLowerCase()) {
      case 'openrouter':
        return this.validateOpenRouterKey(trimmedKey);
      
      case 'deepseek':
        return this.validateDeepSeekKey(trimmedKey);
      
      case 'youtube':
        return this.validateYouTubeKey(trimmedKey);
      
      case 'firecrawl':
        return this.validateFirecrawlKey(trimmedKey);
      
      default:
        return {
          isValid: true, // Allow unknown services
          service
        };
    }
  }

  private static validateOpenRouterKey(key: string): APIKeyValidationResult {
    // OpenRouter keys start with 'sk-or-v1-' and are 64 characters total
    const isValid = /^sk-or-v1-[a-f0-9]{56}$/.test(key);
    
    return {
      isValid,
      service: 'OpenRouter',
      error: isValid ? undefined : 'Invalid OpenRouter API key format. Expected: sk-or-v1-{56 hex characters}'
    };
  }

  private static validateDeepSeekKey(key: string): APIKeyValidationResult {
    // DeepSeek keys start with 'sk-' followed by 32 alphanumeric characters
    const isValid = /^sk-[a-f0-9]{32}$/.test(key);
    
    return {
      isValid,
      service: 'DeepSeek',
      error: isValid ? undefined : 'Invalid DeepSeek API key format. Expected: sk-{32 hex characters}'
    };
  }

  private static validateYouTubeKey(key: string): APIKeyValidationResult {
    // YouTube/Google API keys start with 'AIza' and are 39 characters total
    const isValid = /^AIza[a-zA-Z0-9_-]{35}$/.test(key);
    
    return {
      isValid,
      service: 'YouTube',
      error: isValid ? undefined : 'Invalid YouTube API key format. Expected: AIza{35 alphanumeric characters}'
    };
  }

  private static validateFirecrawlKey(key: string): APIKeyValidationResult {
    // Firecrawl keys start with 'fc-' followed by 32 characters
    const isValid = /^fc-[a-f0-9]{32}$/.test(key);
    
    return {
      isValid,
      service: 'Firecrawl',
      error: isValid ? undefined : 'Invalid Firecrawl API key format. Expected: fc-{32 hex characters}'
    };
  }

  /**
   * Extract and validate API keys from request headers
   */
  static extractAndValidateKeys(headers: Record<string, string | string[] | undefined>): {
    valid: Record<string, string>;
    invalid: Record<string, string>;
    errors: string[];
  } {
    const keyMappings = [
      { header: 'x-openrouter-key', service: 'openrouter' },
      { header: 'x-deepseek-key', service: 'deepseek' },
      { header: 'x-youtube-key', service: 'youtube' },
      { header: 'x-firecrawl-key', service: 'firecrawl' }
    ];

    const valid: Record<string, string> = {};
    const invalid: Record<string, string> = {};
    const errors: string[] = [];

    for (const { header, service } of keyMappings) {
      const value = headers[header];
      if (value && typeof value === 'string') {
        const validation = this.validate(value, service);
        
        if (validation.isValid) {
          // Store with original header format for compatibility
          valid[header.replace('x-', 'X-').replace(/-k/, '-K')] = value;
        } else {
          invalid[service] = validation.error || 'Invalid key format';
          errors.push(`${service}: ${validation.error}`);
        }
      }
    }

    return { valid, invalid, errors };
  }
}
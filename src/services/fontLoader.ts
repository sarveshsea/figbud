/**
 * Central font preloader for FigBud plugin
 * Loads all required fonts at startup to avoid runtime errors
 */

interface FontDefinition {
  family: string;
  style: string;
}

export class FontLoader {
  private static loadedFonts: Set<string> = new Set();
  
  /**
   * Get all required fonts for the plugin
   */
  private static getRequiredFonts(): FontDefinition[] {
    return [
      // Primary font - Inter
      { family: 'Inter', style: 'Regular' },
      { family: 'Inter', style: 'Medium' },
      { family: 'Inter', style: 'Bold' },
      
      // Fallback font - Roboto (usually available in Figma)
      { family: 'Roboto', style: 'Regular' },
      { family: 'Roboto', style: 'Medium' },
      { family: 'Roboto', style: 'Bold' }
    ];
  }
  
  /**
   * Preload all fonts at plugin startup
   * @returns Promise that resolves when all fonts are loaded
   */
  static async preloadAllFonts(): Promise<void> {
    console.log('[FontLoader] Starting font preload...');
    
    const fonts = this.getRequiredFonts();
    let loadedCount = 0;
    let failedCount = 0;
    
    // Load fonts sequentially to avoid overwhelming Figma
    for (const font of fonts) {
      const fontKey = `${font.family}-${font.style}`;
      
      try {
        await figma.loadFontAsync(font);
        this.loadedFonts.add(fontKey);
        loadedCount++;
        console.log(`[FontLoader] ✓ Loaded ${fontKey}`);
      } catch (error) {
        failedCount++;
        console.warn(`[FontLoader] ✗ Failed to load ${fontKey}:`, error);
      }
    }
    
    console.log(`[FontLoader] Font loading complete. Loaded: ${loadedCount}, Failed: ${failedCount}`);
    
    // Ensure at least one font is available
    if (loadedCount === 0) {
      throw new Error('[FontLoader] No fonts could be loaded. Plugin cannot continue.');
    }
  }
  
  /**
   * Check if a specific font is loaded
   */
  static isFontLoaded(family: string, style: string): boolean {
    return this.loadedFonts.has(`${family}-${style}`);
  }
  
  /**
   * Get a safe font that is guaranteed to be loaded
   * @returns FontName object that can be used safely
   */
  static getSafeFont(preferredFamily: string = 'Inter', preferredStyle: string = 'Regular'): FontName {
    // Check if preferred font is loaded
    if (this.isFontLoaded(preferredFamily, preferredStyle)) {
      return { family: preferredFamily, style: preferredStyle };
    }
    
    // Try fallback combinations
    const fallbacks: FontDefinition[] = [
      { family: 'Inter', style: 'Regular' },
      { family: 'Roboto', style: 'Regular' },
      { family: 'Inter', style: 'Medium' },
      { family: 'Roboto', style: 'Medium' },
    ];
    
    for (const fallback of fallbacks) {
      if (this.isFontLoaded(fallback.family, fallback.style)) {
        console.warn(`[FontLoader] Using fallback font: ${fallback.family} ${fallback.style}`);
        return fallback;
      }
    }
    
    // Last resort - return the first loaded font
    const firstLoaded = this.loadedFonts.values().next().value;
    if (firstLoaded) {
      const parts = firstLoaded.split('-');
      const family = parts[0] || 'Inter';
      const style = parts[1] || 'Regular';
      console.warn(`[FontLoader] Using last resort font: ${family} ${style}`);
      return { family, style };
    }
    
    // This should never happen if preloadAllFonts() succeeded
    throw new Error('[FontLoader] No safe font available');
  }
  
  /**
   * Get all loaded fonts
   */
  static getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts);
  }
}
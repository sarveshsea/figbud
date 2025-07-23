/**
 * Link Parser Utility
 * Detects URLs in text and extracts metadata for preview generation
 */

export interface ParsedLink {
  url: string;
  originalText: string;
  domain: string;
  protocol: string;
  path: string;
}

export interface LinkSegment {
  type: 'text' | 'link';
  content: string;
  linkData?: ParsedLink;
}

export interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

/**
 * Comprehensive URL regex pattern that matches various URL formats
 */
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

/**
 * Parse text and extract URLs with their positions
 */
export function parseLinksFromText(text: string): LinkSegment[] {
  const segments: LinkSegment[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Parse and add the URL
    const url = match[0];
    segments.push({
      type: 'link',
      content: url,
      linkData: parseUrl(url)
    });

    lastIndex = match.index + url.length;
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return segments;
}

/**
 * Parse a URL into its components
 */
export function parseUrl(url: string): ParsedLink {
  try {
    const urlObj = new URL(url);
    return {
      url,
      originalText: url,
      domain: urlObj.hostname.replace('www.', ''),
      protocol: urlObj.protocol,
      path: urlObj.pathname + urlObj.search + urlObj.hash
    };
  } catch (error) {
    // Fallback for invalid URLs
    return {
      url,
      originalText: url,
      domain: extractDomainFromUrl(url),
      protocol: 'https:',
      path: ''
    };
  }
}

/**
 * Extract domain from URL string (fallback method)
 */
function extractDomainFromUrl(url: string): string {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
  return match && match[1] ? match[1] : url;
}

/**
 * Get favicon URL for a domain
 */
export function getFaviconUrl(domain: string): string {
  // Use Google's favicon service as a reliable fallback
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Check if a URL is from a known platform with special handling
 */
export function getUrlPlatform(url: string): string | null {
  const platformPatterns = {
    youtube: /(?:youtube\.com|youtu\.be)/i,
    figma: /figma\.com/i,
    github: /github\.com/i,
    medium: /medium\.com/i,
    twitter: /(?:twitter\.com|x\.com)/i,
    dribbble: /dribbble\.com/i,
    behance: /behance\.net/i
  };

  for (const [platform, pattern] of Object.entries(platformPatterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }

  return null;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generate YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'maxres' = 'hq'): string {
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Create default metadata for common platforms
 */
export function getDefaultMetadata(url: string, linkData: ParsedLink): LinkMetadata {
  const platform = getUrlPlatform(url);
  const metadata: LinkMetadata = {
    url,
    favicon: getFaviconUrl(linkData.domain)
  };

  switch (platform) {
    case 'youtube':
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        metadata.image = getYouTubeThumbnail(videoId);
        metadata.siteName = 'YouTube';
      }
      break;
    
    case 'figma':
      metadata.siteName = 'Figma';
      metadata.title = 'Figma Design';
      break;
    
    case 'github':
      metadata.siteName = 'GitHub';
      break;
    
    case 'medium':
      metadata.siteName = 'Medium';
      break;
    
    default:
      metadata.title = linkData.domain;
  }

  return metadata;
}

/**
 * Format domain for display
 */
export function formatDomain(domain: string): string {
  // Capitalize first letter and remove common TLDs for cleaner display
  const parts = domain.split('.');
  const name = parts[0] || domain;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
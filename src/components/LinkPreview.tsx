import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, AlertCircle } from 'lucide-react';
import { 
  LinkMetadata, 
  ParsedLink, 
  getDefaultMetadata, 
  formatDomain,
  truncateText 
} from '../utils/linkParser';

interface LinkPreviewProps {
  url: string;
  linkData: ParsedLink;
  className?: string;
  compact?: boolean;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ 
  url, 
  linkData, 
  className = '',
  compact = false 
}) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Get default metadata immediately
    const defaultMeta = getDefaultMetadata(url, linkData);
    setMetadata(defaultMeta);
    setLoading(false);
    
    // TODO: Fetch actual metadata from backend API
    // fetchLinkMetadata(url).then(setMetadata).finally(() => setLoading(false));
  }, [url, linkData]);

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) {
    return (
      <div className={`link-preview-card link-preview-loading ${className}`}>
        <div className="link-preview-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-description"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  // Compact mode for inline links
  if (compact) {
    return (
      <span 
        className="link-preview-compact"
        onClick={handleClick}
        title={url}
      >
        {metadata.favicon && (
          <img 
            src={metadata.favicon} 
            alt="" 
            className="link-preview-favicon"
          />
        )}
        <span className="link-preview-domain">
          {formatDomain(linkData.domain)}
        </span>
        <ExternalLink size={12} />
      </span>
    );
  }

  // Full card preview
  return (
    <div 
      className={`link-preview-card ${className}`}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Open ${metadata.title || linkData.domain} in new tab`}
    >
      {/* Thumbnail Section */}
      {(metadata.image || !imageError) && (
        <div className="link-preview-thumbnail">
          {metadata.image && !imageError ? (
            <img 
              src={metadata.image} 
              alt={metadata.title || 'Link preview'}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="link-preview-thumbnail-placeholder">
              <Globe size={32} />
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="link-preview-content">
        <div className="link-preview-header">
          {metadata.favicon && (
            <img 
              src={metadata.favicon} 
              alt="" 
              className="link-preview-favicon"
            />
          )}
          <span className="link-preview-domain">
            {metadata.siteName || formatDomain(linkData.domain)}
          </span>
        </div>

        {metadata.title && (
          <h4 className="link-preview-title">
            {truncateText(metadata.title, 60)}
          </h4>
        )}

        {metadata.description && (
          <p className="link-preview-description">
            {truncateText(metadata.description, 120)}
          </p>
        )}

        <div className="link-preview-footer">
          <span className="link-preview-url">
            {truncateText(url, 40)}
          </span>
          <ExternalLink size={14} className="link-preview-icon" />
        </div>
      </div>
    </div>
  );
};

// Loading skeleton component
export const LinkPreviewSkeleton: React.FC = () => (
  <div className="link-preview-card link-preview-loading">
    <div className="link-preview-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
        <div className="skeleton-url"></div>
      </div>
    </div>
  </div>
);

// Error state component
export const LinkPreviewError: React.FC<{ url: string }> = ({ url }) => (
  <div className="link-preview-card link-preview-error">
    <div className="link-preview-error-content">
      <AlertCircle size={20} />
      <span>Unable to load preview</span>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="link-preview-error-link"
      >
        Open link <ExternalLink size={12} />
      </a>
    </div>
  </div>
);
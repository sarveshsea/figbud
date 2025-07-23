import React, { useState, useEffect } from 'react';
import { DesignSystemManager, DesignSystemComponent, ComponentCategory } from '../services/designSystemManager';
import '../styles/component-library.css';
import '../styles/component-previews.css';

interface ComponentLibraryViewProps {
  onSelectComponent: (component: DesignSystemComponent) => void;
  onClose: () => void;
}

export const ComponentLibraryView: React.FC<ComponentLibraryViewProps> = ({ 
  onSelectComponent, 
  onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [components, setComponents] = useState<DesignSystemComponent[]>([]);
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterLibrary, setFilterLibrary] = useState<'all' | 'shadcn' | 'onceui' | 'custom'>('all');

  useEffect(() => {
    // Initialize design system and load components
    DesignSystemManager.initialize().then(() => {
      setCategories(DesignSystemManager.getAllCategories());
      setComponents(DesignSystemManager.getAllComponents());
    });
  }, []);

  // Filter components based on search and category
  const filteredComponents = components.filter(comp => {
    const matchesSearch = searchQuery === '' || 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      categories.find(cat => cat.name === selectedCategory)?.components.includes(comp);
    
    const matchesLibrary = filterLibrary === 'all' || comp.library === filterLibrary;
    
    return matchesSearch && matchesCategory && matchesLibrary;
  });

  // Get component count for a category
  const getCategoryCount = (categoryName: string): number => {
    if (categoryName === 'all') return components.length;
    return categories.find(cat => cat.name === categoryName)?.components.length || 0;
  };

  return (
    <div className="component-library-view">
      {/* Header */}
      <div className="library-header">
        <div className="header-top">
          <h2>Component Library</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M15 15L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="library-filter">
            <label>Library:</label>
            <select 
              value={filterLibrary} 
              onChange={(e) => setFilterLibrary(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Libraries</option>
              <option value="shadcn">Shadcn UI</option>
              <option value="onceui">Once UI</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="2" rx="1"/>
                <rect x="1" y="7" width="14" height="2" rx="1"/>
                <rect x="1" y="12" width="14" height="2" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="library-content">
        {/* Categories Sidebar */}
        <div className="categories-sidebar">
          <h3>Categories</h3>
          <ul className="category-list">
            <li 
              className={selectedCategory === 'all' ? 'active' : ''}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="category-icon">📚</span>
              <span className="category-name">All Components</span>
              <span className="category-count">{getCategoryCount('all')}</span>
            </li>
            {categories.map(category => (
              <li 
                key={category.name}
                className={selectedCategory === category.name ? 'active' : ''}
                onClick={() => setSelectedCategory(category.name)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.components.length}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Components Grid/List */}
        <div className="components-container">
          {filteredComponents.length === 0 ? (
            <div className="empty-state">
              <p>No components found matching your criteria.</p>
              <button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFilterLibrary('all');
              }}>Clear filters</button>
            </div>
          ) : (
            <div className={`components-${viewMode}`}>
              {filteredComponents.map(component => (
                <div 
                  key={`${component.library}-${component.type}-${component.name}`}
                  className="component-card"
                  onClick={() => onSelectComponent(component)}
                >
                  {/* Component Preview */}
                  <div className="component-preview">
                    {getComponentPreview(component)}
                  </div>
                  
                  {/* Component Info */}
                  <div className="component-info">
                    <h4>{component.name}</h4>
                    <p className="component-description">{component.description}</p>
                    
                    <div className="component-meta">
                      <span className={`library-badge ${component.library}`}>
                        {component.library}
                      </span>
                      <span className="component-type">{component.type}</span>
                    </div>
                    
                    {component.variants && component.variants.length > 0 && (
                      <div className="component-variants">
                        <span className="variants-label">Variants:</span>
                        {component.variants.map(variant => (
                          <span key={variant} className="variant-chip">{variant}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="component-tags">
                      {component.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component preview helper with real styled components
function getComponentPreview(component: DesignSystemComponent): React.ReactNode {
  const props = component.defaultProps || {};
  
  switch (component.type) {
    case 'button':
      return (
        <button className={`preview-button ${props.variant || 'default'} ${props.size || 'default'}`}>
          {props.children || props.text || 'Button'}
        </button>
      );
      
    case 'card':
      return (
        <div className="preview-card">
          <h3 className="preview-card-title">{props.title || 'Card Title'}</h3>
          <p className="preview-card-description">{props.description || 'Card description goes here'}</p>
          <div className="preview-card-content">
            <span>Card Content</span>
          </div>
        </div>
      );
      
    case 'input':
      return (
        <div className="preview-input-container">
          {props.label && <label className="preview-input-label">{props.label}</label>}
          <input 
            type="text"
            className={`preview-input ${props.size || 'default'}`}
            placeholder={props.placeholder || 'Enter text...'}
            disabled={props.disabled}
          />
        </div>
      );
      
    case 'badge':
      return (
        <span className={`preview-badge ${props.variant || 'default'} ${props.size || 'default'}`}>
          {props.children || props.text || 'Badge'}
        </span>
      );
      
    case 'switch':
    case 'toggle':
      return (
        <label className="preview-switch">
          <input type="checkbox" defaultChecked={props.checked} />
          <span className="preview-switch-slider"></span>
        </label>
      );
      
    case 'checkbox':
      return (
        <div className="preview-checkbox-container">
          <div className={`preview-checkbox ${props.checked ? 'checked' : ''}`}>
            <span className="preview-checkbox-checkmark">✓</span>
          </div>
          <span className="preview-checkbox-label">{props.label || 'Checkbox'}</span>
        </div>
      );
      
    case 'select':
    case 'dropdown':
      return (
        <div className="preview-select">
          <div className="preview-select-trigger">
            <span>{props.placeholder || 'Select an option'}</span>
            <span className="preview-select-arrow">▼</span>
          </div>
        </div>
      );
      
    case 'avatar':
      return (
        <div className={`preview-avatar ${props.size || 'default'}`}>
          {props.src ? (
            <img src={props.src} alt={props.alt || 'Avatar'} className="preview-avatar-image" />
          ) : (
            <span>{props.initials || 'JD'}</span>
          )}
        </div>
      );
      
    case 'alert':
      return (
        <div className={`preview-alert ${props.variant || 'default'}`}>
          <span className="preview-alert-icon">
            {props.variant === 'success' ? '✓' : 
             props.variant === 'warning' ? '⚠' : 
             props.variant === 'error' ? '✕' : 'ℹ'}
          </span>
          <div className="preview-alert-content">
            <div className="preview-alert-title">{props.title || 'Alert Title'}</div>
            <div className="preview-alert-description">{props.description || 'Alert message goes here'}</div>
          </div>
        </div>
      );
      
    case 'progress':
      return (
        <div className="preview-progress">
          <div className="preview-progress-bar">
            <div className="preview-progress-fill" style={{ width: `${props.value || 60}%` }}></div>
          </div>
        </div>
      );
      
    case 'skeleton':
      return (
        <div className={`preview-skeleton ${props.variant || 'text'}`}></div>
      );
      
    case 'tabs':
      return (
        <div className="preview-tabs">
          <div className="preview-tabs-list">
            <button className="preview-tab active">Tab 1</button>
            <button className="preview-tab">Tab 2</button>
            <button className="preview-tab">Tab 3</button>
          </div>
          <div className="preview-tabs-content">
            Tab content goes here
          </div>
        </div>
      );
      
    case 'tooltip':
      return (
        <div className="preview-tooltip-wrapper">
          <button className="preview-button default sm">Hover me</button>
          <div className="preview-tooltip">Tooltip text</div>
        </div>
      );
      
    // Professional template previews
    case 'hero':
      return (
        <div className="preview-card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>{props.headline || 'Hero Section'}</h2>
          <p style={{ marginBottom: '16px' }}>{props.subheadline || 'Subheadline text'}</p>
          <button className="preview-button default">{props.ctaText || 'Get Started'}</button>
        </div>
      );
      
    case 'navigationBar':
    case 'navbar':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '12px', background: 'var(--figbud-bg-secondary)', borderRadius: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>Logo</span>
          <span style={{ flex: 1, display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--figbud-text-secondary)' }}>
            <span>Home</span>
            <span>About</span>
            <span>Services</span>
          </span>
          <button className="preview-button ghost sm">Login</button>
        </div>
      );
      
    case 'loginForm':
      return (
        <div className="preview-card" style={{ padding: '32px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '24px' }}>Login</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input className="preview-input" placeholder="Email" />
            <input className="preview-input" type="password" placeholder="Password" />
            <button className="preview-button default" style={{ width: '100%' }}>Sign In</button>
          </div>
        </div>
      );
      
    case 'pricingCard':
      return (
        <div className="preview-card" style={{ textAlign: 'center' }}>
          <span className="preview-badge secondary sm" style={{ marginBottom: '16px' }}>Pro</span>
          <h3 style={{ fontSize: '32px', margin: '8px 0' }}>$29</h3>
          <p style={{ color: 'var(--figbud-text-secondary)', marginBottom: '16px' }}>/month</p>
          <button className="preview-button default" style={{ width: '100%' }}>Start Free Trial</button>
        </div>
      );
      
    case 'featureCard':
      return (
        <div className="preview-card">
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>{props.icon || '✨'}</div>
          <h4 style={{ marginBottom: '8px' }}>{props.title || 'Feature Title'}</h4>
          <p style={{ fontSize: '14px', color: 'var(--figbud-text-secondary)' }}>
            {props.description || 'Feature description'}
          </p>
        </div>
      );
      
    default:
      return (
        <div className="preview-default">
          <span>{component.name}</span>
        </div>
      );
  }
}
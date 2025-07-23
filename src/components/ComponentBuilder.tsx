import React, { useState, useEffect } from 'react';
import { DesignSystemComponent } from '../services/designSystemManager';
import '../styles/component-builder.css';
import '../styles/component-previews.css';

interface ComponentBuilderProps {
  component: DesignSystemComponent;
  onSave: (props: any) => void;
  onCancel: () => void;
}

interface PropControl {
  name: string;
  type: 'text' | 'select' | 'number' | 'boolean' | 'color';
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export const ComponentBuilder: React.FC<ComponentBuilderProps> = ({
  component,
  onSave,
  onCancel
}) => {
  const [componentProps, setComponentProps] = useState<any>({});
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    // Initialize with default props
    setComponentProps({ ...component.defaultProps });
  }, [component]);

  // Generate prop controls based on component type
  const getPropControls = (): PropControl[] => {
    const controls: PropControl[] = [];

    // Common controls
    if (component.props.children !== undefined || component.props.text !== undefined) {
      controls.push({
        name: component.props.children ? 'children' : 'text',
        type: 'text',
        label: 'Text Content'
      });
    }

    // Variant control
    if (component.props.variant) {
      controls.push({
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: Array.isArray(component.props.variant) ? component.props.variant : ['default']
      });
    }

    // Size control
    if (component.props.size) {
      controls.push({
        name: 'size',
        type: 'select',
        label: 'Size',
        options: Array.isArray(component.props.size) ? component.props.size : ['default', 'sm', 'lg']
      });
    }

    // Type-specific controls
    switch (component.type) {
      case 'button':
        controls.push({
          name: 'disabled',
          type: 'boolean',
          label: 'Disabled'
        });
        break;
      
      case 'input':
        controls.push({
          name: 'placeholder',
          type: 'text',
          label: 'Placeholder'
        });
        if (component.props.label !== undefined) {
          controls.push({
            name: 'label',
            type: 'text',
            label: 'Label'
          });
        }
        controls.push({
          name: 'disabled',
          type: 'boolean',
          label: 'Disabled'
        });
        break;
      
      case 'card':
        if (component.props.title !== undefined) {
          controls.push({
            name: 'title',
            type: 'text',
            label: 'Title'
          });
        }
        if (component.props.description !== undefined) {
          controls.push({
            name: 'description',
            type: 'text',
            label: 'Description'
          });
        }
        break;
      
      case 'badge':
        // Badge-specific controls are already covered
        break;
        
      case 'switch':
      case 'toggle':
        controls.push({
          name: 'checked',
          type: 'boolean',
          label: 'Checked'
        });
        controls.push({
          name: 'disabled',
          type: 'boolean',
          label: 'Disabled'
        });
        break;
        
      case 'checkbox':
        controls.push({
          name: 'checked',
          type: 'boolean',
          label: 'Checked'
        });
        controls.push({
          name: 'label',
          type: 'text',
          label: 'Label'
        });
        controls.push({
          name: 'disabled',
          type: 'boolean',
          label: 'Disabled'
        });
        break;
        
      case 'select':
      case 'dropdown':
        controls.push({
          name: 'placeholder',
          type: 'text',
          label: 'Placeholder'
        });
        controls.push({
          name: 'value',
          type: 'text',
          label: 'Selected Value'
        });
        controls.push({
          name: 'disabled',
          type: 'boolean',
          label: 'Disabled'
        });
        break;
        
      case 'avatar':
        controls.push({
          name: 'initials',
          type: 'text',
          label: 'Initials'
        });
        controls.push({
          name: 'src',
          type: 'text',
          label: 'Image URL'
        });
        controls.push({
          name: 'alt',
          type: 'text',
          label: 'Alt Text'
        });
        break;
        
      case 'alert':
        controls.push({
          name: 'title',
          type: 'text',
          label: 'Title'
        });
        controls.push({
          name: 'description',
          type: 'text',
          label: 'Description'
        });
        break;
        
      case 'progress':
        controls.push({
          name: 'value',
          type: 'number',
          label: 'Progress Value',
          min: 0,
          max: 100,
          step: 5
        });
        break;
        
      case 'skeleton':
        controls.push({
          name: 'variant',
          type: 'select',
          label: 'Variant',
          options: ['text', 'title', 'avatar', 'button', 'card']
        });
        break;
        
      case 'tabs':
        controls.push({
          name: 'activeTab',
          type: 'number',
          label: 'Active Tab Index',
          min: 0,
          max: 5,
          step: 1
        });
        break;
        
      // Professional template controls
      case 'hero':
        controls.push({
          name: 'headline',
          type: 'text',
          label: 'Headline'
        });
        controls.push({
          name: 'subheadline',
          type: 'text',
          label: 'Subheadline'
        });
        controls.push({
          name: 'ctaText',
          type: 'text',
          label: 'CTA Button Text'
        });
        break;
        
      case 'featureCard':
        controls.push({
          name: 'icon',
          type: 'text',
          label: 'Icon (Emoji)'
        });
        controls.push({
          name: 'title',
          type: 'text',
          label: 'Title'
        });
        controls.push({
          name: 'description',
          type: 'text',
          label: 'Description'
        });
        break;
    }

    // Custom className for Shadcn components
    if (component.library === 'shadcn') {
      controls.push({
        name: 'className',
        type: 'text',
        label: 'Custom Classes (Tailwind)'
      });
    }

    return controls;
  };

  // Handle prop change
  const handlePropChange = (propName: string, value: any) => {
    setComponentProps(prev => ({
      ...prev,
      [propName]: value
    }));
    // Force preview update
    setPreviewKey(prev => prev + 1);
  };

  // Get preview based on component type with real styled components
  const getComponentPreview = () => {
    const props = componentProps;
    
    switch (component.type) {
      case 'button':
        return (
          <button 
            className={`preview-button ${props.variant || 'default'} ${props.size || 'default'} ${props.disabled ? 'disabled' : ''}`}
            disabled={props.disabled}
          >
            {props.children || props.text || 'Button'}
          </button>
        );
      
      case 'card':
        return (
          <div className="preview-card">
            <h3 className="preview-card-title">{props.title || 'Card Title'}</h3>
            <p className="preview-card-description">{props.description || 'Card description goes here'}</p>
            {props.showContent !== false && (
              <div className="preview-card-content">
                <span>Card Content Area</span>
              </div>
            )}
          </div>
        );
      
      case 'input':
        return (
          <div className="preview-input-container">
            {props.label && <label className="preview-input-label">{props.label}</label>}
            <input 
              type="text" 
              placeholder={props.placeholder || 'Enter text...'} 
              disabled={props.disabled}
              className={`preview-input ${props.size || 'default'}`}
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
            <input type="checkbox" checked={props.checked} onChange={() => {}} />
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
              <span>{props.value || props.placeholder || 'Select an option'}</span>
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
              <span>{props.initials || props.text || 'AB'}</span>
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
              {props.description && <div className="preview-alert-description">{props.description}</div>}
            </div>
          </div>
        );
        
      case 'progress':
        return (
          <div className="preview-progress">
            <div className="preview-progress-bar">
              <div className="preview-progress-fill" style={{ width: `${props.value || 50}%` }}></div>
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
              {(props.tabs || ['Tab 1', 'Tab 2', 'Tab 3']).map((tab: string, index: number) => (
                <button key={tab} className={`preview-tab ${index === (props.activeTab || 0) ? 'active' : ''}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="preview-tabs-content">
              {props.content || 'Tab content goes here'}
            </div>
          </div>
        );
      
      // Professional templates
      case 'hero':
        return (
          <div className="preview-card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '12px', color: 'var(--figbud-text-primary)' }}>
              {props.headline || 'Welcome to FigBud'}
            </h2>
            <p style={{ marginBottom: '24px', color: 'var(--figbud-text-secondary)' }}>
              {props.subheadline || 'Design faster with AI-powered components'}
            </p>
            <button className="preview-button default lg">{props.ctaText || 'Get Started'}</button>
          </div>
        );
        
      case 'navigationBar':
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px', 
            padding: '16px 24px', 
            background: 'var(--figbud-bg-secondary)', 
            borderRadius: '8px',
            boxShadow: 'var(--figbud-shadow-sm)'
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>YourLogo</span>
            <nav style={{ flex: 1, display: 'flex', gap: '24px', fontSize: '14px' }}>
              <a style={{ color: 'var(--figbud-text-secondary)', textDecoration: 'none' }}>Home</a>
              <a style={{ color: 'var(--figbud-text-secondary)', textDecoration: 'none' }}>Features</a>
              <a style={{ color: 'var(--figbud-text-secondary)', textDecoration: 'none' }}>Pricing</a>
              <a style={{ color: 'var(--figbud-text-secondary)', textDecoration: 'none' }}>About</a>
            </nav>
            <button className="preview-button ghost">Login</button>
            <button className="preview-button default">Sign Up</button>
          </div>
        );
        
      case 'featureCard':
        return (
          <div className="preview-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{props.icon || '🚀'}</div>
            <h4 style={{ fontSize: '20px', marginBottom: '12px' }}>{props.title || 'Amazing Feature'}</h4>
            <p style={{ color: 'var(--figbud-text-secondary)' }}>
              {props.description || 'This feature will help you design faster and better'}
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
  };

  return (
    <div className="component-builder">
      <div className="builder-header">
        <h3>Customize {component.name}</h3>
        <p>{component.description}</p>
      </div>

      <div className="builder-content">
        {/* Properties Panel */}
        <div className="properties-panel">
          <h4>Properties</h4>
          <div className="prop-controls">
            {getPropControls().map(control => (
              <div key={control.name} className="prop-control">
                <label>{control.label}</label>
                {control.type === 'text' && (
                  <input
                    type="text"
                    value={componentProps[control.name] || ''}
                    onChange={(e) => handlePropChange(control.name, e.target.value)}
                    placeholder={`Enter ${control.label.toLowerCase()}`}
                  />
                )}
                {control.type === 'select' && (
                  <select
                    value={componentProps[control.name] || control.options?.[0]}
                    onChange={(e) => handlePropChange(control.name, e.target.value)}
                  >
                    {control.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                {control.type === 'boolean' && (
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={componentProps[control.name] || false}
                      onChange={(e) => handlePropChange(control.name, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                )}
                {control.type === 'number' && (
                  <input
                    type="number"
                    value={componentProps[control.name] || 0}
                    onChange={(e) => handlePropChange(control.name, parseInt(e.target.value))}
                    min={control.min}
                    max={control.max}
                    step={control.step}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Component Info */}
          <div className="component-info-section">
            <h4>Component Info</h4>
            <div className="info-item">
              <span className="info-label">Library:</span>
              <span className={`library-badge ${component.library}`}>{component.library}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type:</span>
              <span>{component.type}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Category:</span>
              <span>{component.category}</span>
            </div>
            {component.tags.length > 0 && (
              <div className="info-item">
                <span className="info-label">Tags:</span>
                <div className="tags-list">
                  {component.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <h4>Preview</h4>
          <div className="preview-container" key={previewKey}>
            {getComponentPreview()}
          </div>
          
          {/* Code Preview */}
          <div className="code-preview">
            <h5>Props</h5>
            <pre>{JSON.stringify(componentProps, null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="builder-actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-save" onClick={() => onSave(componentProps)}>
          Create Component
        </button>
      </div>
    </div>
  );
};

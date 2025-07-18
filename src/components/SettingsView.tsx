import React, { useState } from 'react';
import { UserProfile, UserPreferences } from '../types';

interface SettingsViewProps {
  user: UserProfile | null;
  onSave: (preferences: UserPreferences) => void;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onSave, onBack, onLogout }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(
    user?.preferences || {
      skillLevel: 'beginner',
      designStyle: 'modern',
      commonUseCases: [],
      preferredTutorialLength: 'any',
      notifications: {
        email: true,
        inApp: true,
        weekly: true,
      },
      theme: 'auto',
    }
  );

  const [activeTab, setActiveTab] = useState<'preferences' | 'account' | 'about'>('preferences');

  const handleSave = () => {
    onSave(preferences);
    onBack();
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const renderPreferencesTab = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h3>Experience Level</h3>
        <div className="radio-group">
          {[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ].map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="skillLevel"
                value={option.value}
                checked={preferences.skillLevel === option.value}
                onChange={(e) => updatePreferences({ skillLevel: e.target.value as any })}
              />
              <span className="radio-mark"></span>
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>Design Style</h3>
        <div className="radio-group">
          {[
            { value: 'minimal', label: 'Minimal' },
            { value: 'modern', label: 'Modern' },
            { value: 'playful', label: 'Playful' },
            { value: 'professional', label: 'Professional' },
          ].map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="designStyle"
                value={option.value}
                checked={preferences.designStyle === option.value}
                onChange={(e) => updatePreferences({ designStyle: e.target.value as any })}
              />
              <span className="radio-mark"></span>
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>Tutorial Length</h3>
        <div className="radio-group">
          {[
            { value: 'short', label: 'Short (< 10 min)' },
            { value: 'medium', label: 'Medium (10-30 min)' },
            { value: 'long', label: 'Long (> 30 min)' },
            { value: 'any', label: 'Any length' },
          ].map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="tutorialLength"
                value={option.value}
                checked={preferences.preferredTutorialLength === option.value}
                onChange={(e) => updatePreferences({ preferredTutorialLength: e.target.value as any })}
              />
              <span className="radio-mark"></span>
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>Theme</h3>
        <div className="radio-group">
          {[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto (follow system)' },
          ].map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={preferences.theme === option.value}
                onChange={(e) => updatePreferences({ theme: e.target.value as any })}
              />
              <span className="radio-mark"></span>
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>Notifications</h3>
        <div className="toggle-group">
          <div className="toggle-option">
            <div className="toggle-info">
              <h4>Email notifications</h4>
              <p>Weekly design tips and updates</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => updatePreferences({
                  notifications: { ...preferences.notifications, email: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="toggle-option">
            <div className="toggle-info">
              <h4>In-app tips</h4>
              <p>Contextual help while designing</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences.notifications.inApp}
                onChange={(e) => updatePreferences({
                  notifications: { ...preferences.notifications, inApp: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="toggle-option">
            <div className="toggle-info">
              <h4>Weekly summary</h4>
              <p>Your progress and achievements</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences.notifications.weekly}
                onChange={(e) => updatePreferences({
                  notifications: { ...preferences.notifications, weekly: e.target.checked }
                })}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h3>Account Information</h3>
        <div className="account-info">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email || 'Guest'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Subscription:</span>
            <span className="info-value">
              {user?.subscription.tier === 'premium' ? '⭐ Premium' : '🆓 Free'}
            </span>
          </div>
          {user?.figmaUserId && (
            <div className="info-row">
              <span className="info-label">Figma ID:</span>
              <span className="info-value">{user.figmaUserId}</span>
            </div>
          )}
        </div>
      </div>

      {user?.subscription.tier === 'free' && (
        <div className="setting-group">
          <h3>Upgrade to Premium</h3>
          <div className="upgrade-info">
            <p>Get access to advanced features:</p>
            <ul>
              <li>Unlimited demo creation</li>
              <li>Advanced AI guidance</li>
              <li>Custom templates</li>
              <li>Priority support</li>
            </ul>
            <button 
              className="figma-button"
              onClick={() => {
                // Navigate to premium view
                onBack();
                setTimeout(() => {
                  parent.postMessage({
                    pluginMessage: { type: 'navigate', payload: { view: 'premium' } }
                  }, '*');
                }, 100);
              }}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      <div className="setting-group danger-zone">
        <h3>Account Actions</h3>
        <button className="danger-button" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h3>About FigBud</h3>
        <div className="about-info">
          <p>Version 1.0.0</p>
          <p>Your AI-powered Figma assistant for tutorials, demos, and design guidance.</p>
        </div>
      </div>

      <div className="setting-group">
        <h3>Support</h3>
        <div className="support-links">
          <button 
            className="link-button"
            onClick={() => window.open('mailto:support@figbud.com')}
          >
            📧 Contact Support
          </button>
          <button 
            className="link-button"
            onClick={() => window.open('https://figbud.com/docs', '_blank')}
          >
            📚 Documentation
          </button>
          <button 
            className="link-button"
            onClick={() => window.open('https://figbud.com/feedback', '_blank')}
          >
            💬 Send Feedback
          </button>
        </div>
      </div>

      <div className="setting-group">
        <h3>Legal</h3>
        <div className="legal-links">
          <button 
            className="link-button"
            onClick={() => window.open('https://figbud.com/privacy', '_blank')}
          >
            Privacy Policy
          </button>
          <button 
            className="link-button"
            onClick={() => window.open('https://figbud.com/terms', '_blank')}
          >
            Terms of Service
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-view">
      <div className="settings-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Settings</h2>
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button 
          className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button 
          className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'account' && renderAccountTab()}
        {activeTab === 'about' && renderAboutTab()}
      </div>

      {activeTab === 'preferences' && (
        <div className="settings-footer">
          <button className="figma-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};
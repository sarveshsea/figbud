import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Flex, 
  Text, 
  Input, 
  Textarea,
  Switch,
  Button,
  Heading
} from '@once-ui-system/core';
import { SettingsManager, ApiKeys } from '../services/settingsManager';

interface DiaSettingsViewProps {
  onBack?: () => void;
}

export const DiaSettingsView: React.FC<DiaSettingsViewProps> = ({ onBack }) => {
  const [personalizeEnabled, setPersonalizeEnabled] = useState(true);
  const [inspirations, setInspirations] = useState('');
  const [digestInfo, setDigestInfo] = useState('');
  
  // API Key states
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await SettingsManager.getAllApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleApiKeyChange = (keyName: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyName]: value }));
    setSaveStatus(prev => ({ ...prev, [keyName]: '' }));
  };

  const saveApiKey = async (keyName: keyof ApiKeys) => {
    const value = apiKeys[keyName];
    if (!value) {
      setSaveStatus(prev => ({ ...prev, [keyName]: 'error' }));
      return;
    }

    // Validate key format
    if (!SettingsManager.validateApiKey(keyName, value)) {
      setSaveStatus(prev => ({ ...prev, [keyName]: 'Invalid key format' }));
      return;
    }

    setSavingKeys(prev => ({ ...prev, [keyName]: true }));
    try {
      await SettingsManager.setApiKey(keyName, value);
      setSaveStatus(prev => ({ ...prev, [keyName]: 'Saved!' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [keyName]: '' }));
      }, 2000);
    } catch (error) {
      setSaveStatus(prev => ({ ...prev, [keyName]: 'Failed to save' }));
    } finally {
      setSavingKeys(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowApiKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  return (
    <Flex 
      direction="column" 
      fillHeight 
      style={{ 
        height: '100%', 
        background: '#0A0A0A',
        color: '#E5E5E5'
      }}
    >
      {/* Header */}
      <Flex 
        horizontal="space-between" 
        vertical="center"
        padding="m"
        style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <Heading variant="heading-strong-m" style={{ fontSize: '1.25rem' }}>
          Settings
        </Heading>
        {onBack && (
          <Button
            variant="tertiary"
            size="s"
            onClick={onBack}
            style={{ fontSize: '0.875rem' }}
          >
            Back
          </Button>
        )}
      </Flex>

      {/* Content */}
      <Flex 
        direction="column" 
        gap="l" 
        padding="l"
        style={{ 
          flex: 1, 
          overflowY: 'auto'
        }}
      >
        {/* API Keys Section */}
        <Card
          padding="l"
          radius="m"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Flex direction="column" gap="m">
            <Flex direction="column" gap="xs">
              <Flex gap="xs" vertical="center">
                <Text>🔑</Text>
                <Text variant="heading-strong-s" style={{ fontSize: '1rem' }}>
                  API Keys
                </Text>
              </Flex>
              <Text variant="body-default-s" style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                Configure your own API keys for AI services. Keys are stored securely on your device.
              </Text>
            </Flex>

            {/* OpenRouter API Key */}
            <Flex direction="column" gap="s">
              <Text variant="body-strong-s" style={{ fontSize: '0.875rem' }}>
                OpenRouter API Key
              </Text>
              <Flex gap="s" vertical="center">
                <Input
                  id="openrouter-key"
                  type={showApiKeys.openRouterKey ? 'text' : 'password'}
                  value={apiKeys.openRouterKey || ''}
                  onChange={(e) => handleApiKeyChange('openRouterKey', e.target.value)}
                  placeholder="sk-or-v1-..."
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.875rem',
                    flex: 1
                  }}
                />
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={() => toggleShowKey('openRouterKey')}
                  style={{ fontSize: '0.75rem' }}
                >
                  {showApiKeys.openRouterKey ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => saveApiKey('openRouterKey')}
                  disabled={savingKeys.openRouterKey}
                  style={{ fontSize: '0.75rem' }}
                >
                  {savingKeys.openRouterKey ? 'Saving...' : 'Save'}
                </Button>
              </Flex>
              {saveStatus.openRouterKey && (
                <Text 
                  variant="body-default-xs" 
                  style={{ 
                    color: saveStatus.openRouterKey === 'Saved!' ? '#10B981' : '#EF4444',
                    fontSize: '0.75rem'
                  }}
                >
                  {saveStatus.openRouterKey}
                </Text>
              )}
            </Flex>

            {/* DeepSeek API Key */}
            <Flex direction="column" gap="s">
              <Text variant="body-strong-s" style={{ fontSize: '0.875rem' }}>
                DeepSeek API Key
              </Text>
              <Flex gap="s" vertical="center">
                <Input
                  id="deepseek-key"
                  type={showApiKeys.deepSeekKey ? 'text' : 'password'}
                  value={apiKeys.deepSeekKey || ''}
                  onChange={(e) => handleApiKeyChange('deepSeekKey', e.target.value)}
                  placeholder="sk-..."
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.875rem',
                    flex: 1
                  }}
                />
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={() => toggleShowKey('deepSeekKey')}
                  style={{ fontSize: '0.75rem' }}
                >
                  {showApiKeys.deepSeekKey ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => saveApiKey('deepSeekKey')}
                  disabled={savingKeys.deepSeekKey}
                  style={{ fontSize: '0.75rem' }}
                >
                  {savingKeys.deepSeekKey ? 'Saving...' : 'Save'}
                </Button>
              </Flex>
              {saveStatus.deepSeekKey && (
                <Text 
                  variant="body-default-xs" 
                  style={{ 
                    color: saveStatus.deepSeekKey === 'Saved!' ? '#10B981' : '#EF4444',
                    fontSize: '0.75rem'
                  }}
                >
                  {saveStatus.deepSeekKey}
                </Text>
              )}
            </Flex>

            {/* YouTube API Key */}
            <Flex direction="column" gap="s">
              <Text variant="body-strong-s" style={{ fontSize: '0.875rem' }}>
                YouTube API Key (Optional)
              </Text>
              <Flex gap="s" vertical="center">
                <Input
                  id="youtube-key"
                  type={showApiKeys.youtubeKey ? 'text' : 'password'}
                  value={apiKeys.youtubeKey || ''}
                  onChange={(e) => handleApiKeyChange('youtubeKey', e.target.value)}
                  placeholder="AIza..."
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.875rem',
                    flex: 1
                  }}
                />
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={() => toggleShowKey('youtubeKey')}
                  style={{ fontSize: '0.75rem' }}
                >
                  {showApiKeys.youtubeKey ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => saveApiKey('youtubeKey')}
                  disabled={savingKeys.youtubeKey}
                  style={{ fontSize: '0.75rem' }}
                >
                  {savingKeys.youtubeKey ? 'Saving...' : 'Save'}
                </Button>
              </Flex>
              {saveStatus.youtubeKey && (
                <Text 
                  variant="body-default-xs" 
                  style={{ 
                    color: saveStatus.youtubeKey === 'Saved!' ? '#10B981' : '#EF4444',
                    fontSize: '0.75rem'
                  }}
                >
                  {saveStatus.youtubeKey}
                </Text>
              )}
            </Flex>

            <Card
              padding="s"
              radius="s"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}
            >
              <Flex gap="xs" vertical="start">
                <Text>ℹ️</Text>
                <Flex direction="column" gap="xs">
                  <Text variant="body-default-xs" style={{ fontSize: '0.75rem' }}>
                    Your API keys are stored securely on your device and never sent to our servers.
                  </Text>
                  <Text variant="body-default-xs" style={{ fontSize: '0.75rem' }}>
                    Get your API keys from:
                  </Text>
                  <Text variant="body-default-xs" style={{ fontSize: '0.75rem', marginLeft: '1rem' }}>
                    • OpenRouter: openrouter.ai/keys
                  </Text>
                  <Text variant="body-default-xs" style={{ fontSize: '0.75rem', marginLeft: '1rem' }}>
                    • DeepSeek: platform.deepseek.com/api_keys
                  </Text>
                  <Text variant="body-default-xs" style={{ fontSize: '0.75rem', marginLeft: '1rem' }}>
                    • YouTube: console.cloud.google.com
                  </Text>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </Card>

        {/* Personalize Answers Section */}
        <Card
          padding="l"
          radius="m"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Flex direction="column" gap="m">
            <Flex horizontal="space-between" vertical="center">
              <Flex direction="column" gap="xs">
                <Text variant="heading-strong-s" style={{ fontSize: '1rem' }}>
                  Personalize answers
                </Text>
                <Text variant="body-default-s" style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                  When enabled, Dia tailors its responses based on what you teach it here.
                </Text>
              </Flex>
              <Switch
                isChecked={personalizeEnabled}
                onToggle={() => setPersonalizeEnabled(!personalizeEnabled)}
              />
            </Flex>
          </Flex>
        </Card>

        {/* Inspirations Section */}
        <Card
          padding="l"
          radius="m"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Flex direction="column" gap="m">
            <Flex direction="column" gap="xs">
              <Text variant="heading-strong-s" style={{ fontSize: '1rem' }}>
                Who inspires you or shapes your taste?
              </Text>
              <Text variant="body-default-s" style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                List people, brands, or products that should influence Dia's taste.
              </Text>
            </Flex>
            <Textarea
              id="inspirations-input"
              value={inspirations}
              onChange={(e) => setInspirations(e.target.value)}
              placeholder="Share a few writers, public figures or brands you love."
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '80px',
                fontSize: '0.875rem'
              }}
            />
          </Flex>
        </Card>

        {/* Digest Information Section */}
        <Card
          padding="l"
          radius="m"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Flex direction="column" gap="m">
            <Flex direction="column" gap="xs">
              <Text variant="heading-strong-s" style={{ fontSize: '1rem' }}>
                How do you best digest information?
              </Text>
              <Text variant="body-default-s" style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                Share a bit about yourself and your learning style.
              </Text>
            </Flex>
            <Textarea
              id="digest-info-input"
              value={digestInfo}
              onChange={(e) => setDigestInfo(e.target.value)}
              placeholder="I like short answers with bullets. Use analogies. I live in Brooklyn."
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '80px',
                fontSize: '0.875rem'
              }}
            />
          </Flex>
        </Card>

        {/* Write Skill Section */}
        <Card
          padding="l"
          radius="m"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Flex direction="column" gap="m">
            <Flex direction="column" gap="xs">
              <Flex gap="xs" vertical="center">
                <Text>✍️</Text>
                <Text variant="heading-strong-s" style={{ fontSize: '1rem' }}>
                  Write Skill
                </Text>
              </Flex>
              <Text variant="heading-strong-m" style={{ fontSize: '1.125rem' }}>
                How do you want Dia to write?
              </Text>
              <Text variant="body-default-s" style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                Teach the Write Skill how to draft in your preferred style.
              </Text>
            </Flex>
            <Textarea
              id="write-skill-input"
              placeholder="Casual and witty, but emails should be concise and professional."
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '100px',
                fontSize: '0.875rem'
              }}
            />
            <Card
              padding="s"
              radius="s"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}
            >
              <Flex gap="xs" vertical="start">
                <Text>ℹ️</Text>
                <Text variant="body-default-xs" style={{ fontSize: '0.75rem' }}>
                  The Write Skill shows up when you start drafting or editing text. You can also
                  access it by typing /write at the start of your request.
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  );
};
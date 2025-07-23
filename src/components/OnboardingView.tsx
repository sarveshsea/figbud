import React, { useState } from 'react';
import { UserProfile, UserPreferences } from '../types';

interface OnboardingViewProps {
  user: UserProfile | null;
  onComplete: (preferences: UserPreferences) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  user,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
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
  });

  const steps = [
    {
      title: "What's your experience with Figma?",
      type: 'skill-level',
    },
    {
      title: 'What design style do you prefer?',
      type: 'design-style',
    },
    {
      title: 'What do you typically design?',
      type: 'use-cases',
    },
    {
      title: 'How long should tutorials be?',
      type: 'tutorial-length',
    },
    {
      title: 'Notification preferences',
      type: 'notifications',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(preferences);
    }
  };

  const handleSkip = () => {
    onComplete(preferences);
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const renderStepContent = () => {
    const currentStep = steps[step];
    if (!currentStep) return null;

    switch (currentStep.type) {
      case 'skill-level':
        return (
          <div className="onboarding-options">
            {[
              {
                value: 'beginner',
                label: 'Beginner',
                description: 'New to Figma, learning the basics',
              },
              {
                value: 'intermediate',
                label: 'Intermediate',
                description: 'Comfortable with core features',
              },
              {
                value: 'advanced',
                label: 'Advanced',
                description: 'Expert user, complex workflows',
              },
            ].map((option) => (
              <button
                key={option.value}
                className={`option-card ${preferences.skillLevel === option.value ? 'selected' : ''}`}
                onClick={() =>
                  updatePreferences({ skillLevel: option.value as any })
                }
              >
                <h4>{option.label}</h4>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        );

      case 'design-style':
        return (
          <div className="onboarding-options">
            {[
              {
                value: 'minimal',
                label: 'Minimal',
                emoji: '⚪',
                description: 'Clean, simple, less is more',
              },
              {
                value: 'modern',
                label: 'Modern',
                emoji: '🔷',
                description: 'Contemporary, trendy designs',
              },
              {
                value: 'playful',
                label: 'Playful',
                emoji: '🎨',
                description: 'Colorful, fun, creative',
              },
              {
                value: 'professional',
                label: 'Professional',
                emoji: '💼',
                description: 'Corporate, business-focused',
              },
            ].map((option) => (
              <button
                key={option.value}
                className={`option-card ${preferences.designStyle === option.value ? 'selected' : ''}`}
                onClick={() =>
                  updatePreferences({ designStyle: option.value as any })
                }
              >
                <div className="option-emoji">{option.emoji}</div>
                <h4>{option.label}</h4>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        );

      case 'use-cases':
        const useCases = [
          'Mobile apps',
          'Web design',
          'UI components',
          'Prototyping',
          'Design systems',
          'Icons & illustrations',
          'Landing pages',
          'Dashboards',
        ];

        return (
          <div className="onboarding-checkboxes">
            {useCases.map((useCase) => (
              <label key={useCase} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={preferences.commonUseCases.includes(useCase)}
                  onChange={(e) => {
                    const newUseCases = e.target.checked
                      ? [...preferences.commonUseCases, useCase]
                      : preferences.commonUseCases.filter(
                          (uc) => uc !== useCase
                        );
                    updatePreferences({ commonUseCases: newUseCases });
                  }}
                />
                <span className="checkmark"></span>
                {useCase}
              </label>
            ))}
          </div>
        );

      case 'tutorial-length':
        return (
          <div className="onboarding-options">
            {[
              {
                value: 'short',
                label: 'Short (< 10 min)',
                description: 'Quick, focused tutorials',
              },
              {
                value: 'medium',
                label: 'Medium (10-30 min)',
                description: 'Detailed explanations',
              },
              {
                value: 'long',
                label: 'Long (> 30 min)',
                description: 'Comprehensive deep-dives',
              },
              {
                value: 'any',
                label: 'Any length',
                description: 'Show me everything relevant',
              },
            ].map((option) => (
              <button
                key={option.value}
                className={`option-card ${preferences.preferredTutorialLength === option.value ? 'selected' : ''}`}
                onClick={() =>
                  updatePreferences({
                    preferredTutorialLength: option.value as any,
                  })
                }
              >
                <h4>{option.label}</h4>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        );

      case 'notifications':
        return (
          <div className="onboarding-toggles">
            <div className="toggle-option">
              <div className="toggle-info">
                <h4>Email notifications</h4>
                <p>Weekly design tips and updates</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={preferences.notifications.email}
                  onChange={(e) =>
                    updatePreferences({
                      notifications: {
                        ...preferences.notifications,
                        email: e.target.checked,
                      },
                    })
                  }
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="toggle-option">
              <div className="toggle-info">
                <h4>In-app notifications</h4>
                <p>Tips and suggestions while designing</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={preferences.notifications.inApp}
                  onChange={(e) =>
                    updatePreferences({
                      notifications: {
                        ...preferences.notifications,
                        inApp: e.target.checked,
                      },
                    })
                  }
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="toggle-option">
              <div className="toggle-info">
                <h4>Weekly summary</h4>
                <p>Your design progress and achievements</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={preferences.notifications.weekly}
                  onChange={(e) =>
                    updatePreferences({
                      notifications: {
                        ...preferences.notifications,
                        weekly: e.target.checked,
                      },
                    })
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-view">
      <div className="onboarding-header">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        <h2>{steps[step]?.title || 'Setup'}</h2>
        <p className="step-indicator">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <div className="onboarding-content">{renderStepContent()}</div>

      <div className="onboarding-footer">
        <button className="skip-button" onClick={handleSkip}>
          Skip setup
        </button>

        <button className="figma-button" onClick={handleNext}>
          {step === steps.length - 1 ? 'Complete Setup' : 'Next'}
        </button>
      </div>
    </div>
  );
};

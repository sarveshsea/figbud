import React, { useState } from 'react';
import { UserProfile } from '../types';
import { storage } from '../utils/storage';

interface PremiumViewProps {
  user: UserProfile | null;
  onBack: () => void;
}

export const PremiumView: React.FC<PremiumViewProps> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    monthly: {
      price: 10,
      interval: 'month',
      savings: null,
    },
    yearly: {
      price: 100,
      interval: 'year',
      savings: '17%',
    },
  };

  const features = [
    {
      category: 'AI Features',
      items: [
        { name: 'Unlimited tutorial searches', free: true, premium: true },
        { name: 'Basic demo creation', free: true, premium: true },
        { name: 'Advanced AI guidance', free: false, premium: true },
        { name: 'Custom demo templates', free: false, premium: true },
        { name: 'Smart design suggestions', free: false, premium: true },
      ],
    },
    {
      category: 'Collaboration',
      items: [
        { name: 'Personal workspace', free: true, premium: true },
        { name: 'Team sharing', free: false, premium: true },
        { name: 'Advanced handoff tools', free: false, premium: true },
        { name: 'Team analytics', free: false, premium: true },
      ],
    },
    {
      category: 'Support & Limits',
      items: [
        { name: 'Community support', free: true, premium: true },
        { name: 'Priority email support', free: false, premium: true },
        { name: '10 demos per month', free: true, premium: false },
        { name: 'Unlimited demos', free: false, premium: true },
        { name: 'API access', free: false, premium: true },
      ],
    },
  ];

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      // TODO: Implement premium upgrade flow
      console.log('Upgrade to', selectedPlan);
      
      // For now, just show a notification
      parent.postMessage({
        pluginMessage: {
          type: 'notify',
          message: '✨ Premium features coming soon! Stay tuned for updates.'
        }
      }, '*');
      
      // You could also show a contact form or email link
      window.open('mailto:support@figbud.ai?subject=Premium%20Upgrade%20Request', '_blank');
      
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Premium upgrades coming soon!');
    } finally {
      setLoading(false);
    }
  };

  if (user?.subscription.tier === 'premium') {
    return (
      <div className="premium-view">
        <div className="premium-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h2>Premium Subscription</h2>
        </div>

        <div className="premium-content">
          <div className="current-plan">
            <div className="plan-badge premium">
              ⭐ Premium Active
            </div>
            <h3>You're all set!</h3>
            <p>You have access to all premium features.</p>
          </div>

          <div className="premium-features-used">
            <h4>Your Premium Benefits</h4>
            <ul>
              <li>✅ Unlimited AI-powered tutorials</li>
              <li>✅ Advanced demo creation</li>
              <li>✅ Smart design guidance</li>
              <li>✅ Team collaboration tools</li>
              <li>✅ Priority support</li>
            </ul>
          </div>

          <div className="subscription-management">
            <h4>Manage Subscription</h4>
            <p>Need help with your subscription?</p>
            <button 
              className="figma-button secondary"
              onClick={() => {
                // Open email support
                window.open('mailto:support@figbud.ai?subject=Premium%20Subscription%20Help', '_blank');
              }}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-view">
      <div className="premium-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Upgrade to Premium</h2>
        <p>Unlock the full potential of FigBud</p>
      </div>

      <div className="premium-content">
        <div className="pricing-section">
          <div className="plan-selector">
            <button
              className={`plan-option ${selectedPlan === 'monthly' ? 'selected' : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="plan-details">
                <h3>Monthly</h3>
                <div className="plan-price">
                  <span className="price">${plans.monthly.price}</span>
                  <span className="interval">/{plans.monthly.interval}</span>
                </div>
              </div>
            </button>

            <button
              className={`plan-option ${selectedPlan === 'yearly' ? 'selected' : ''}`}
              onClick={() => setSelectedPlan('yearly')}
            >
              <div className="plan-details">
                <h3>Yearly</h3>
                <div className="plan-price">
                  <span className="price">${plans.yearly.price}</span>
                  <span className="interval">/{plans.yearly.interval}</span>
                </div>
                {plans.yearly.savings && (
                  <div className="savings-badge">
                    Save {plans.yearly.savings}
                  </div>
                )}
              </div>
            </button>
          </div>

          <button
            className="upgrade-button"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Upgrade to Premium - $${plans[selectedPlan].price}/${plans[selectedPlan].interval}`}
          </button>
        </div>

        <div className="features-comparison">
          <h3>Feature Comparison</h3>
          
          <div className="comparison-table">
            <div className="table-header">
              <div className="feature-column">Features</div>
              <div className="plan-column">
                <div className="plan-name">Free</div>
              </div>
              <div className="plan-column">
                <div className="plan-name premium">Premium</div>
              </div>
            </div>

            {features.map((category, categoryIndex) => (
              <div key={categoryIndex} className="feature-category">
                <div className="category-header">
                  <h4>{category.category}</h4>
                </div>
                
                {category.items.map((feature, featureIndex) => (
                  <div key={featureIndex} className="feature-row">
                    <div className="feature-name">{feature.name}</div>
                    <div className="feature-support">
                      {feature.free ? '✅' : '❌'}
                    </div>
                    <div className="feature-support premium">
                      {feature.premium ? '✅' : '❌'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="testimonials">
          <h3>What users say</h3>
          <div className="testimonial-grid">
            <div className="testimonial">
              <p>"FigBud Premium has transformed my design workflow. The AI suggestions are incredibly helpful!"</p>
              <cite>— Sarah, Product Designer</cite>
            </div>
            <div className="testimonial">
              <p>"The team collaboration features saved us hours in handoffs. Worth every penny."</p>
              <cite>— Mike, Design Lead</cite>
            </div>
          </div>
        </div>

        <div className="premium-footer">
          <div className="money-back">
            <p>💰 30-day money-back guarantee</p>
          </div>
          <div className="support-info">
            <p>Questions? <button className="link-button" onClick={() => window.open('mailto:support@figbud.com')}>Contact support</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};
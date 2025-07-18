import { AnalyticsEvent } from '../types';

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userId?: string;

  setUserId(userId: string) {
    this.userId = userId;
  }

  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      userId: this.userId,
      properties: {
        ...properties,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);

    // Send to Figma widget for further processing
    if (typeof parent !== 'undefined') {
      parent.postMessage({
        pluginMessage: {
          type: 'track-analytics',
          payload: analyticsEvent,
        },
      }, '*');
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', analyticsEvent);
    }
  }

  // Predefined event tracking methods
  trackPageView(page: string) {
    this.track('page_view', { page });
  }

  trackButtonClick(buttonName: string, location?: string) {
    this.track('button_click', { buttonName, location });
  }

  trackFeatureUsage(feature: string, action: string, metadata?: any) {
    this.track('feature_usage', { feature, action, ...metadata });
  }

  trackSearch(query: string, resultCount: number, source: string) {
    this.track('search', { query, resultCount, source });
  }

  trackTutorialView(tutorialId: string, videoId: string, source: string) {
    this.track('tutorial_view', { tutorialId, videoId, source });
  }

  trackDemoCreation(demoId: string, prompt: string, success: boolean) {
    this.track('demo_creation', { demoId, prompt, success });
  }

  trackUserOnboarding(step: number, completed: boolean, stepName?: string) {
    this.track('onboarding', { step, completed, stepName });
  }

  trackAuthAction(action: 'login' | 'register' | 'logout', method?: string) {
    this.track('auth', { action, method });
  }

  trackError(error: string, context?: any) {
    this.track('error', { error, context });
  }

  trackSubscription(action: 'upgrade' | 'downgrade' | 'cancel', plan?: string) {
    this.track('subscription', { action, plan });
  }

  // Get analytics data (for debugging or local storage)
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear events (useful for privacy compliance)
  clearEvents() {
    this.events = [];
  }

  // Batch send events to backend (if needed)
  async flushEvents() {
    if (this.events.length === 0) return;

    try {
      // Send events to backend for persistent storage
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('figbud_token')}`,
        },
        body: JSON.stringify({ events: this.events }),
      });

      if (response.ok) {
        this.clearEvents();
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  }
}

export const analytics = new AnalyticsService();
export default analytics;
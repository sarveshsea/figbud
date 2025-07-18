import { analytics } from '../../src/utils/analytics';

describe('Analytics Service', () => {
  beforeEach(() => {
    analytics.clearEvents();
    
    // Mock parent.postMessage
    Object.defineProperty(window, 'parent', {
      value: {
        postMessage: jest.fn(),
      },
      writable: true,
    });

    // Mock console.log
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Event Tracking', () => {
    test('should track basic events', () => {
      analytics.track('test_event', { key: 'value' });
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('test_event');
      expect(events[0].properties.key).toBe('value');
    });

    test('should include timestamp in events', () => {
      const beforeTime = new Date();
      analytics.track('test_event');
      const afterTime = new Date();
      
      const events = analytics.getEvents();
      const eventTime = events[0].timestamp;
      
      expect(eventTime).toBeInstanceOf(Date);
      expect(eventTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(eventTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('should set and track user ID', () => {
      const userId = 'test-user-123';
      analytics.setUserId(userId);
      analytics.track('test_event');
      
      const events = analytics.getEvents();
      expect(events[0].userId).toBe(userId);
    });

    test('should send message to parent', () => {
      analytics.track('test_event', { data: 'test' });
      
      expect(window.parent.postMessage).toHaveBeenCalledWith({
        pluginMessage: {
          type: 'track-analytics',
          payload: expect.objectContaining({
            event: 'test_event',
            properties: expect.objectContaining({
              data: 'test',
            }),
          }),
        },
      }, '*');
    });
  });

  describe('Predefined Event Methods', () => {
    test('should track page views', () => {
      analytics.trackPageView('settings');
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('page_view');
      expect(events[0].properties.page).toBe('settings');
    });

    test('should track button clicks', () => {
      analytics.trackButtonClick('submit_button', 'login_form');
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('button_click');
      expect(events[0].properties.buttonName).toBe('submit_button');
      expect(events[0].properties.location).toBe('login_form');
    });

    test('should track feature usage', () => {
      analytics.trackFeatureUsage('tutorial_search', 'search_executed', { query: 'buttons' });
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('feature_usage');
      expect(events[0].properties.feature).toBe('tutorial_search');
      expect(events[0].properties.action).toBe('search_executed');
      expect(events[0].properties.query).toBe('buttons');
    });

    test('should track searches', () => {
      analytics.trackSearch('button tutorial', 5, 'youtube');
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('search');
      expect(events[0].properties.query).toBe('button tutorial');
      expect(events[0].properties.resultCount).toBe(5);
      expect(events[0].properties.source).toBe('youtube');
    });

    test('should track tutorial views', () => {
      analytics.trackTutorialView('tutorial-123', 'video-456', 'search_results');
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('tutorial_view');
      expect(events[0].properties.tutorialId).toBe('tutorial-123');
      expect(events[0].properties.videoId).toBe('video-456');
      expect(events[0].properties.source).toBe('search_results');
    });

    test('should track demo creation', () => {
      analytics.trackDemoCreation('demo-123', 'create login form', true);
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('demo_creation');
      expect(events[0].properties.demoId).toBe('demo-123');
      expect(events[0].properties.prompt).toBe('create login form');
      expect(events[0].properties.success).toBe(true);
    });

    test('should track onboarding', () => {
      analytics.trackUserOnboarding(2, false, 'skill_assessment');
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('onboarding');
      expect(events[0].properties.step).toBe(2);
      expect(events[0].properties.completed).toBe(false);
      expect(events[0].properties.stepName).toBe('skill_assessment');
    });

    test('should track auth actions', () => {
      analytics.trackAuthAction('login', 'email');
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('auth');
      expect(events[0].properties.action).toBe('login');
      expect(events[0].properties.method).toBe('email');
    });

    test('should track errors', () => {
      const errorContext = { component: 'LoginForm', line: 42 };
      analytics.trackError('Network timeout', errorContext);
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('error');
      expect(events[0].properties.error).toBe('Network timeout');
      expect(events[0].properties.context).toEqual(errorContext);
    });

    test('should track subscription events', () => {
      analytics.trackSubscription('upgrade', 'premium');
      
      const events = analytics.getEvents();
      expect(events[0].event).toBe('subscription');
      expect(events[0].properties.action).toBe('upgrade');
      expect(events[0].properties.plan).toBe('premium');
    });
  });

  describe('Event Management', () => {
    test('should clear events', () => {
      analytics.track('event1');
      analytics.track('event2');
      
      expect(analytics.getEvents()).toHaveLength(2);
      
      analytics.clearEvents();
      expect(analytics.getEvents()).toHaveLength(0);
    });

    test('should return copy of events array', () => {
      analytics.track('test_event');
      
      const events1 = analytics.getEvents();
      const events2 = analytics.getEvents();
      
      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });
  });

  describe('Batch Operations', () => {
    test('should handle multiple events', () => {
      analytics.trackPageView('home');
      analytics.trackButtonClick('nav_button');
      analytics.trackFeatureUsage('search', 'initiated');
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(3);
      expect(events.map(e => e.event)).toEqual(['page_view', 'button_click', 'feature_usage']);
    });

    test('should flush events via API call', async () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      analytics.track('event1');
      analytics.track('event2');
      
      expect(analytics.getEvents()).toHaveLength(2);
      
      await analytics.flushEvents();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null',
        },
        body: expect.any(String),
      });
      
      expect(analytics.getEvents()).toHaveLength(0);
    });

    test('should handle flush errors gracefully', async () => {
      // Mock fetch failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      console.error = jest.fn();

      analytics.track('event1');
      
      await analytics.flushEvents();
      
      expect(console.error).toHaveBeenCalledWith('Failed to flush analytics events:', expect.any(Error));
      expect(analytics.getEvents()).toHaveLength(1); // Events should not be cleared on failure
    });
  });
});
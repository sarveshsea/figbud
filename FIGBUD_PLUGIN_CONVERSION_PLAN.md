# FigBud Plugin Conversion Plan

## Overview
This document outlines the comprehensive plan for converting FigBud from a Figma widget to a Figma plugin, ensuring robust functionality and proper error handling.

## Phase 1: Cleanup and File Deletion

### Files to Delete (Widget-Related)
```
- figbud-widget.js (main widget file)
- src/widget-basic.js
- src/widget-minimal.js
- src/widget-nodestruct.js
- src/widget-once-ui.js
- src/widget-test.js
- src/code-widget.js
- test-text-widget.js
- webpack.widget.config.js
- manifest-backup.json (widget manifest backup)
- manifest-direct.json (widget manifest variant)
- test-manifest.json (widget test manifest)
- WIDGET_DEBUG_GUIDE.md
- WIDGET_FIXED_INSTRUCTIONS.md
- WIDGET_IMPORT_GUIDE.md
- MINIMAL_WIDGET_TEST.md
```

### Files to Keep and Optimize
```
- code.js (main plugin code)
- ui.html (plugin UI)
- plugin-manifest.json (to be renamed to manifest.json)
- src/code.js (source version)
- src/ui.html (source UI)
- All TypeScript files and components
```

## Phase 2: Plugin Structure Definition

### Required Plugin Structure
```
figbud/
├── manifest.json          # Plugin manifest (renamed from plugin-manifest.json)
├── code.js               # Main plugin code (backend)
├── ui.html               # Plugin UI (frontend)
├── src/                  # Source files
│   ├── code.ts          # TypeScript source for plugin
│   ├── ui.tsx           # React UI source
│   └── components/      # React components
├── dist/                 # Built files
│   ├── code.js          # Compiled plugin code
│   └── ui.html          # Compiled UI
└── package.json         # Dependencies and scripts
```

### Manifest Configuration (manifest.json)
```json
{
  "name": "FigBud AI Assistant",
  "id": "figbud-plugin-v1",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "permissions": [
    "currentuser",
    "activeusers"
  ],
  "menu": [
    {
      "name": "Open FigBud",
      "command": "open"
    },
    {
      "name": "Toggle Sandbox",
      "command": "toggle-sandbox"
    }
  ],
  "relaunchButtons": [
    {
      "command": "open",
      "name": "Open FigBud"
    }
  ]
}
```

## Phase 3: Code Architecture

### code.js Structure
```javascript
// Plugin initialization
figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true,
  visible: true
});

// Global state management
const pluginState = {
  sandboxId: null,
  isAuthenticated: false,
  currentUser: null
};

// Message handlers with error boundaries
figma.ui.onmessage = async (msg) => {
  try {
    await handleMessage(msg);
  } catch (error) {
    console.error('[FigBud] Error handling message:', error);
    figma.ui.postMessage({
      type: 'error',
      error: error.message
    });
  }
};

// Robust message handling
async function handleMessage(msg) {
  if (!msg || !msg.type) {
    throw new Error('Invalid message format');
  }
  
  switch (msg.type) {
    case 'create-component':
      await handleCreateComponent(msg);
      break;
    case 'toggle-sandbox':
      await handleToggleSandbox(msg);
      break;
    case 'chat-message':
      await handleChatMessage(msg);
      break;
    case 'resize':
      handleResize(msg);
      break;
    default:
      console.warn('[FigBud] Unknown message type:', msg.type);
  }
}
```

### UI Architecture (ui.html/ui.tsx)
```typescript
// Main UI component with error boundaries
class FigBudUI extends React.Component {
  state = {
    isAuthenticated: false,
    currentView: 'onboarding',
    error: null
  };

  componentDidCatch(error, errorInfo) {
    console.error('UI Error:', error, errorInfo);
    this.setState({ error: error.message });
  }

  render() {
    if (this.state.error) {
      return <ErrorView error={this.state.error} />;
    }
    
    return (
      <div className="figbud-container">
        {this.renderCurrentView()}
      </div>
    );
  }
}
```

## Phase 4: Error Handling Strategy

### Plugin-Side Error Handling
1. **Try-Catch Blocks**: Wrap all async operations
2. **Validation**: Validate all incoming messages
3. **Fallback States**: Provide graceful degradation
4. **Error Reporting**: Send errors back to UI

### UI-Side Error Handling
1. **React Error Boundaries**: Catch component errors
2. **API Error Handling**: Handle network failures
3. **User Feedback**: Show clear error messages
4. **Recovery Actions**: Provide retry options

### Common Error Scenarios
```javascript
// Network errors
const handleNetworkError = (error) => {
  if (error.code === 'NETWORK_ERROR') {
    showOfflineMessage();
  }
};

// Figma API errors
const handleFigmaError = (error) => {
  if (error.message.includes('selection')) {
    showMessage('Please select an element first');
  }
};

// Authentication errors
const handleAuthError = (error) => {
  if (error.status === 401) {
    redirectToLogin();
  }
};
```

## Phase 5: Debugging Strategies

### Development Tools
1. **Console Logging**: Structured logging with prefixes
2. **Chrome DevTools**: For UI debugging
3. **Figma Console**: For plugin code debugging

### Debug Configuration
```javascript
const DEBUG = {
  enabled: true,
  logLevel: 'verbose',
  logMessages: true,
  logErrors: true,
  logPerformance: true
};

function debugLog(category, message, data) {
  if (!DEBUG.enabled) return;
  console.log(`[FigBud:${category}]`, message, data);
}
```

### Common Issues and Solutions
1. **Plugin not loading**
   - Check manifest.json format
   - Verify file paths are correct
   - Check console for syntax errors

2. **UI not showing**
   - Verify __html__ variable exists
   - Check ui.html is valid HTML
   - Look for JavaScript errors

3. **Messages not working**
   - Log all messages on both sides
   - Verify message format
   - Check for async/await issues

## Phase 6: Testing Strategy

### Manual Testing Steps
1. **Installation Test**
   ```
   - Import plugin via manifest.json
   - Verify plugin appears in menu
   - Check that UI opens correctly
   ```

2. **Functionality Test**
   ```
   - Test each menu command
   - Verify all UI interactions
   - Test error scenarios
   ```

3. **Integration Test**
   ```
   - Test API connections
   - Verify authentication flow
   - Test data persistence
   ```

### Automated Testing
```json
// package.json scripts
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint src/**/*.{js,ts,tsx}",
    "type-check": "tsc --noEmit"
  }
}
```

### Test Cases
```javascript
// Example test cases
describe('FigBud Plugin', () => {
  test('should initialize correctly', () => {
    expect(figma.showUI).toHaveBeenCalled();
  });
  
  test('should handle messages', () => {
    const msg = { type: 'resize', width: 500, height: 700 };
    handleMessage(msg);
    expect(figma.ui.resize).toHaveBeenCalledWith(500, 700);
  });
});
```

## Phase 7: Build Configuration

### Webpack Configuration for Plugin
```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  entry: {
    code: './src/code.ts',
    ui: './src/ui.tsx'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
};
```

### Build Scripts
```json
{
  "scripts": {
    "build": "webpack",
    "build:watch": "webpack --watch",
    "build:dev": "webpack --mode development",
    "clean": "rm -rf dist/*"
  }
}
```

## Phase 8: Implementation Timeline

### Week 1: Cleanup and Setup
- Day 1-2: Delete widget files, reorganize structure
- Day 3-4: Update manifest and basic plugin setup
- Day 5: Initial testing and debugging

### Week 2: Core Implementation
- Day 1-2: Implement error handling
- Day 3-4: Update UI components
- Day 5: Integration testing

### Week 3: Polish and Testing
- Day 1-2: Performance optimization
- Day 3-4: Comprehensive testing
- Day 5: Documentation and release prep

## Potential Issues and Mitigations

### Issue 1: Migration Complexity
**Problem**: Complex state management between widget and plugin
**Solution**: Create migration guide and state mapping

### Issue 2: UI Performance
**Problem**: React bundle size affecting load time
**Solution**: Code splitting and lazy loading

### Issue 3: API Compatibility
**Problem**: Different API access between widget and plugin
**Solution**: Abstract API layer with fallbacks

### Issue 4: User Data Migration
**Problem**: Existing widget users losing data
**Solution**: Export/import functionality for user data

## Success Criteria

1. **Functional Requirements**
   - Plugin loads without errors
   - All features work as expected
   - Proper error handling in place

2. **Performance Requirements**
   - UI loads in < 2 seconds
   - Smooth interactions
   - No memory leaks

3. **User Experience**
   - Clear onboarding flow
   - Intuitive navigation
   - Helpful error messages

4. **Code Quality**
   - TypeScript types complete
   - All tests passing
   - No ESLint errors

## Conclusion

This plan provides a comprehensive roadmap for converting FigBud from a widget to a plugin. Following these steps will ensure a robust, well-tested plugin that provides an excellent user experience while maintaining code quality and performance.
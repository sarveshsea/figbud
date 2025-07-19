# FigBud Vanilla JavaScript Implementation

## Overview

After extensive debugging and testing, we successfully migrated FigBud from a complex React + Webpack setup to a clean vanilla JavaScript implementation. This document details the journey, the solution, and how to maintain the codebase.

## 🚀 The Journey

### Initial Problem
The React-based implementation faced critical issues:
1. **Syntax Errors**: `Uncaught SyntaxError: Failed to execute 'write' on 'Document': missing ) after argument list`
2. **Figma Sandbox Limitations**: Figma's plugin environment uses `document.write()` to inject HTML, which breaks with complex bundled JavaScript
3. **Build Complexity**: Webpack, Babel, and React created overly complex output that Figma couldn't parse

### Failed Attempts
1. **Inline Script Approach**: Tried embedding JavaScript directly in HTML - failed due to template literal escaping
2. **Data URI Approach**: Attempted base64 encoding scripts - still caused parsing errors
3. **Complex Webpack Configurations**: Multiple webpack configs couldn't solve the fundamental incompatibility

### The Solution
Vanilla JavaScript with Figma's standard plugin structure:
- **Separate Files**: `code.js` for logic, `ui.html` for interface
- **No Build Complexity**: Direct JavaScript without transpilation
- **Clean Architecture**: Simple, maintainable code that Figma can parse

## 📁 File Structure

```
figbud/
├── manifest.json          # Plugin configuration
├── code.js               # Plugin logic (vanilla JS)
├── ui.html               # UI with Once UI styling
├── docs/
│   └── VANILLA_IMPLEMENTATION.md  # This file
└── archive/
    ├── code-react.js     # Old React version (backup)
    └── src/              # React source files (archived)
```

## 🛠️ Technical Implementation

### 1. Plugin Architecture

**manifest.json**
```json
{
  "name": "FigBud",
  "id": "figbud-ai-assistant",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html"
}
```

### 2. Plugin Logic (code.js)

The plugin logic is structured as follows:

```javascript
// 1. Font Preloading
async function preloadFonts() {
    const fonts = [
        { family: 'Inter', style: 'Regular' },
        { family: 'Inter', style: 'Medium' },
        { family: 'Inter', style: 'Bold' }
    ];
    // Load each font...
}

// 2. Component Creation Functions
async function createButton(props) { /* ... */ }
async function createCard(props) { /* ... */ }
async function createInput(props) { /* ... */ }
async function createNavbar(props) { /* ... */ }

// 3. Plugin Initialization
async function init() {
    await preloadFonts();
    figma.showUI(__html__, {
        width: 400,
        height: 600,
        title: 'FigBud AI Assistant'
    });
}

// 4. Message Handling
figma.ui.onmessage = async (msg) => {
    // Handle component creation requests
    // Send responses back to UI
};
```

### 3. UI Implementation (ui.html)

The UI uses Once UI design system implemented in vanilla CSS:

```html
<!-- Once UI Variables -->
<style>
:root {
    --background: #0A0A0A;
    --surface: #1A1A1A;
    --primary: #6366F1;
    --text: #E5E5E5;
    /* ... more variables ... */
}
</style>

<!-- Component Structure -->
<div id="app">
    <!-- Header -->
    <h1>🤖 FigBud</h1>
    
    <!-- Tab Navigation -->
    <div class="tabs">
        <button class="tab active">Chat</button>
        <button class="tab">Create</button>
        <button class="tab">Sandbox</button>
    </div>
    
    <!-- Views -->
    <div id="chat-view"><!-- Chat interface --></div>
    <div id="create-view"><!-- Component buttons --></div>
    <div id="sandbox-view"><!-- Practice area --></div>
</div>
```

## 🎨 Once UI Design System

### Color Palette
- **Background**: `#0A0A0A` - Deep black for main background
- **Surface**: `#1A1A1A` - Elevated surfaces
- **Primary**: `#6366F1` - Vibrant blue for actions
- **Text**: `#E5E5E5` - High contrast text
- **Border**: `rgba(255, 255, 255, 0.1)` - Subtle borders

### Component Styling
All components follow Once UI principles:
- **Cards**: Rounded corners, subtle shadows, elevated backgrounds
- **Buttons**: Smooth transitions, hover states, clear CTAs
- **Inputs**: Focus states, proper padding, clear labels
- **Tabs**: Active state indicators, smooth transitions

## 🔧 Component Creation

### Button Component
```javascript
async function createButton(props = {}) {
    const button = figma.createFrame();
    button.cornerRadius = 8;
    button.fills = [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.945 } }];
    
    // Auto-layout for padding
    button.layoutMode = 'HORIZONTAL';
    button.paddingLeft = 16;
    button.paddingRight = 16;
    
    // Add text
    const text = figma.createText();
    text.characters = props.text || "Button";
    
    return button;
}
```

### Component Properties
Each component accepts props for customization:
- **Button**: `{ text, variant }`
- **Card**: `{ title, description }`
- **Input**: `{ label, placeholder }`
- **Navbar**: `{ brand, links }`

## 🚦 Communication Flow

1. **User Action** → UI captures event
2. **UI → Plugin**: `parent.postMessage({ pluginMessage: data })`
3. **Plugin Processing**: Creates Figma components
4. **Plugin → UI**: `figma.ui.postMessage({ type: 'success' })`
5. **UI Update**: Shows success/error state

## 🐛 Debugging Tips

### Common Issues and Solutions

1. **Font Loading Errors**
   - Always preload fonts before creating text
   - Use try-catch for font loading
   - Provide fallback fonts

2. **Message Passing**
   - Ensure proper message structure
   - Handle all message types
   - Add error boundaries

3. **Component Creation**
   - Check viewport bounds
   - Validate properties
   - Handle async operations properly

### Console Logging
Strategic logging for debugging:
```javascript
console.log('[FigBud] Starting...');
console.log('[FigBud] Fonts loaded');
console.log('[FigBud] Message from UI:', msg);
```

## 📈 Performance Optimizations

1. **Font Caching**: Load fonts once at startup
2. **Efficient Messaging**: Batch operations when possible
3. **Minimal DOM Updates**: Direct manipulation instead of re-rendering
4. **Lazy Loading**: Load features as needed

## 🔒 Security Considerations

1. **Input Validation**: Sanitize all user inputs
2. **Message Validation**: Verify message structure
3. **API Keys**: Store securely (future implementation)
4. **CORS**: Handle cross-origin requests properly

## 🚀 Future Enhancements

### Planned Features
1. **AI Integration**: Connect to OpenAI API
2. **Supabase Backend**: User data persistence
3. **Component Library**: Expanded component set
4. **Real-time Collaboration**: Multi-user support

### Architecture Considerations
- Keep vanilla JS for stability
- Modular component system
- Progressive enhancement
- Maintain Figma compatibility

## 📝 Development Workflow

### Making Changes
1. Edit `code.js` for logic changes
2. Edit `ui.html` for interface updates
3. Test in Figma Desktop app
4. No build process required!

### Testing
1. Open Figma Desktop
2. Plugins → Development → Import plugin from manifest
3. Make changes and reload (Cmd+Option+P)
4. Check console for errors

### Git Workflow
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add vanilla JS implementation with Once UI

- Replace React with vanilla JavaScript
- Implement Once UI design system
- Fix Figma compatibility issues
- Add comprehensive documentation"

# Push to remote
git push origin main
```

## 🎯 Key Takeaways

1. **Simplicity Wins**: Vanilla JS works perfectly for Figma plugins
2. **Figma Constraints**: Understanding platform limitations is crucial
3. **Standard Structure**: Use Figma's recommended file structure
4. **Documentation**: Maintain clear documentation for future developers

## 📚 Resources

- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Once UI Design System](https://once-ui.com)
- [Figma Plugin Samples](https://github.com/figma/plugin-samples)

---

**Last Updated**: December 2024
**Maintained By**: FigBud Development Team
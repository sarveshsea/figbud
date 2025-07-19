# FigBud Plugin - AI Assistant for Figma

FigBud is an AI-powered Figma plugin that helps you create beautiful UI components using the Once UI design system. It features a chat interface, quick component creation, and a sandbox mode for organized design work.

## Features

### 🤖 AI Chat Assistant
- Natural language interface for creating components
- Helpful tips and Figma learning assistance
- Understands commands like "create a button" or "build a form"

### 🎨 Once UI Components
- **Button** - Styled action buttons
- **Card** - Content containers with dark theme
- **Input** - Text input fields
- **Toggle** - On/off switches
- **Checkbox** - Multi-selection controls
- **Radio** - Single selection options
- **Badge** - Status indicators
- **Textarea** - Multi-line text inputs
- **Dropdown** - Selection menus

### 📦 Sandbox Mode
- Creates a special workspace (800x600px)
- Blue dashed border with transparent background
- Automatically organizes created components
- Toggle on/off as needed

### 🚀 Quick Commands
- Access from Plugins menu without opening UI
- Quick Create Button
- Quick Create Card

### 🐛 Debug Console
- Click the robot logo to toggle
- Real-time operation logging
- Error tracking and diagnostics
- Persistent debug preference

## Installation

1. Download or clone this repository
2. Open Figma Desktop App
3. Go to **Plugins → Development → Import plugin from manifest**
4. Select the `manifest.json` file from the figbud directory
5. The plugin will appear in your Plugins menu

## Usage

### Opening the Plugin
1. Go to **Plugins → FigBud AI Assistant → Open FigBud Assistant**
2. The plugin window will open with the chat interface

### Creating Components via Chat
Type natural language commands:
- "Create a button"
- "Make a card"
- "Build a form" (creates inputs + button)
- "Add a toggle switch"
- "Show me all components"

### Using Quick Create Buttons
Click any button in the right panel:
- Button, Card, Input, Toggle
- Checkbox, Radio, Badge
- Textarea, Dropdown

### Sandbox Mode
1. Click the "📦 Sandbox Mode" toggle
2. A special frame is created for your components
3. All new components are placed inside
4. Toggle off to place components freely

### Debug Mode
1. Click the robot logo (🤖)
2. Debug console appears at bottom
3. Shows all operations with timestamps
4. Helps diagnose any issues

## File Structure

```
figbud/
├── manifest.json          # Plugin configuration
├── code.js               # Backend plugin logic
├── ui.html               # UI interface
├── supabase-schema.sql   # Database schema (optional)
├── PLUGIN_README.md      # This file
├── PLUGIN_TESTING_GUIDE.md # Testing documentation
└── SUPABASE_SETUP.md     # Database setup guide
```

## Architecture

### Backend (code.js)
- Handles all Figma API operations
- Component creation logic
- Sandbox management
- Message routing
- Error handling with try-catch blocks
- Comprehensive logging system

### Frontend (ui.html)
- Glassmorphism design with purple gradient
- Three-panel layout
- Real-time chat interface
- Debug console
- State management
- Error boundaries

### Communication
- Uses Figma's `postMessage` API
- Structured message types
- Bidirectional error handling
- Async/await for all operations

## Troubleshooting

### Plugin Won't Load
- Ensure you selected `manifest.json` (not any other JSON)
- Check Figma console for errors
- Restart Figma and reimport

### Components Not Creating
- Make sure you have a file open
- Check if Inter font is available
- Look for errors in debug console

### Chat Not Responding
- Click in the input field to focus
- Press Enter (not Shift+Enter) to send
- Check debug console for errors

### Sandbox Issues
- Only one sandbox can exist at a time
- Ensure you have edit permissions
- Try toggling off and on again

## Development

### Making Changes
1. Edit `code.js` for backend changes
2. Edit `ui.html` for UI changes
3. No build process required
4. Reload plugin in Figma to test

### Adding New Components
1. Add creation function in `code.js`
2. Add button in `ui.html`
3. Add chat pattern matching
4. Test thoroughly

### Debugging
1. Use `console.log('[FigBud] message')` for logging
2. Enable debug console in UI
3. Check Figma's developer console
4. Use try-catch blocks for error handling

## Best Practices

### Performance
- Async font loading
- Debounced operations
- Efficient DOM updates
- Minimal re-renders

### Error Handling
- Try-catch around all operations
- User-friendly error messages
- Graceful fallbacks
- Comprehensive logging

### User Experience
- Immediate visual feedback
- Loading states
- Clear error messages
- Helpful notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using PLUGIN_TESTING_GUIDE.md
5. Submit a pull request

## License

MIT License - feel free to use and modify

## Support

For issues or questions:
1. Check the troubleshooting section
2. Enable debug mode for more info
3. Create an issue with debug logs
4. Include Figma version and OS

## Roadmap

- [ ] AI integration with OpenAI/Claude
- [ ] More component templates
- [ ] Component customization panel
- [ ] Preset themes
- [ ] Export to code feature
- [ ] Team collaboration features

---

Built with ❤️ for the Figma community
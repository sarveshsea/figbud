# FigBud Plugin Test Instructions

## Installation
1. Open Figma Desktop
2. Go to Menu → Plugins → Development → Import plugin from manifest...
3. Navigate to the FigBud folder and select `manifest.json`

## Testing Steps

### 1. Basic Plugin Loading
- Right-click on canvas → Plugins → Development → FigBud AI Assistant → Open FigBud AI
- The UI should load without infinite loading state
- No font loading errors should appear in the console

### 2. Quick Create Commands
Test each quick create command:
- Right-click → Plugins → FigBud AI Assistant → Quick Create Button
- Right-click → Plugins → FigBud AI Assistant → Quick Create Card
- Right-click → Plugins → FigBud AI Assistant → Quick Create Input

Each should create a component without errors.

### 3. Chat Interface
- Open the main UI
- Type "create a button" in the chat
- The plugin should create a button component

### 4. Console Monitoring
Open the Developer Console (Plugins → Development → Show/Hide Console) and watch for:
- No font loading errors
- No syntax errors
- Successful initialization messages

## Expected Results
- ✅ Plugin loads without errors
- ✅ Quick create commands work
- ✅ Components are created with proper fonts (Inter or Roboto)
- ✅ UI displays correctly without infinite loading

## Troubleshooting
If you see font errors, reload the plugin:
- Plugins → Development → FigBud AI Assistant → Remove plugin
- Re-import from manifest.json
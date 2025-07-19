# FigBud Widget Import Guide

## Steps to Import the Widget in Figma

### 1. Clean Previous Installation
- Open Figma Desktop App (not browser)
- Go to **Menu → Widgets → Development → Manage widgets in development**
- Remove any existing FigBud widgets if present
- Also check your widgets panel and remove any FigBud instances

### 2. Import the Updated Widget
1. In Figma Desktop, go to **Menu → Widgets → Development → Import widget from manifest**
2. Navigate to your `figbud` folder
3. Select the `manifest.json` file
4. Click **Open**

### 3. Verify Import Success
- Check the console for debug messages:
  - Open **Widgets → Development → Open console**
  - You should see:
    ```
    [FigBud] Starting widget initialization...
    [FigBud] Widget components loaded
    [FigBud] Registering widget...
    [FigBud] Widget registered successfully!
    ```

### 4. Use the Widget
1. Open the widgets panel (right sidebar → Resources → Widgets)
2. Look for "FigBud Widget" in your widgets
3. Drag it onto your canvas
4. The widget should appear with:
   - Dark theme (#0A0A0A background)
   - "FigBud" title with robot emoji
   - Free badge
   - Chat toggle button (💬)

### 5. Test Widget Functionality
1. Click the 💬 button to expand the widget
2. You should see:
   - Welcome message
   - Quick Create buttons (Button, Card, Input)
   - Sandbox mode button
   - Component counter
3. Click any button to test component creation

## Troubleshooting

### Widget Not Appearing in Panel
- Make sure you're using Figma Desktop (not browser)
- Check the manifest ID is unique: `figbud-widget-once-ui-v3`
- Try quitting and reopening Figma

### Console Errors
- Check the console for any error messages
- Look for "[FigBud]" prefixed messages
- If you see "widget missing call to figma.widget.register", the build may have failed

### Widget Crashes
- Check if `dist/code.js` exists and is not empty
- Run `npm run build:widget` to rebuild
- Make sure no TypeScript/React code is in the widget file

## What Changed
1. **Manifest**: Removed `ui` field, changed ID to be unique
2. **Build**: Created dedicated widget build without plugin UI
3. **Debug**: Added console logging to track initialization
4. **Structure**: Pure widget without hybrid plugin functionality
# Fix FigBud Plugin Loading Issues

## The Problem
Figma is showing two errors:
1. `figma.widget.register is not a function` - Old widget code cached
2. File not found error - Figma looking in wrong location

## Solution Steps

### 1. Remove the Old Plugin from Figma
1. In Figma, go to **Plugins → Development → Manage plugins in development**
2. Find "FigBud" or any similar plugin
3. Click the **trash icon** to remove it completely
4. Close all Figma tabs/windows

### 2. Clear Figma Cache (Important!)
- **Mac**: Quit Figma completely, then in Finder press Cmd+Shift+G and go to:
  ```
  ~/Library/Application Support/Figma
  ```
  Delete the `plugin_data` folder if it exists

### 3. Rebuild the Plugin
In terminal:
```bash
cd /Users/sarveshchidambaram/Desktop/figbud
npm run build
```

### 4. Verify Files Exist
```bash
ls -la code.js ui.html
```
Both files should exist in the root directory.

### 5. Re-import the Plugin
1. Open Figma Desktop App (not web)
2. Create a new file or open any file
3. Go to **Plugins → Development → Import plugin from manifest**
4. Navigate to `/Users/sarveshchidambaram/Desktop/figbud`
5. Select `manifest.json`
6. Click "Import plugin"

### 6. Test the Plugin
- Try: **Plugins → FigBud AI Assistant → Quick Create Button**
- This should create a button without opening the UI
- Then try: **Plugins → FigBud AI Assistant → Open FigBud AI**

## If Still Having Issues

### Option A: Create a Fresh Build
```bash
# Clean everything
rm -rf dist/
rm code.js ui.html

# Rebuild
npm run build

# Verify files were created
ls -la code.js ui.html
```

### Option B: Check Console
1. In Figma: **Plugins → Development → Show/Hide console**
2. Look for any specific error messages
3. Try running a command and see what errors appear

## Common Fixes
- Make sure you're using Figma Desktop, not web version
- Ensure the backend server is running: `npm run server:dev`
- The manifest.json must have `"main": "code.js"` and `"ui": "ui.html"`
- Both code.js and ui.html must be in the root directory (not in dist/)
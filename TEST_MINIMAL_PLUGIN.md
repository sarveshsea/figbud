# Test Minimal FigBud Plugin

## What We've Done
1. ✅ Generated a new plugin ID: `figbud-plugin-1752945749024-7vkfms1rj`
2. ✅ Created minimal plugin code (no widget references)
3. ✅ Created simple UI HTML
4. ✅ Cleaned all build artifacts

## Test Steps

### 1. Remove Old Plugin (IMPORTANT!)
1. In Figma, go to **Plugins → Development → Manage plugins in development**
2. **Delete** any existing FigBud entries
3. Close and restart Figma Desktop

### 2. Import Fresh Plugin
1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest**
3. Navigate to `/Users/sarveshchidambaram/Desktop/figbud`
4. Select `manifest.json`
5. Click "Import plugin"

### 3. Test the Plugin
1. Try: **Plugins → FigBud AI Assistant → Quick Create Button**
   - Should create a blue button without opening UI
   - Should show notification "✅ Test button created!"
   
2. Try: **Plugins → FigBud AI Assistant → Open FigBud AI**
   - Should open a simple UI with title and close button
   - Check console for any errors

### 4. Check Console
- **Plugins → Development → Show/Hide console**
- Look for:
  - `[FigBud Plugin] Starting minimal test version...`
  - `[FigBud Plugin] Minimal version ready!`
  - NO widget.register errors!

## Expected Result
- ✅ No widget errors
- ✅ Plugin loads successfully
- ✅ Commands work properly
- ✅ UI displays without issues

## If This Works
Once the minimal version works without errors, we can:
1. Build the full plugin with webpack
2. Restore all AI and sandbox features
3. Everything should work properly

## If Still Getting Errors
1. The plugin ID might be cached - try generating another new ID
2. Clear Figma cache completely
3. Try in a different Figma file
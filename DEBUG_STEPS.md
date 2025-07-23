# FigBud UI Debug Steps

## Current Status
- Plugin backend loads successfully
- UI is stuck on "Loading FigBud..." screen
- All dependencies are now bundled into single ui.js file

## To Debug in Figma

1. **Open Developer Console**
   - Plugins → Development → Show/Hide Console

2. **Look for These Log Messages**
   ```
   [FigBud UI] Script loaded, checking if DOM is ready...
   [FigBud UI] DOM loaded, starting React initialization...
   [FigBud UI] Root container: [object]
   [FigBud UI] Creating React root...
   [FigBud UI] Rendering App with OnceUIProvider...
   [FigBud UI] React render call completed
   [FigBud UI] App component mounting...
   [FigBud UI] App mounted successfully!
   ```

3. **If You See Errors**
   - Look for "[FigBud UI] Failed to render React app:" messages
   - Check for any JavaScript errors in the console

## Quick Fixes to Try

1. **Reload the Plugin**
   - Close the plugin window
   - Right-click → Plugins → FigBud → Open FigBud AI

2. **Clear and Re-import**
   - Remove the plugin from Figma
   - Re-import via manifest.json

3. **Test Quick Commands**
   - Even if UI is stuck, try: Quick Create Button
   - This confirms the backend is working

## What We Fixed
1. ✅ Removed code splitting that was preventing React from loading
2. ✅ Bundled everything into single ui.js file
3. ✅ Added DOM ready checks and error handling
4. ✅ Added extensive debug logging
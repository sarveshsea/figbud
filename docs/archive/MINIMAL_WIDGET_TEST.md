# Minimal Widget Test Instructions

## What We've Done
1. **Deleted everything** in the dist folder
2. **Created minimal widget** with no network calls, no API requests
3. **Removed all webpack wrapping** - pure JavaScript only
4. **Simplified manifest** - removed all permissions and network access

## Test Steps

### 1. Complete Fresh Start
1. In Figma Desktop App:
   - Go to **Menu → Widgets → Development → Manage widgets in development**
   - Remove ALL widgets that start with "FigBud"
   - Quit Figma completely (Cmd+Q)

### 2. Reopen and Import
1. Open Figma Desktop App
2. Create a new file
3. Go to **Menu → Widgets → Development → Import widget from manifest**
4. Navigate to your `figbud` folder
5. Select `manifest.json`
6. Click **Open**

### 3. Test the Widget
1. Open widgets panel (Resources → Widgets)
2. Look for "FigBud Widget Test"
3. Drag it onto canvas
4. You should see:
   - Dark gray box (#1A1A1A)
   - "FigBud Widget Test" in white
   - "Widget is loading correctly!" in gray

## If This Works
Then we know:
- ✅ Widget loading system works
- ✅ Manifest is correct
- ✅ No webpack issues

We can then gradually add back the Once UI features.

## If This Doesn't Work
Then the issue is:
- Figma installation problem
- Manifest format issue
- File permissions problem

## Current Widget Code
The widget is now just 29 lines of pure JavaScript with:
- No imports
- No network calls
- No complex UI
- Just `figma.widget.register()` with simple AutoLayout
# FigBud Final Setup Instructions

## ✅ What We've Fixed

1. **Widget Code**: Updated to use proper widget syntax
2. **Network Permissions**: Added localhost and Supabase URLs to manifest
3. **DROP_SHADOW Effects**: Removed all unsupported effects
4. **Once UI Design**: Implemented throughout the widget

## 🚀 Steps to Complete Setup

### Step 1: Reload Widget in Figma (CRITICAL)

The widget registration error happens because Figma is still using the old code. You must:

1. **Completely remove the old widget**:
   - In Figma, go to the widgets panel
   - Right-click on FigBud widget
   - Select "Remove from file"
   - Also go to Menu > Widgets > Development > Manage widgets in development
   - Remove FigBud if it's listed there

2. **Clear Figma cache**:
   - Quit Figma completely (Cmd+Q on Mac)
   - Reopen Figma

3. **Re-import the widget**:
   - Go to Menu > Widgets > Development > Import widget from manifest
   - Navigate to your figbud folder
   - Select `manifest.json`
   - The widget should now appear in your widgets panel

4. **Test the widget**:
   - Drag the FigBud widget onto your canvas
   - You should see a dark-themed widget with "FigBud" title
   - Click the 💬 button to expand it

### Step 2: Set Up Supabase Tables

1. **Go to Supabase Dashboard**:
   - URL: https://app.supabase.com
   - Login to your account
   - Select your project (faummrgmlwhfehylhfvx)

2. **Navigate to SQL Editor**:
   - Click "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Run the Setup Script**:
   - Open the file: `supabase-setup.sql`
   - Copy ALL contents (Cmd+A, Cmd+C)
   - Paste into the SQL editor
   - Click the "Run" button

4. **Verify Tables**:
   - Go to "Table Editor" in the sidebar
   - You should now see 7 tables
   - Check "once_ui_components" - should have 5 rows
   - Check "tutorials" - should have 3 rows

### Step 3: Test Widget Functionality

Once the widget loads correctly:

1. **Test Quick Create Buttons**:
   - Click "Button" - should create a blue button on canvas
   - Click "Card" - should create a dark card component
   - Click "Input" - should create an input field

2. **Test Sandbox Mode**:
   - Click "🎮 Enter Sandbox Mode"
   - Should create a large frame with dashed border
   - Background should be slightly blue with low opacity

3. **Verify Once UI Styling**:
   - Dark theme (#0A0A0A background)
   - Blue primary color (#6366F1)
   - Proper spacing and rounded corners

## 🔧 Troubleshooting

### If widget still shows "missing call to figma.widget.register":
1. Make sure you ran `npm run build` (already done ✓)
2. Check that dist/code.js exists and is not empty
3. Try importing the widget from a different Figma file
4. Clear browser cache if using Figma web

### If Supabase tables don't appear:
1. Check for any red error messages in SQL editor
2. Try running the commands one section at a time
3. Make sure you're logged in as project owner
4. If "uuid-ossp extension" error appears, it's already enabled - continue

### If network errors persist:
1. Ensure you've completely removed and re-imported the widget
2. The manifest.json now includes localhost permissions
3. Backend server isn't required for basic widget functionality

## ✨ Success Indicators

You'll know everything is working when:
- ✅ Widget appears on canvas with dark Once UI theme
- ✅ Clicking buttons creates styled components
- ✅ Sandbox mode creates the dashed border frame
- ✅ Supabase shows 7 tables with sample data
- ✅ No more "widget registration" errors

## 📝 Next Steps

After successful setup:
1. The widget works standalone without backend
2. Components are created directly on canvas
3. Supabase is ready for future AI integration
4. Once UI design system is fully implemented

Good luck! The widget should now work perfectly with the Once UI design system.
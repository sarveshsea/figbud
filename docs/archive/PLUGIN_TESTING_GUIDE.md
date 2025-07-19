# FigBud Plugin Testing Guide

## Installation

1. Open Figma Desktop App
2. Go to **Plugins → Development → Import plugin from manifest**
3. Navigate to the `figbud` directory
4. Select `manifest.json` (NOT any other JSON file)
5. Click "Open"

## Testing Checklist

### 1. Basic Plugin Loading
- [ ] Plugin appears in Plugins menu
- [ ] "Open FigBud Assistant" command is visible
- [ ] Quick commands (Button, Card) are visible
- [ ] Plugin opens without errors

### 2. UI Testing
- [ ] Plugin window opens at 600x700 size
- [ ] Glassmorphism design loads correctly
- [ ] All panels are visible (left, chat, right)
- [ ] Component counter shows "0" initially
- [ ] Chat input is focused on load

### 3. Chat Functionality
- [ ] Can type in chat input
- [ ] Enter key sends message
- [ ] User messages appear on right
- [ ] Bot responses appear on left
- [ ] Typing indicator shows during processing
- [ ] Welcome message appears after load

### 4. Component Creation
Test each component type:
- [ ] Button - Creates blue button with "Click me" text
- [ ] Card - Creates dark card with title and description
- [ ] Input - Creates input field with placeholder
- [ ] Toggle - Creates toggle switch
- [ ] Checkbox - Creates small checkbox
- [ ] Radio - Creates radio button
- [ ] Badge - Creates blue badge
- [ ] Textarea - Creates larger text input
- [ ] Dropdown - Creates dropdown with arrow

### 5. Sandbox Mode
- [ ] Sandbox toggle works
- [ ] Creates 800x600 frame with blue dashed border
- [ ] Components are placed inside sandbox when active
- [ ] Sandbox can be removed
- [ ] Components place on canvas when sandbox is off

### 6. Quick Commands
- [ ] "Quick Create Button" menu item works
- [ ] "Quick Create Card" menu item works
- [ ] Components are created without opening UI

### 7. Chat Commands
Test these messages:
- [ ] "help" - Shows available commands
- [ ] "create a button" - Creates button
- [ ] "make a card" - Creates card
- [ ] "build a form" - Creates 2 inputs and button
- [ ] "create all components" - Creates one of each

### 8. Debug Console
- [ ] Click robot logo toggles debug console
- [ ] Console shows timestamped logs
- [ ] Different log levels have different colors
- [ ] Debug preference is saved

### 9. Error Handling
- [ ] Invalid commands show error messages
- [ ] Network errors are handled gracefully
- [ ] Component creation failures show notifications
- [ ] UI remains responsive during errors

### 10. Performance
- [ ] Plugin loads quickly (< 2 seconds)
- [ ] Components create instantly
- [ ] No lag when typing in chat
- [ ] Smooth animations throughout

## Common Issues & Solutions

### Plugin Won't Load
1. Make sure you selected `manifest.json` (not `plugin-manifest.json`)
2. Check console for errors (View → Show/Hide UI → Console)
3. Restart Figma and try again

### Components Not Creating
1. Check if fonts are available (Inter)
2. Ensure you have a file open
3. Check console for specific errors

### Chat Not Working
1. Click inside chat input to focus
2. Make sure to press Enter (not Shift+Enter)
3. Check debug console for errors

### Sandbox Issues
1. Make sure no existing "FigBud Sandbox" frame exists
2. Check if you have edit permissions
3. Try toggling sandbox off and on again

## Debug Mode

1. Click the robot logo to enable debug mode
2. All operations will be logged with timestamps
3. Check for errors in red
4. Debug preference persists between sessions

## Reporting Issues

When reporting issues, please include:
1. Screenshot of the error
2. Contents of debug console
3. Steps to reproduce
4. Figma version
5. Operating system

## Advanced Testing

### Memory Leaks
1. Create 50+ components
2. Toggle sandbox multiple times
3. Send many chat messages
4. Monitor Figma memory usage

### Edge Cases
1. Very long chat messages
2. Rapid component creation
3. Multiple sandbox toggles
4. Closing plugin during operations

## Success Criteria

The plugin is working correctly when:
- ✅ All components create successfully
- ✅ Chat responds appropriately
- ✅ Sandbox mode works reliably
- ✅ No console errors during normal use
- ✅ UI remains responsive
- ✅ Debug logging provides useful information
# LoadingInsights Visual Test Instructions

## Setup
1. Make sure the server is running: `npm run server`
2. Build the plugin: `npm run build:figma`
3. Open Figma and run the plugin

## Test Steps

### Test 1: Basic Loading Display
1. Type any question in the chat: "how do i do autolayout"
2. **Expected**: You should see:
   - Initially: "FigBud AI is thinking..." with animated sparkle icon
   - After 3s: "Analyzing your request..."
   - After 8s: "Searching for the best AI model..." with process cards appearing
   - After 15s: "Processing with advanced AI..." with model name shown

### Test 2: Process Cards
After 8 seconds, you should see process cards showing:
- ✅ Request Analysis (completed)
- 🔄 AI Model Selection (active with pulsing animation)
- ⏳ Tutorial Search (pending)
- ⏳ Response Generation (pending)

### Test 3: Progress Bar
After 10 seconds, a progress bar should appear showing completion percentage

### Test 4: Long Wait Message
If response takes more than 45 seconds:
- Message changes to "Taking longer than usual. Quality takes time!"
- Additional reassurance message appears

## Visual Elements to Verify

1. **Loading Container**:
   - Should have glass morphism effect matching dark theme
   - Proper spacing and alignment
   - Smooth slide-in animation

2. **Process Icons**:
   - Pending: Gray background
   - Active: Blue background with pulsing ring animation
   - Completed: Green checkmark

3. **Typography**:
   - Clear hierarchy with different font sizes
   - Proper contrast for readability
   - Status messages in neutral weak color

4. **Animations**:
   - Sparkle icon pulsing
   - Process card slide-in
   - Progress bar smooth transition
   - Active process pulse effect

## Debugging

If you still see only dots:
1. Check browser console for errors
2. Verify LoadingInsights is imported in ChatWindow
3. Ensure loadingStartTime is being set
4. Check that loading prop is true during API calls

## Success Criteria
✅ Progressive status messages appear based on time
✅ Process cards show with proper states
✅ Model information displays when available
✅ Progress bar appears after 10 seconds
✅ Long wait reassurance message shows after 45 seconds
✅ All animations are smooth and visible
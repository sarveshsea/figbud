# How to Enable AI Chat in FigBud

## Quick Start

1. **Start the Backend Server**
   ```bash
   # In the figbud directory
   npm run server
   ```
   
   You should see:
   ```
   🚀 FigBud server running on port 3000
   ```

2. **Verify Server is Running**
   Open your browser and go to: http://localhost:3000/api/health
   
   You should see:
   ```json
   {"status":"ok","timestamp":"2025-07-21T..."}
   ```

3. **Required Environment Variables**
   Make sure you have a `.env` file with at least:
   ```
   OPENROUTER_API_KEY=your_key_here
   ```
   
   Optional but recommended:
   ```
   DEEPSEEK_API_KEY=your_key_here
   YOUTUBE_API_KEY=your_key_here
   ```

## Troubleshooting

### "Server is not running" error
- Make sure you ran `npm install` first
- Check if port 3000 is already in use
- Look for errors in the terminal where you ran `npm run server`

### API calls failing from Figma
- The server must be running on http://localhost:3000
- CORS is already configured to allow Figma plugin requests
- Check browser console for specific error messages

### No AI responses
Without the server running, FigBud falls back to basic pattern matching. To get:
- Natural language conversations
- YouTube tutorial recommendations
- Intelligent component suggestions
- Context-aware responses

You MUST have the server running.

## How It Works

1. You type a message in FigBud
2. The UI makes an API call to localhost:3000
3. The server uses AI (via OpenRouter/DeepSeek) to understand your request
4. AI generates a conversational response with:
   - Natural language explanation
   - Component specifications (if requested)
   - Relevant YouTube tutorials
   - Learning suggestions
5. The response is displayed in the chat

## Example Conversations (with AI enabled)

**You**: "I need help with my design"
**FigBud**: "I'd love to help with your design! 🎨 What specifically are you working on? Are you creating a new interface, improving an existing design, or looking for inspiration? I can help you create components like buttons, cards, forms, or guide you through design principles."

**You**: "I want to create a new component"
**FigBud**: "Exciting! Creating custom components is a great way to build a consistent design system. What type of component did you have in mind? Some popular ones I can help with are:
- Buttons (for actions and CTAs)
- Cards (for displaying content)
- Input fields (for forms)
- Navigation bars (for site structure)
- Modals (for focused interactions)

Just describe what you need and I'll guide you through it!"

**You**: "Show me how to make buttons"
**FigBud**: "Let's dive into button design! 🎯 Buttons are one of the most important UI elements - they're how users take action in your interface. I'll create a primary button for you to start with..."
[Creates button component]
[Shows relevant YouTube tutorials with timestamps]
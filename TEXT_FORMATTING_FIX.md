# Text Formatting Fix - FigBud Chat Response

## Issue
The AI responses were showing raw JSON instead of formatted messages:
```json
{"message":"Hi there! I'm FigBud...","componentType":null,"properties":null,"teacherNote":"...","suggestions":[...]}
```

## Root Cause
The AI providers (DeepSeek, OpenRouter) were returning JSON-formatted responses, but the backend was passing the raw JSON string as the message text instead of parsing it and extracting the `message` field.

## Fix Applied

### 1. Streaming Endpoint (`/server/routes/chat-stream.ts`)
Added JSON parsing before sending the response:
```typescript
// Parse the response text if it's JSON
let parsedResponse;
let displayText;
try {
  parsedResponse = JSON.parse(aiResponse.text);
  displayText = parsedResponse.message || aiResponse.text;
} catch (e) {
  // If not JSON, use as-is
  parsedResponse = { message: aiResponse.text };
  displayText = aiResponse.text;
}

// Send the parsed message text
res.write(`event: ai_response\ndata: ${JSON.stringify({
  text: displayText,  // Now sends the actual message, not JSON
  metadata: {
    ...aiResponse.metadata,
    ...parsedResponse,
    responseTime: aiDuration,
    fromCache: !!cachedAIResponse
  },
  provider: aiResponse.provider
})}\n\n`);
```

### 2. Regular Chat Endpoint (`/server/routes/chat.ts`)
Updated to use parsed message as primary text:
```typescript
const formattedResponse = {
  text: parsedResponse.message || response.text, // Use parsed message
  parsedResponse,
  message: parsedResponse.message || response.text,
  metadata: {
    ...response.metadata,
    ...parsedResponse,
    // ... other metadata
  }
};
```

## Result
Now the chat will display properly formatted messages:
- ✅ "Hi there! 👋 I'm FigBud, your friendly Figma design assistant..."
- ✅ Teacher notes appear in the styled box
- ✅ Suggestions appear as clickable buttons
- ✅ Component metadata is stored but not displayed as raw JSON

## Testing
1. Send any message to the chat
2. The response should show as normal conversational text
3. Teacher notes should appear in the blue box
4. Suggestions should appear as buttons below the message

The fix is now live - restart your server to see the properly formatted messages!
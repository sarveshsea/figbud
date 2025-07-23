# 🚨 Final Steps to Fix API Calls

## Current Status
✅ Backend server is running on port 3000
✅ API endpoints work (tested with debug-api.js)
✅ localhost:3000 URL is in the built plugin code
✅ DeepSeek off-hours discount is active

## You MUST Do These Steps:

### 1. **Completely Remove and Re-import Plugin**
```
1. In Figma: Plugins → Development → FigBud → Remove from Figma
2. Close Figma completely
3. Reopen Figma
4. Plugins → Development → Import plugin from manifest
5. Select manifest.json from figbud folder
```

### 2. **Open Browser Console BEFORE Running Plugin**
```
1. In Figma: View → Developer → JavaScript Console
2. Clear the console (Cmd+K or right-click → Clear)
3. Keep console open
```

### 3. **Run the Plugin and Watch Console**
```
1. Run FigBud plugin
2. Look for these logs in console:
   - [OpenRouterService] Backend available: true/false
   - If false, there's still a connection issue
```

### 4. **Test a Message**
```
1. Type: "Create a primary button"
2. Watch console for:
   - [OpenRouterService] Calling backend API...
   - [OpenRouterService] Backend response: {...}
```

## If Still Getting Robotic Responses:

### Check Network Tab
1. In browser console, go to Network tab
2. Clear network log
3. Send a message in chat
4. Look for POST request to localhost:3000/api/chat/message
5. If no request, the plugin isn't making API calls

### Check for CORS Errors
1. Look in console for errors like:
   - "blocked by CORS policy"
   - "Failed to fetch"
   - "net::ERR_CONNECTION_REFUSED"

### Verify Server is Still Running
```bash
curl http://localhost:3000/api/health
```

## The Fix Should Work Because:
- ✅ Server is running and responding
- ✅ API endpoints are working
- ✅ URL is in the built code
- ✅ CORS is configured for development

**The plugin just needs to be completely reloaded in Figma to pick up the changes!**
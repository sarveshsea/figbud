#!/bin/bash

echo "🧪 Testing FigBud Backend..."
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:3000/health | jq '.'
echo ""

# Test CORS headers
echo "2️⃣ Testing CORS headers..."
curl -s -I http://localhost:3000/health | grep -i "access-control"
echo ""

# Test chat endpoint
echo "3️⃣ Testing chat endpoint (this might take a moment)..."
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","context":{}}' | jq '.'
echo ""

# Test cache stats
echo "4️⃣ Testing cache stats..."
curl -s http://localhost:3000/api/cache/stats | jq '.'

echo ""
echo "✅ If you see JSON responses above, your backend is working!"
echo "❌ If you see connection errors, run ./start-server.sh first"
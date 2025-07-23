#!/bin/bash

# Start FigBud Backend Server

echo "🚀 Starting FigBud Backend Server..."
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please configure your .env file with API keys and run this script again."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Validate environment variables
echo "✅ Validating environment..."
npm run validate:env

# Check if validation passed
if [ $? -ne 0 ]; then
    echo "❌ Environment validation failed!"
    echo "Please check your .env file and ensure all required variables are set."
    exit 1
fi

# Start the server
echo ""
echo "🎯 Starting server on http://localhost:3000"
echo "=================================="
echo ""

# Use npm run server for production or server:dev for development with auto-restart
if [ "$1" = "dev" ]; then
    npm run server:dev
else
    npm run server
fi
#!/bin/bash

# Atlas Voice Extension - Local Server Startup Script
# This script starts the local server with Piper TTS support

echo "🚀 Starting Atlas Voice Extension Local Server..."
echo ""

# Check if .env file exists
if [ ! -f "dev/server/.env" ]; then
    echo "⚠️  No .env file found!"
    echo "Copying from .env.example..."
    cp dev/server/.env.example dev/server/.env
    echo "✅ Created .env file"
    echo "⚠️  Please edit dev/server/.env and add your API keys"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "dev/server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd dev/server
    npm install
    cd ../..
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if Piper venv exists
if [ ! -d "piper-tts/venv" ]; then
    echo "⚠️  Piper TTS virtual environment not found"
    echo "Piper TTS will not be available"
    echo "To install Piper TTS, run: cd piper-tts && python3 -m venv venv && source venv/bin/activate && pip install piper-tts"
    echo ""
fi

echo "🌐 Starting server on http://localhost:8787"
echo "📝 Press Ctrl+C to stop the server"
echo ""
echo "---"
echo ""

# Start the server
cd dev/server && npm run dev

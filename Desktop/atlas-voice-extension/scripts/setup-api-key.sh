#!/bin/bash

# Secure OpenAI API Key Setup Script
# Adds API key to Vercel environment variables

set -e

echo "🔐 OpenAI API Key Setup"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo ""
    echo "Installing Vercel CLI..."
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
    echo ""
fi

# Check if logged in to Vercel
echo -e "${BLUE}Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Vercel. Please log in:${NC}"
    vercel login
fi

echo -e "${GREEN}✅ Authenticated with Vercel${NC}"
echo ""

# Read API key securely
echo -e "${YELLOW}Please paste your OpenAI API key:${NC}"
echo -e "${BLUE}(It should start with 'sk-')${NC}"
echo ""
read -s API_KEY
echo ""

# Validate API key format
if [[ ! $API_KEY =~ ^sk- ]]; then
    echo -e "${RED}❌ Invalid API key format. Must start with 'sk-'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ API key format validated${NC}"
echo ""

# Add to Vercel environment variables
echo -e "${YELLOW}Adding API key to Vercel environment variables...${NC}"

cd /Users/ekodevapps/Desktop/atlas-voice-extension

# Add environment variable for production, preview, and development
vercel env add OPENAI_API_KEY production <<< "$API_KEY"
vercel env add OPENAI_API_KEY preview <<< "$API_KEY"
vercel env add OPENAI_API_KEY development <<< "$API_KEY"

echo -e "${GREEN}✅ API key added to Vercel${NC}"
echo ""

# Trigger redeployment
echo -e "${YELLOW}Triggering redeployment...${NC}"
vercel --prod

echo ""
echo "=" | tr '=' '='
echo "=" | tr '=' '='
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Your OpenAI API key has been securely added to Vercel.${NC}"
echo -e "${BLUE}Atlas can now analyze images!${NC}"
echo ""
echo "Next steps:"
echo "  1. Wait for Vercel deployment to finish (~1 minute)"
echo "  2. Reload Atlas extension in Chrome"
echo "  3. Try uploading an image!"
echo ""

# Clear API key from memory
API_KEY=""
unset API_KEY

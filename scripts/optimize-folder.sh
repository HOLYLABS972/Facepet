#!/bin/bash

# Folder Optimization Script
# Cleans up build artifacts and optimizes folder structure

set -e

echo "🧹 Starting folder optimization..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to get folder size
get_size() {
    if [ -d "$1" ] || [ -f "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "N/A"
    fi
}

# Show current sizes
echo "📊 Current folder sizes:"
echo "   node_modules: $(get_size node_modules)"
echo "   .next: $(get_size .next)"
echo "   public/assets: $(get_size public/assets)"
echo ""

# Clean Next.js build artifacts
if [ -d ".next" ]; then
    echo -e "${YELLOW}🗑️  Cleaning .next build folder...${NC}"
    NEXT_SIZE=$(get_size .next)
    rm -rf .next
    echo "   Removed .next ($NEXT_SIZE)"
fi

# Clean TypeScript build info
if [ -f "tsconfig.tsbuildinfo" ]; then
    echo -e "${YELLOW}🗑️  Cleaning TypeScript build info...${NC}"
    rm -f tsconfig.tsbuildinfo
    echo "   Removed tsconfig.tsbuildinfo"
fi

# Clean npm cache (optional, commented out by default)
# echo -e "${YELLOW}🗑️  Cleaning npm cache...${NC}"
# npm cache clean --force
# echo "   npm cache cleaned"

# Clean logs
if [ -d "logs" ]; then
    echo -e "${YELLOW}🗑️  Cleaning logs...${NC}"
    LOG_SIZE=$(get_size logs)
    find logs -type f -name "*.log" -delete 2>/dev/null || true
    echo "   Cleaned log files ($LOG_SIZE)"
fi

# Remove .DS_Store files (macOS)
echo -e "${YELLOW}🗑️  Removing .DS_Store files...${NC}"
DS_COUNT=$(find . -name ".DS_Store" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DS_COUNT" -gt 0 ]; then
    find . -name ".DS_Store" -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null || true
    echo "   Removed $DS_COUNT .DS_Store files"
else
    echo "   No .DS_Store files found"
fi

# Check for src.zip (backup file that might not be needed)
if [ -f "src.zip" ]; then
    ZIP_SIZE=$(get_size src.zip)
    echo -e "${YELLOW}📦 Found src.zip ($ZIP_SIZE)${NC}"
    echo "   Consider removing if not needed: rm src.zip"
fi

# Show final sizes
echo ""
echo -e "${GREEN}✅ Optimization complete!${NC}"
echo ""
echo "📊 Remaining folder sizes:"
echo "   node_modules: $(get_size node_modules)"
echo "   .next: $(get_size .next) (will be regenerated on next build)"
echo ""
echo "💡 Tips:"
echo "   - node_modules is required for the project to run"
echo "   - .next will be regenerated when you run 'npm run build'"
echo "   - To reduce node_modules size, check for unused dependencies"
echo "   - Run 'npm run analyze' to see bundle analysis"


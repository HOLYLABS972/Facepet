#!/bin/bash

# Clean build script for Facepet
# This script removes build artifacts and cache files to reduce repository size

echo "🧹 Cleaning Facepet build artifacts..."

# Remove Next.js build output
if [ -d ".next" ]; then
    echo "Removing .next directory..."
    rm -rf .next
fi

# Remove node_modules (will be reinstalled)
if [ -d "node_modules" ]; then
    echo "Removing node_modules directory..."
    rm -rf node_modules
fi

# Remove other build artifacts
echo "Removing other build artifacts..."
rm -rf out/
rm -rf build/
rm -rf dist/
rm -rf .vercel/

# Remove cache files
echo "Removing cache files..."
find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Remove OS files
echo "Removing OS files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true

echo "✅ Cleanup complete!"
echo "📦 Repository size:"
du -sh . 2>/dev/null || echo "Could not calculate size"

echo ""
echo "🚀 To rebuild:"
echo "  npm install"
echo "  npm run build"

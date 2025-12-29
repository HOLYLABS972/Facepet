# Folder Optimization Guide

This guide explains how to optimize your project folder size and improve site loading performance.

## 📊 Current Folder Sizes

- **node_modules**: ~929MB (required for project to run)
- **.next**: ~350MB (build cache - can be cleaned)
- **public/assets**: ~3.2MB (static assets)

## 🧹 Quick Cleanup

### Remove Build Artifacts

```bash
# Clean build artifacts (recommended)
npm run clean:optimize

# Or manually
rm -rf .next
rm -f tsconfig.tsbuildinfo
```

### Full Clean (including node_modules)

```bash
# WARNING: This will require npm install after
npm run clean
npm install
```

## 📦 Bundle Analysis

### Analyze Current Bundle

```bash
# Analyze folder sizes and dependencies
npm run analyze
```

### Analyze Build Bundle

```bash
# Build with bundle analyzer
npm run analyze:build

# Then open .next/analyze/client.html in browser
```

## 🚀 Performance Optimizations

### 1. Code Splitting

The Next.js config has been optimized with:
- Automatic code splitting for vendor libraries
- Separate chunks for Firebase and Radix UI
- Common chunk extraction for shared code

### 2. Image Optimization

- Images are automatically converted to WebP format
- Next.js Image component with WebP/AVIF support
- Automatic image resizing and optimization

### 3. Build Optimizations

- Production source maps disabled (faster builds)
- Deterministic module IDs for better caching
- Optimized chunk splitting strategy

## 📋 Best Practices

### Do NOT Delete

- ❌ **node_modules** - Required for the project to run
- ❌ **public/** - Contains static assets needed by the app
- ❌ **src/** - Your source code

### Safe to Delete

- ✅ **.next/** - Build cache (regenerated on build)
- ✅ **tsconfig.tsbuildinfo** - TypeScript cache
- ✅ **logs/** - Log files
- ✅ **src.zip** - Backup file (if not needed)
- ✅ **.DS_Store** - macOS system files

### Regular Maintenance

1. **After each build**: Run `npm run clean:optimize`
2. **Weekly**: Check for unused dependencies
3. **Monthly**: Review bundle size with `npm run analyze`

## 🔍 Finding Large Files

```bash
# Find files larger than 10MB
find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.next/*"

# Check folder sizes
du -sh node_modules .next public/assets
```

## 📈 Monitoring Bundle Size

### Check Dependencies

```bash
# List all dependencies
npm list --depth=0

# Check for outdated packages
npm outdated
```

### Large Dependencies

These are the largest dependencies in the project:
- `firebase` & `firebase-admin` (~50MB)
- `@tanstack/react-table` (~10MB)
- `framer-motion` (~5MB)
- `date-fns` (~3MB)

## 🎯 Optimization Tips

1. **Lazy Loading**: Use dynamic imports for heavy components
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'));
   ```

2. **Tree Shaking**: Import only what you need
   ```typescript
   // ❌ Bad
   import * as utils from './utils';
   
   // ✅ Good
   import { specificFunction } from './utils';
   ```

3. **Remove Unused Dependencies**: Regularly audit your dependencies
   ```bash
   npm install -g depcheck
   depcheck
   ```

4. **Use Next.js Image**: Always use Next.js Image component for images
   ```typescript
   import Image from 'next/image';
   ```

## 🐛 Troubleshooting

### Site Loads Slowly

1. Check bundle size: `npm run analyze`
2. Check network tab in browser DevTools
3. Look for large API responses
4. Check for unoptimized images

### Build Fails After Clean

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Out of Memory During Build

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## 📚 Additional Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes before installing


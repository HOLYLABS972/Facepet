# Next.js Asset Import Guide

## 🚨 Problem: Module Resolution Error

**Error:** `Module not found: Can't resolve '@/public/pets/dino.png'`

**Cause:** Incorrect import path for public assets in Next.js.

## ✅ Solution: Correct Public Asset Imports

### ❌ Wrong Way (What was causing the error)
```typescript
// DON'T DO THIS
import dino from '@/public/pets/dino.png';
import logo from '@/public/logo.png';
```

### ✅ Correct Way (Fixed)
```typescript
// DO THIS INSTEAD
import dino from '/pets/dino.png';
import logo from '/logo.png';
```

## 📁 How Next.js Public Assets Work

### Public Directory Structure
```
public/
├── pets/
│   ├── bear.png
│   ├── bunny.png
│   ├── dino.png
│   ├── duck.png
│   ├── penguin.png
│   └── pig.png
├── assets/
│   ├── ad_header.png
│   ├── nfc.png
│   └── upload_figures.png
└── loading_logo.svg
```

### Import Path Rules

1. **For Static Imports (ES6 imports):**
   ```typescript
   // ✅ Correct - starts with /
   import image from '/pets/dino.png';
   import logo from '/assets/logo.png';
   
   // ❌ Wrong - includes @/public
   import image from '@/public/pets/dino.png';
   ```

2. **For Dynamic Imports:**
   ```typescript
   // ✅ Correct
   const image = await import('/pets/dino.png');
   
   // ❌ Wrong
   const image = await import('@/public/pets/dino.png');
   ```

3. **For src attribute in JSX:**
   ```typescript
   // ✅ Correct
   <img src="/pets/dino.png" alt="Dino" />
   
   // ❌ Wrong
   <img src="@/public/pets/dino.png" alt="Dino" />
   ```

## 🔧 What I Fixed

### Files Updated:
- `src/app/[locale]/page.tsx`
- `src/components/DonePage.tsx`
- `src/components/AnimatedPetCharacters.tsx`
- `src/components/get-started/AdHeader.tsx`
- `src/components/get-started/ui/ImageUpload.tsx`
- `src/app/[locale]/(static)/layout.tsx`
- `src/components/pages/loadingPage.tsx`

### Changes Made:
```typescript
// Before (causing errors)
import dino from '@/public/pets/dino.png';
import bear from '@/public/pets/bear.png';
import nfc from '@/public/assets/nfc.png';

// After (working correctly)
import dino from '/pets/dino.png';
import bear from '/pets/bear.png';
import nfc from '/assets/nfc.png';
```

## 📚 Next.js Asset Import Best Practices

### 1. Static Assets (Images, SVGs, etc.)
```typescript
// ✅ Import from public directory
import logo from '/logo.png';
import icon from '/icons/icon.svg';

// Use in JSX
<Image src={logo} alt="Logo" width={100} height={100} />
```

### 2. Dynamic Assets
```typescript
// ✅ Use public path directly
<img src="/pets/dino.png" alt="Dino" />

// ✅ Or use Next.js Image component
<Image src="/pets/dino.png" alt="Dino" width={200} height={200} />
```

### 3. Conditional Assets
```typescript
// ✅ Use template literals with public paths
const petImages = {
  bear: '/pets/bear.png',
  dino: '/pets/dino.png',
  bunny: '/pets/bunny.png'
};

const selectedPet = 'dino';
<img src={petImages[selectedPet]} alt={selectedPet} />
```

## 🚀 Why This Matters

### Build Process
- Next.js processes imports at build time
- `@/public/` path doesn't exist in the build system
- `/` paths are correctly resolved to the public directory

### Performance
- Static imports are optimized by Next.js
- Images are automatically optimized
- Proper caching and compression

### Development vs Production
- Works consistently in both environments
- No path resolution issues
- Proper asset bundling

## 🔍 Common Mistakes to Avoid

### ❌ Don't Use These Patterns:
```typescript
// Wrong - includes @/public
import image from '@/public/image.png';

// Wrong - relative path from src
import image from '../../../public/image.png';

// Wrong - missing leading slash
import image from 'pets/dino.png';
```

### ✅ Use These Patterns:
```typescript
// Correct - absolute path from public
import image from '/pets/dino.png';

// Correct - for dynamic usage
const imagePath = '/pets/dino.png';

// Correct - with Next.js Image component
<Image src="/pets/dino.png" alt="Dino" width={200} height={200} />
```

## 🛠️ Debugging Asset Import Issues

### Check Your Import Paths:
```bash
# Search for incorrect imports
grep -r "@/public/" src/

# Should return no results after fixing
```

### Verify File Exists:
```bash
# Check if file exists in public directory
ls -la public/pets/dino.png
```

### Test Import:
```typescript
// Test import in a component
import testImage from '/pets/dino.png';
console.log('Image imported:', testImage);
```

## 📋 Summary

- **Always use `/` prefix** for public assets
- **Never use `@/public/`** in imports
- **Public directory is served from root** (`/`)
- **Static imports are processed at build time**
- **Use Next.js Image component** for optimization

Your asset import errors should now be resolved! 🎉

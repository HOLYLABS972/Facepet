# Image Conversion to WebP

This script automatically converts PNG and JPG images to WebP format during the build process.

## How It Works

1. **Automatic Conversion**: Runs before `npm run build` via the `prebuild` script
2. **Format Support**: Converts `.png`, `.jpg`, `.jpeg` files to `.webp`
3. **Preserves Originals**: By default, keeps original files alongside WebP versions
4. **Smart Skipping**: Skips conversion if WebP already exists and is newer than the original

## Usage

### Automatic (Recommended)
The conversion runs automatically during build:
```bash
npm run build
```

### Manual Conversion
Convert images manually:
```bash
npm run convert:images
```

### Replace Originals
To replace original files with WebP (saves more space but requires code updates):
```bash
REPLACE_ORIGINALS=true npm run convert:images
```

⚠️ **Note**: If you replace originals, you'll need to update image references in your code from `.png`/`.jpg` to `.webp`.

## Next.js Image Component

The Next.js `Image` component automatically serves WebP when:
- The browser supports WebP
- Both original and WebP versions exist
- You reference the original file (e.g., `/pets/bear.png`)

So you can keep your code as-is and Next.js will handle the optimization automatically!

## Files Skipped

- `favicon.ico` (needed for browser compatibility)
- SVG files (already optimized)
- Files in `node_modules`, `.next`, `.git`

## Statistics

The script provides detailed statistics:
- Number of images converted
- File size savings
- Any errors encountered

## Requirements

- `sharp` package (installed as devDependency)
- Node.js 18+ recommended


const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ sharp is not installed.');
  console.error('⚠️  Skipping image conversion. Install with: npm install --save-dev sharp');
  console.error('   Build will continue without WebP conversion...');
  process.exit(0); // Exit gracefully, don't break build
}

// Image extensions to convert
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
// Files/folders to skip
const SKIP_PATTERNS = [
  'favicon.ico',
  '.DS_Store',
  'node_modules',
  '.next',
  '.git'
];

// Configuration
const REPLACE_ORIGINALS = process.env.REPLACE_ORIGINALS === 'true'; // Set to 'true' to replace originals
const KEEP_ORIGINALS = !REPLACE_ORIGINALS; // Keep originals by default

// Statistics
let stats = {
  converted: 0,
  skipped: 0,
  errors: 0,
  replaced: 0,
  totalSizeBefore: 0,
  totalSizeAfter: 0
};

/**
 * Check if file should be skipped
 */
function shouldSkip(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  
  return SKIP_PATTERNS.some(pattern => 
    fileName.includes(pattern) || relativePath.includes(pattern)
  );
}

/**
 * Convert image to WebP
 */
async function convertToWebP(inputPath, outputPath, quality = 85) {
  try {
    const inputStats = fs.statSync(inputPath);
    stats.totalSizeBefore += inputStats.size;

    // Try different sharp API formats for compatibility
    let image = sharp(inputPath);
    
    // Check sharp version and use appropriate API
    const sharpVersion = require('sharp/package.json').version;
    const majorVersion = parseInt(sharpVersion.split('.')[0]);
    
    if (majorVersion >= 1) {
      // Modern sharp API
      image = image.webp({ 
        quality: quality,
        effort: 6
      });
    } else {
      // Older sharp API
      image = image.webp(quality);
    }
    
    await image.toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    stats.totalSizeAfter += outputStats.size;

    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    const sizeBefore = (inputStats.size / 1024).toFixed(2);
    const sizeAfter = (outputStats.size / 1024).toFixed(2);

    console.log(`✅ ${path.relative(process.cwd(), inputPath)}`);
    console.log(`   ${sizeBefore}KB → ${sizeAfter}KB (${savings}% smaller)`);
    
    stats.converted++;
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Process directory recursively
 */
async function processDirectory(dirPath, outputDir = null) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (shouldSkip(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subOutputDir = outputDir 
        ? path.join(outputDir, entry.name)
        : fullPath;
      
      if (outputDir && !fs.existsSync(subOutputDir)) {
        fs.mkdirSync(subOutputDir, { recursive: true });
      }
      
      await processDirectory(fullPath, subOutputDir);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      
      if (IMAGE_EXTENSIONS.includes(ext)) {
        const outputPath = outputDir
          ? path.join(outputDir, entry.name.replace(ext, '.webp'))
          : fullPath.replace(ext, '.webp');

        // Create output directory if it doesn't exist
        if (outputDir) {
          const outputDirPath = path.dirname(outputPath);
          if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, { recursive: true });
          }
        }

        // Check if WebP already exists and is newer
        if (fs.existsSync(outputPath)) {
          const originalStats = fs.statSync(fullPath);
          const webpStats = fs.statSync(outputPath);
          
          if (webpStats.mtime >= originalStats.mtime) {
            console.log(`⏭️  Skipping ${path.relative(process.cwd(), fullPath)} (WebP already exists)`);
            stats.skipped++;
            continue;
          }
        }

        const success = await convertToWebP(fullPath, outputPath);
        
        // If conversion successful and REPLACE_ORIGINALS is true, remove original
        if (success && REPLACE_ORIGINALS) {
          try {
            fs.unlinkSync(fullPath);
            stats.replaced++;
            console.log(`   🗑️  Removed original file`);
          } catch (error) {
            console.error(`   ⚠️  Could not remove original: ${error.message}`);
          }
        }
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found!');
    process.exit(1);
  }

  console.log('🖼️  Converting images to WebP...\n');
  console.log('📁 Processing:', publicDir);
  if (REPLACE_ORIGINALS) {
    console.log('⚠️  Mode: REPLACING originals (REPLACE_ORIGINALS=true)');
  } else {
    console.log('ℹ️  Mode: Keeping originals (set REPLACE_ORIGINALS=true to replace)');
  }
  console.log('');

  await processDirectory(publicDir);

  console.log('\n📊 Conversion Summary:');
  console.log(`   ✅ Converted: ${stats.converted} images`);
  if (REPLACE_ORIGINALS) {
    console.log(`   🗑️  Replaced: ${stats.replaced} originals`);
  }
  console.log(`   ⏭️  Skipped: ${stats.skipped} images`);
  console.log(`   ❌ Errors: ${stats.errors} images`);
  
  if (stats.totalSizeBefore > 0) {
    const totalSavings = ((1 - stats.totalSizeAfter / stats.totalSizeBefore) * 100).toFixed(1);
    const sizeBeforeMB = (stats.totalSizeBefore / 1024 / 1024).toFixed(2);
    const sizeAfterMB = (stats.totalSizeAfter / 1024 / 1024).toFixed(2);
    
    console.log(`   📦 Total size: ${sizeBeforeMB}MB → ${sizeAfterMB}MB (${totalSavings}% smaller)`);
  }
  
  console.log('\n✨ Image conversion completed!');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  console.error('⚠️  Continuing build without WebP conversion...');
  process.exit(0); // Don't break the build
});


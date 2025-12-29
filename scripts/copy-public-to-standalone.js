const fs = require('fs');
const path = require('path');

// Copy public folder to standalone output
// The standalone server.js runs from .next/standalone/, so public should be at .next/standalone/public
const publicDir = path.join(__dirname, '..', 'public');
const standalonePublicDir = path.join(__dirname, '..', '.next', 'standalone', 'public');
const standaloneStaticDir = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');
const standaloneNextDir = path.join(__dirname, '..', '.next', 'standalone', '.next');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source directory does not exist: ${src}`);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy public folder
if (fs.existsSync(publicDir)) {
  console.log('📁 Copying public folder to standalone output...');
  copyDir(publicDir, standalonePublicDir);
  console.log('✅ Public folder copied successfully');
} else {
  console.log('⚠️  Public folder not found, skipping...');
}

// Ensure .next/static exists in standalone
const srcStatic = path.join(__dirname, '..', '.next', 'static');
if (fs.existsSync(srcStatic)) {
  console.log('📁 Copying .next/static to standalone output...');
  // Ensure .next directory exists in standalone
  if (!fs.existsSync(standaloneNextDir)) {
    fs.mkdirSync(standaloneNextDir, { recursive: true });
  }
  copyDir(srcStatic, standaloneStaticDir);
  console.log('✅ Static files copied successfully');
} else {
  console.log('⚠️  .next/static not found, skipping...');
}

console.log('✨ Post-build copy completed!');


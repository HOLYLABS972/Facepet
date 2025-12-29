#!/usr/bin/env node

/**
 * Bundle Analyzer Script
 * Analyzes the Next.js bundle to identify large dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Analyzing bundle size...\n');

// Check if @next/bundle-analyzer is installed
try {
  require.resolve('@next/bundle-analyzer');
} catch (e) {
  console.log('⚠️  @next/bundle-analyzer not found. Installing...');
  execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
}

// Analyze node_modules size
console.log('📊 Analyzing node_modules...');
try {
  const result = execSync(
    'du -sh node_modules 2>/dev/null || echo "0"',
    { encoding: 'utf-8' }
  );
  console.log(`   node_modules size: ${result.trim()}`);
} catch (e) {
  console.log('   Could not analyze node_modules');
}

// Analyze .next folder
console.log('\n📊 Analyzing .next build folder...');
try {
  const result = execSync(
    'du -sh .next 2>/dev/null || echo "0"',
    { encoding: 'utf-8' }
  );
  console.log(`   .next size: ${result.trim()}`);
} catch (e) {
  console.log('   No .next folder found (run build first)');
}

// Check for large files
console.log('\n📊 Finding large files (>10MB)...');
try {
  const result = execSync(
    'find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" 2>/dev/null | head -10',
    { encoding: 'utf-8' }
  );
  if (result.trim()) {
    console.log('   Large files found:');
    result.trim().split('\n').forEach(file => {
      if (file) {
        try {
          const stats = fs.statSync(file);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`   - ${file} (${sizeMB}MB)`);
        } catch (e) {
          console.log(`   - ${file}`);
        }
      }
    });
  } else {
    console.log('   ✅ No large files found');
  }
} catch (e) {
  console.log('   Could not analyze files');
}

// Check package.json for potential optimizations
console.log('\n📊 Analyzing dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const deps = Object.keys(packageJson.dependencies || {}).length;
  const devDeps = Object.keys(packageJson.devDependencies || {}).length;
  
  console.log(`   Production dependencies: ${deps}`);
  console.log(`   Dev dependencies: ${devDeps}`);
  console.log(`   Total: ${deps + devDeps}`);
  
  // Check for potentially large dependencies
  const largeDeps = [
    'firebase',
    'firebase-admin',
    '@tanstack/react-table',
    'framer-motion',
    'date-fns',
    'react-email'
  ];
  
  const foundLarge = largeDeps.filter(dep => 
    packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
  );
  
  if (foundLarge.length > 0) {
    console.log('\n   ⚠️  Large dependencies detected:');
    foundLarge.forEach(dep => console.log(`   - ${dep}`));
  }
} catch (e) {
  console.log('   Could not analyze package.json');
}

console.log('\n✅ Analysis complete!');
console.log('\n💡 Tips:');
console.log('   - Run "npm run clean" to remove build artifacts');
console.log('   - Run "npm run build" to generate bundle analysis');
console.log('   - Check .next/analyze/ for detailed bundle reports');


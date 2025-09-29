#!/usr/bin/env node

/**
 * Safe console cleanup script
 * Removes console.log statements while preserving critical error handling
 * Based on learnings from previous cleanup attempts
 */

const fs = require('fs');
const path = require('path');

// Files to skip entirely (critical for debugging in production)
const SKIP_FILES = [
  'logger.ts',
  'logger.js',
  'errorBoundary',
  'ErrorBoundary'
];

// Patterns to preserve (these should NOT be removed)
const PRESERVE_PATTERNS = [
  // Error boundaries need their console.error statements
  /componentDidCatch.*console\.error/,
  // Critical error handling
  /catch.*\{[\s\S]*?console\.error/,
  // Store manager critical errors
  /storeManager.*console\.error/,
  // Production error tracking
  /process\.env\.NODE_ENV === ['"]production['"].*console\.error/
];

// Safe patterns to remove (pure debug output)
const SAFE_REMOVE_PATTERNS = [
  // Debug logs with emojis (definitely debug)
  /console\.log\(['"][🔍🎯🔄🎨📝🧭🟢🟡🔴⚡💾🏗️📊🎭🔧⚙️✨🚀💡][^'"]*['"]/g,
  // Simple debug logs
  /console\.log\(['"][\w\s]+:['"]/g,
  // Mounting/unmounting logs
  /console\.log\(['"].*MOUNT/gi,
  /console\.log\(['"].*mounted/gi,
  /console\.log\(['"].*unmount/gi,
  // Debug prefixed logs
  /console\.log\(['"].*DEBUG/gi,
  /console\.log\(['"].*\[debug\]/gi,
  // Click handler logs
  /console\.log\(['"].*clicked['"]\)/g,
  // State change logs
  /console\.log\(['"].*state.*changed/gi,
  // New patterns found in sprint-6.2
  /console\.log\(['"].*\[UIBLOCK_DEBUG\]/gi,
  /console\.log\(['"].*\[CONTENT_UPDATE_DEBUG\]/gi,
  /console\.log\(['"].*\[AI_GENERATION_DEBUG\]/gi,
  /console\.log\(['"].*\[STORAGE_DEBUG\]/gi,
  // Commented out console logs
  /\/\/.*console\.log/gi,
  // Simple console.warn patterns that should use logger
  /console\.warn\(['"][^'"]*['"]\)/g,
];

function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

function shouldPreserveLine(line) {
  return PRESERVE_PATTERNS.some(pattern => pattern.test(line));
}

function cleanFile(filePath) {
  if (shouldSkipFile(filePath)) {
    return { changed: false, reason: 'Skipped (critical file)' };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  const newLines = [];
  let removedCount = 0;
  let preservedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let shouldRemove = false;

    // Check if line contains console statement
    if (line.includes('console.')) {
      // Check if it should be preserved
      if (shouldPreserveLine(line)) {
        preservedCount++;
      } else {
        // Check if it matches safe removal patterns
        for (const pattern of SAFE_REMOVE_PATTERNS) {
          if (pattern.test(line)) {
            shouldRemove = true;
            removedCount++;
            break;
          }
        }
        
        // Also remove standalone console.log statements without critical content
        if (!shouldRemove && /^\s*console\.log\(/.test(line)) {
          // Check if it's a simple debug log (no function calls, no state access)
          if (!/\.\w+\(/.test(line) || /console\.log\(['"][^'"]*['"]\)/.test(line)) {
            shouldRemove = true;
            removedCount++;
          }
        }
      }
    }

    if (!shouldRemove) {
      newLines.push(line);
    } else {
      modified = true;
      // Add a blank line if removing would create awkward spacing
      if (i > 0 && i < lines.length - 1 && lines[i-1].trim() && lines[i+1].trim()) {
        // Don't add blank line, just remove the console.log
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    return { 
      changed: true, 
      removed: removedCount,
      preserved: preservedCount,
      reason: `Removed ${removedCount} console statements, preserved ${preservedCount}` 
    };
  }

  return { 
    changed: false, 
    preserved: preservedCount,
    reason: preservedCount > 0 ? `Preserved ${preservedCount} critical console statements` : 'No console statements found' 
  };
}

function processDirectory(dirPath, results = []) {
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    // Skip build and dependency directories
    if (item === 'node_modules' || item === '.next' || item === 'out' || item === '.git' || item === 'scripts') {
      return;
    }

    if (stat.isDirectory()) {
      processDirectory(fullPath, results);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      try {
        const result = cleanFile(fullPath);
        results.push({ file: fullPath.replace(process.cwd() + path.sep, ''), ...result });
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  });

  return results;
}

// Main execution
const targetPath = process.argv[2] || 'src';
const fullPath = path.resolve(targetPath);

if (!fs.existsSync(fullPath)) {
  console.error(`Path does not exist: ${fullPath}`);
  process.exit(1);
}

console.log('=== Safe Console Cleanup Script ===\n');
console.log('This script will:');
console.log('✅ Remove debug console.log statements');
console.log('✅ Preserve critical error handling');
console.log('✅ Keep error boundary logging');
console.log('✅ Maintain production error tracking\n');

console.log(`Scanning ${fullPath}...\n`);

const results = processDirectory(fullPath);

// Generate report
let totalRemoved = 0;
let totalPreserved = 0;
let filesChanged = 0;

console.log('=== Results ===\n');

results.forEach(result => {
  if (result.changed) {
    console.log(`✅ ${result.file}: ${result.reason}`);
    filesChanged++;
    totalRemoved += result.removed || 0;
  }
  totalPreserved += result.preserved || 0;
});

console.log('\n=== Summary ===');
console.log(`Files modified: ${filesChanged}`);
console.log(`Console statements removed: ${totalRemoved}`);
console.log(`Critical statements preserved: ${totalPreserved}`);

if (filesChanged > 0) {
  console.log('\n⚠️  Important: Please test the application to ensure functionality is preserved');
  console.log('💡 Run: npm run dev');
  console.log('💡 Check for console errors in the browser');
  console.log('💡 Test critical user flows');
}
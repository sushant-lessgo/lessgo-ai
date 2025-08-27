#!/usr/bin/env node

/**
 * Batch fix console logs with function calls
 * This script replaces console.log statements that have function calls with logger equivalents
 */

const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Basic console replacements
  { from: /^(\s*)console\.log\(/gm, to: '$1logger.debug(' },
  { from: /^(\s*)console\.error\(/gm, to: '$1logger.error(' },
  { from: /^(\s*)console\.warn\(/gm, to: '$1logger.warn(' },
  { from: /^(\s*)console\.info\(/gm, to: '$1logger.info(' },
  
  // Fix logger imports - add if not present
  { 
    from: /^(import.*from ['"][^'"]*['"];?)$/gm, 
    to: '$1',
    addImport: true
  }
];

function hasLoggerImport(content) {
  return content.includes("from '@/lib/logger'") || content.includes('from "@/lib/logger"');
}

function addLoggerImport(content) {
  if (hasLoggerImport(content)) return content;
  
  // Find the last import statement
  const importRegex = /^import.*from\s+['"][^'"]*['"];?\s*$/gm;
  const imports = [...content.matchAll(importRegex)];
  
  if (imports.length === 0) {
    // Add at the beginning if no imports
    return `import { logger } from '@/lib/logger';\n\n${content}`;
  }
  
  // Add after the last import
  const lastImport = imports[imports.length - 1];
  const insertIndex = lastImport.index + lastImport[0].length;
  
  return content.slice(0, insertIndex) + 
         "\nimport { logger } from '@/lib/logger';" +
         content.slice(insertIndex);
}

function needsConsoleLoggerFix(content) {
  // Check for console statements with potential function calls
  const patterns = [
    /console\.(log|error|warn|info)\([^)]*\([^)]*\)/g,
    /console\.(log|error|warn|info).*Object\.keys\(/g,
    /console\.(log|error|warn|info).*getState\(\)/g,
    /console\.(log|error|warn|info).*JSON\.stringify/g,
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!needsConsoleLoggerFix(content)) {
    return { changed: false, reason: 'No problematic console statements' };
  }
  
  let newContent = content;
  
  // Add logger import if needed
  if (/console\.(log|error|warn|info)/.test(content)) {
    newContent = addLoggerImport(newContent);
  }
  
  // Apply replacements
  REPLACEMENTS.forEach(replacement => {
    if (replacement.addImport) return; // Skip import replacements
    newContent = newContent.replace(replacement.from, replacement.to);
  });
  
  if (newContent === content) {
    return { changed: false, reason: 'No changes needed' };
  }
  
  fs.writeFileSync(filePath, newContent);
  return { changed: true, reason: 'Updated console statements and imports' };
}

function processDirectory(dirPath) {
  const results = [];
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    // Skip certain directories
    if (item === 'node_modules' || item === '.next' || item === 'out' || item === '.git') {
      return;
    }
    
    if (stat.isDirectory()) {
      results.push(...processDirectory(fullPath));
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      try {
        const result = fixFile(fullPath);
        if (result.changed) {
          results.push({ file: fullPath, ...result });
        }
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

console.log(`Processing ${fullPath} for console log fixes...`);
const results = processDirectory(fullPath);

console.log(`\\n=== Batch Console Fix Results ===`);
console.log(`Files processed: ${results.length}`);

results.forEach(result => {
  console.log(`✅ ${result.file}: ${result.reason}`);
});

if (results.length === 0) {
  console.log('No files needed updating.');
} else {
  console.log(`\\n💡 Don't forget to:`);
  console.log('1. Test the application');
  console.log('2. Run npm run lint to check for any issues');
  console.log('3. Verify imports are correct');
}
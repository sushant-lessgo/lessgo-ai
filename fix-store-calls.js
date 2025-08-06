const fs = require('fs');
const path = require('path');

// Pattern to find store method calls that need optional chaining
const patterns = [
  // Direct method calls from store state that could be undefined
  /(\w+)\(\)/g,
  // Method calls with arguments that could be undefined
  /(\w+)\([^)]*\)/g
];

// Common store method names that need fixing
const storeMethods = [
  'toggleLeftPanel',
  'regenerateAllContent', 
  'regenerateContentOnly',
  'updateOnboardingData',
  'announceLiveRegion',
  'updateViewportInfo',
  'handleKeyboardShortcut',
  'setLeftPanelWidth',
  'moveElementToPosition',
  'duplicateElement',
  'removeElement',
  'getAllElements',
  'moveElementUp',
  'moveElementDown'
];

function fixStoreCallsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file has store state extraction pattern
  if (content.includes('const storeState = store?.getState()')) {
    // Find method calls that match store methods and don't already have optional chaining
    storeMethods.forEach(method => {
      // Pattern for method calls without optional chaining
      const directCallPattern = new RegExp(`\\b${method}\\(`, 'g');
      const optionalCallPattern = new RegExp(`\\b${method}\\?\\\.\\(`, 'g');
      
      // Check if the method is used and doesn't already have optional chaining
      if (content.match(directCallPattern) && !content.match(optionalCallPattern)) {
        // Only replace if it looks like a store method call (not inside definitions)
        const fullPattern = new RegExp(`\\b${method}\\(([^)]*)\\)`, 'g');
        const newContent = content.replace(fullPattern, (match, args) => {
          // Don't replace if it's part of a function definition or destructuring
          if (match.includes('= ') || match.includes(': ')) {
            return match;
          }
          return `${method}?.(${args})`;
        });
        
        if (newContent !== content) {
          content = newContent;
          modified = true;
          console.log(`Fixed ${method} calls in ${filePath}`);
        }
      }
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
  }

  return modified;
}

function findTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.next') {
      files.push(...findTsxFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Process all .tsx and .ts files in src/app/edit/[token]/components
const targetDir = 'C:\\Users\\susha\\lessgo-ai\\src\\app\\edit\\[token]\\components';
const files = findTsxFiles(targetDir);

let totalFixed = 0;
for (const file of files) {
  if (fixStoreCallsInFile(file)) {
    totalFixed++;
  }
}

console.log(`Fixed store method calls in ${totalFixed} files`);
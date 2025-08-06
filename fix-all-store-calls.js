const fs = require('fs');
const path = require('path');

function fixStoreCallsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file has store state extraction pattern
  if (content.includes('const storeState = store?.getState()') || 
      content.includes('storeState?.') ||
      content.includes('= storeState?.')) {
    
    // Pattern 1: Direct function calls that come from store (variable names followed by parentheses)
    // Look for patterns like: functionName(args) where functionName is destructured from storeState
    
    // First, find all destructured function names from storeState
    const destructureMatches = content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*storeState\s*\|\|\s*{}/g);
    const directDestructureMatches = content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*store\?\.\w+\(\)[^;]*;/g);
    
    let functionNames = new Set();
    
    if (destructureMatches) {
      destructureMatches.forEach(match => {
        // Extract function names from destructuring
        const names = match.match(/{\s*([^}]+)\s*}/)[1];
        names.split(',').forEach(name => {
          const cleanName = name.trim().split(':')[0].trim();
          if (cleanName && !cleanName.includes(' ')) {
            functionNames.add(cleanName);
          }
        });
      });
    }
    
    if (directDestructureMatches) {
      directDestructureMatches.forEach(match => {
        const names = match.match(/{\s*([^}]+)\s*}/)[1];
        names.split(',').forEach(name => {
          const cleanName = name.trim().split(':')[0].trim();
          if (cleanName && !cleanName.includes(' ')) {
            functionNames.add(cleanName);
          }
        });
      });
    }
    
    // Common store method names to check (add to the set)
    const commonStoreMethods = [
      'addSection', 'setSection', 'setSectionLayouts', 'setActiveSection',
      'selectElement', 'trackPerformance', 'toggleLeftPanel', 'setLeftPanelWidth',
      'regenerateAllContent', 'regenerateContentOnly', 'updateOnboardingData',
      'announceLiveRegion', 'updateViewportInfo', 'handleKeyboardShortcut',
      'moveElementToPosition', 'duplicateElement', 'removeElement',
      'getAllElements', 'moveElementUp', 'moveElementDown', 'getColorTokens'
    ];
    
    commonStoreMethods.forEach(name => functionNames.add(name));
    
    // Now fix function calls
    functionNames.forEach(funcName => {
      // Skip if already has optional chaining or if it's a common variable name
      if (funcName.length < 3 || ['set', 'get', 'has', 'is', 'can'].some(prefix => funcName.startsWith(prefix) && funcName.length < 6)) {
        return;
      }
      
      // Pattern: functionName(
      const directCallPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      // Pattern: functionName?.(
      const optionalCallPattern = new RegExp(`\\b${funcName}\\s*\\?\\.\\s*\\(`, 'g');
      
      // Skip if already has optional chaining
      if (content.match(optionalCallPattern)) {
        return;
      }
      
      // Find function calls and add optional chaining
      const matches = [...content.matchAll(directCallPattern)];
      if (matches.length > 0) {
        // Replace direct calls with optional chaining
        // Be careful not to replace function definitions or object property definitions
        const newContent = content.replace(directCallPattern, (match, offset) => {
          const beforeMatch = content.substring(Math.max(0, offset - 20), offset);
          
          // Skip if it's a function definition, object property, or import
          if (beforeMatch.includes('function ') || 
              beforeMatch.includes('const ') ||
              beforeMatch.includes('let ') ||
              beforeMatch.includes('var ') ||
              beforeMatch.includes(': ') ||
              beforeMatch.includes('= ') ||
              beforeMatch.includes('import ') ||
              beforeMatch.includes('export ')) {
            return match;
          }
          
          return match.replace(`${funcName}(`, `${funcName}?.(`);
        });
        
        if (newContent !== content) {
          content = newContent;
          modified = true;
          console.log(`Fixed ${funcName} calls in ${filePath}`);
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
#!/usr/bin/env node

/**
 * Script to migrate console.log/error/warn statements to logger utility
 * Usage: node scripts/migrate-console-logs.js [file-path]
 * 
 * This script helps identify and optionally migrate console statements that:
 * 1. Have function calls (potential side effects)
 * 2. Access state or store methods
 * 3. Perform expensive operations
 */

const fs = require('fs');
const path = require('path');

const PATTERNS_TO_WATCH = [
  // Function calls that might have side effects
  /console\.(log|error|warn|info|debug)\([^)]*\([^)]*\)/g,
  // State access patterns
  /console\.(log|error|warn|info|debug).*getState\(\)/g,
  /console\.(log|error|warn|info|debug).*store\./g,
  // String operations that might be expensive
  /console\.(log|error|warn|info|debug).*substring\(/g,
  /console\.(log|error|warn|info|debug).*JSON\.stringify/g,
];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  PATTERNS_TO_WATCH.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        issues.push({
          line: lineNumber,
          match: match.substring(0, 100),
          type: getIssueType(index)
        });
      });
    }
  });
  
  return issues;
}

function getIssueType(index) {
  const types = [
    'Function call in console statement',
    'State access in console statement',
    'Store method in console statement',
    'Substring operation in console statement',
    'JSON.stringify in console statement'
  ];
  return types[index] || 'Unknown issue';
}

function scanDirectory(dirPath, results = []) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    // Skip node_modules and other build directories
    if (item === 'node_modules' || item === '.next' || item === 'out' || item === '.git') {
      return;
    }
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      const issues = analyzeFile(fullPath);
      if (issues.length > 0) {
        results.push({
          file: fullPath,
          issues
        });
      }
    }
  });
  
  return results;
}

function generateReport(results) {
  console.log('\\n=== Console Log Migration Report ===\\n');
  
  let totalIssues = 0;
  const issuesByType = {};
  
  results.forEach(({ file, issues }) => {
    console.log(`\\n📁 ${file}`);
    issues.forEach(issue => {
      console.log(`  Line ${issue.line}: ${issue.type}`);
      console.log(`    ${issue.match}...`);
      totalIssues++;
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
    });
  });
  
  console.log('\\n=== Summary ===');
  console.log(`Total files with issues: ${results.length}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log('\\nIssues by type:');
  Object.entries(issuesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\\n=== Recommendations ===');
  console.log('1. Replace console.log → logger.debug() or logger.dev()');
  console.log('2. Replace console.error → logger.error()');
  console.log('3. Replace console.warn → logger.warn()');
  console.log('4. Wrap expensive operations in functions for lazy evaluation');
  console.log('   Example: logger.debug("State:", () => store.getState())');
  console.log('5. Import logger from "@/lib/logger" in affected files');
}

// Main execution
const targetPath = process.argv[2] || 'src';
const fullPath = path.resolve(targetPath);

if (!fs.existsSync(fullPath)) {
  console.error(`Path does not exist: ${fullPath}`);
  process.exit(1);
}

console.log(`Scanning ${fullPath} for console statements with potential issues...`);
const results = scanDirectory(fullPath);

if (results.length === 0) {
  console.log('✅ No problematic console statements found!');
} else {
  generateReport(results);
  
  console.log('\\n💡 To fix these issues:');
  console.log('1. Add: import { logger } from "@/lib/logger";');
  console.log('2. Replace console statements with logger methods');
  console.log('3. Use lazy evaluation for expensive operations');
  console.log('4. Run ESLint to catch remaining issues');
}
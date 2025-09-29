// lib/htmlSanitizer.test.ts - Test cases for HTML sanitization
import { 
  sanitizePublishedContent, 
  sanitizeFormattingContent, 
  sanitizeEditorContent,
  validateHTMLSafety,
  stripAllHTML 
} from './htmlSanitizer';

// Manual test function (since we don't have a test runner configured)
export const runSanitizationTests = () => {
  // Only log in test/development environments
  const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  const log = isTestEnvironment ? console.log : () => {};
  const logError = isTestEnvironment ? console.error : () => {};

  log('🧪 Running HTML Sanitization Security Tests...\n');

  const tests = [
    // XSS Attack Tests
    {
      name: 'Script Tag Injection',
      input: '<script>alert("XSS")</script>Hello World',
      expectedOutput: 'Hello World',
      shouldBlock: true
    },
    {
      name: 'Event Handler Injection',
      input: '<div onclick="alert(\'XSS\')">Click me</div>',
      expectedOutput: '<div>Click me</div>',
      shouldBlock: true
    },
    {
      name: 'JavaScript URL Injection',
      input: '<a href="javascript:alert(\'XSS\')">Click</a>',
      expectedOutput: '<a>Click</a>',
      shouldBlock: true
    },
    {
      name: 'Data URL with Script',
      input: '<img src="data:text/html,<script>alert(\'XSS\')</script>">',
      expectedOutput: '',
      shouldBlock: true
    },
    {
      name: 'Nested Script Tags',
      input: '<div><script>alert("nested")</script>Safe content</div>',
      expectedOutput: '<div>Safe content</div>',
      shouldBlock: true
    },
    
    // Legitimate Content Tests
    {
      name: 'Basic Formatting',
      input: '<span style="font-weight: bold">Bold text</span>',
      expectedOutput: '<span style="font-weight: bold">Bold text</span>',
      shouldBlock: false
    },
    {
      name: 'Multiple Elements',
      input: '<b>Bold</b> and <i>italic</i> text',
      expectedOutput: '<b>Bold</b> and <i>italic</i> text',
      shouldBlock: false
    },
    {
      name: 'Safe Links (Editor Profile)',
      input: '<a href="https://example.com">Safe link</a>',
      expectedOutput: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Safe link</a>',
      shouldBlock: false
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    log(`Test ${index + 1}: ${test.name}`);
    log(`Input: ${test.input}`);
    
    try {
      // Test with published content profile (strictest)
      const sanitized = sanitizePublishedContent(test.input);
      log(`Sanitized: ${sanitized}`);
      
      // Check if dangerous content was blocked
      const safety = validateHTMLSafety(test.input);
      log(`Safety: ${safety.isSafe ? '✅ Safe' : '⚠️  Unsafe'}`);

      if (safety.issues.length > 0) {
        log(`Issues found: ${safety.issues.join(', ')}`);
      }
      
      // Basic test: ensure no scripts remain
      const hasScript = sanitized.toLowerCase().includes('<script') || 
                       sanitized.toLowerCase().includes('javascript:') ||
                       sanitized.includes('onclick=') ||
                       sanitized.includes('onerror=');
      
      if (test.shouldBlock && hasScript) {
        log('❌ FAILED - Dangerous content not blocked!');
        failed++;
      } else if (!test.shouldBlock && sanitized.trim() === '') {
        log('❌ FAILED - Legitimate content was blocked!');
        failed++;
      } else {
        log('✅ PASSED');
        passed++;
      }
      
    } catch (error) {
      logError(`❌ FAILED - Error: ${error}`);
      failed++;
    }

    log('---');
  });

  // Test different profiles
  log('\n🔍 Testing Different Security Profiles...');

  const testHtml = '<p>Paragraph</p><script>alert("xss")</script><a href="https://example.com">Link</a>';

  log('Published Content (Strict):', sanitizePublishedContent(testHtml));
  log('Editor Content (Permissive):', sanitizeEditorContent(testHtml));
  log('Formatting Only:', sanitizeFormattingContent(testHtml));
  log('Strip All HTML:', stripAllHTML(testHtml));

  log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    log('🎉 All security tests passed!');
  } else {
    log('⚠️  Some tests failed - review security implementation');
  }
  
  return { passed, failed };
};
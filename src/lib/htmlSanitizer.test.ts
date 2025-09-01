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
  console.log('🧪 Running HTML Sanitization Security Tests...\n');
  
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
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log(`Input: ${test.input}`);
    
    try {
      // Test with published content profile (strictest)
      const sanitized = sanitizePublishedContent(test.input);
      console.log(`Sanitized: ${sanitized}`);
      
      // Check if dangerous content was blocked
      const safety = validateHTMLSafety(test.input);
      console.log(`Safety: ${safety.isSafe ? '✅ Safe' : '⚠️  Unsafe'}`);
      
      if (safety.issues.length > 0) {
        console.log(`Issues found: ${safety.issues.join(', ')}`);
      }
      
      // Basic test: ensure no scripts remain
      const hasScript = sanitized.toLowerCase().includes('<script') || 
                       sanitized.toLowerCase().includes('javascript:') ||
                       sanitized.includes('onclick=') ||
                       sanitized.includes('onerror=');
      
      if (test.shouldBlock && hasScript) {
        console.log('❌ FAILED - Dangerous content not blocked!');
        failed++;
      } else if (!test.shouldBlock && sanitized.trim() === '') {
        console.log('❌ FAILED - Legitimate content was blocked!');
        failed++;
      } else {
        console.log('✅ PASSED');
        passed++;
      }
      
    } catch (error) {
      console.log(`❌ FAILED - Error: ${error}`);
      failed++;
    }
    
    console.log('---');
  });

  // Test different profiles
  console.log('\n🔍 Testing Different Security Profiles...');
  
  const testHtml = '<p>Paragraph</p><script>alert("xss")</script><a href="https://example.com">Link</a>';
  
  console.log('Published Content (Strict):', sanitizePublishedContent(testHtml));
  console.log('Editor Content (Permissive):', sanitizeEditorContent(testHtml));
  console.log('Formatting Only:', sanitizeFormattingContent(testHtml));
  console.log('Strip All HTML:', stripAllHTML(testHtml));

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All security tests passed!');
  } else {
    console.log('⚠️  Some tests failed - review security implementation');
  }
  
  return { passed, failed };
};
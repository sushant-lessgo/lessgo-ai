import { logger } from '@/lib/logger';

// Test file for transition lock system - Step 2
import { 
  getActiveToolbar, 
  createEditorSelection,
  type EditorSelection 
} from './selectionPriority';

// Mock transition scenarios
const transitionScenarios = [
  {
    name: 'Double-click text should lock to text toolbar',
    sequence: [
      {
        step: 'Initial state',
        selection: { mode: 'edit', isTextEditing: false, selectedSection: 'hero' },
        expected: 'section'
      },
      {
        step: 'User double-clicks text',
        selection: { mode: 'edit', isTextEditing: true, textEditingElement: { sectionId: 'hero', elementKey: 'heading' }, selectedElement: { sectionId: 'hero', elementKey: 'heading', type: 'text', editMode: 'inline' } },
        expected: 'text',
        shouldLock: true,
        lockReason: 'text editing started'
      },
      {
        step: 'Click somewhere else during lock',
        selection: { mode: 'edit', isTextEditing: false, selectedSection: 'cta' },
        expected: 'text', // Should remain locked to text
        duringLock: true
      }
    ]
  },
  {
    name: 'Rapid element clicking should debounce',
    sequence: [
      {
        step: 'Select first element',
        selection: { mode: 'edit', isTextEditing: false, selectedElement: { sectionId: 'hero', elementKey: 'heading', type: 'text', editMode: 'inline' } },
        expected: 'element'
      },
      {
        step: 'Quickly select second element (within debounce)',
        selection: { mode: 'edit', isTextEditing: false, selectedElement: { sectionId: 'hero', elementKey: 'subheading', type: 'text', editMode: 'inline' } },
        expected: 'element', // Should be locked to first element
        shouldBlock: true
      }
    ]
  },
  {
    name: 'Section to text transition',
    sequence: [
      {
        step: 'Section selected',
        selection: { mode: 'edit', isTextEditing: false, selectedSection: 'hero' },
        expected: 'section'
      },
      {
        step: 'Start text editing',
        selection: { mode: 'edit', isTextEditing: true, textEditingElement: { sectionId: 'hero', elementKey: 'heading' }, selectedElement: { sectionId: 'hero', elementKey: 'heading', type: 'text', editMode: 'inline' } },
        expected: 'text',
        shouldLock: true
      }
    ]
  }
];

/**
 * Test transition lock behavior
 * This simulates the transition lock system without actually running React hooks
 */
export function testTransitionLocks() {
  logger.debug('🧪 Testing Transition Lock System...\n');
  
  let passed = 0;
  let failed = 0;
  
  transitionScenarios.forEach(scenario => {
    logger.debug(`\n📋 Scenario: ${scenario.name}`);
    
    scenario.sequence.forEach((step, index) => {
      logger.debug(`  ${index + 1}. ${step.step}`);
      
      const editorSelection = createEditorSelection(step.selection as any);
      const result = getActiveToolbar(editorSelection);
      const resultStr = result || 'null';
      
      if (resultStr === step.expected) {
        logger.debug(`     ✅ Expected ${step.expected}, got ${resultStr}`);
        passed++;
      } else {
        logger.debug(`     ❌ Expected ${step.expected}, got ${resultStr}`);
        failed++;
      }
      
      if ('shouldLock' in step && step.shouldLock) {
        logger.debug(`     🔒 Should trigger lock: ${'lockReason' in step ? step.lockReason : 'transition'}`);
      }
      
      if ('shouldBlock' in step && step.shouldBlock) {
        logger.debug(`     ⛔ Should be blocked by debounce/lock`);
      }
      
      if ('duringLock' in step && step.duringLock) {
        logger.debug(`     🔒 During lock period - toolbar should remain locked`);
      }
    });
  });
  
  logger.debug(`\n🧪 Basic Priority Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    logger.debug('🎉 All basic tests passed! Transition lock scenarios look correct.');
    logger.debug('\n📝 Next: Test with actual React hooks in browser');
    logger.debug('   1. Open dev tools console');
    logger.debug('   2. Double-click text elements');
    logger.debug('   3. Watch for lock messages like "🔒 Transition locked: text editing started"');
    logger.debug('   4. Try clicking other elements during lock period');
    logger.debug('   5. Verify toolbar stays locked for ~350ms');
  } else {
    logger.debug('❌ Some basic tests failed. Check the logic before testing locks.');
  }
  
  return { passed, failed };
}

/**
 * Instructions for manual testing in browser
 */
export const transitionLockTestInstructions = `
🧪 MANUAL TESTING GUIDE FOR TRANSITION LOCKS:

1. Open browser dev tools console

2. Test Text Editing Lock:
   - Double-click any text element
   - Should see: "🔒 Transition locked: text editing started: [elementKey]"
   - Try clicking other elements immediately
   - Text toolbar should stay visible for ~350ms
   - After lock expires, normal priority rules apply

3. Test Element Selection Lock:
   - Click an element (not text)
   - Should see: "🔒 Transition locked: element selected: [elementKey]"
   - Try rapid clicking other elements
   - Should be debounced/locked for ~350ms

4. Test Section Selection Lock:
   - Click a section (empty area)
   - Should see: "🔒 Transition locked: section selected: [sectionId]"
   - Section toolbar should appear and lock briefly

5. Expected Console Output:
   ✅ "🔒 Transition locked: [reason]"
   ✅ "📝 TextToolbar state: { isTransitionLocked: true, lockReason: '...' }"
   ✅ "🔓 Transition unlocked: timeout"
   ❌ No rapid toolbar switching/flickering

6. Look for Problems:
   - Toolbar flickering during transitions
   - Multiple toolbars visible simultaneously
   - Locks not expiring (stuck toolbars)
   - Excessive console spam
`;

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).testTransitionLocks = testTransitionLocks;
  (window as any).transitionLockTestInstructions = transitionLockTestInstructions;
  logger.debug('🧪 Transition Lock Test available at window.testTransitionLocks()');
  logger.debug('📋 Test instructions at window.transitionLockTestInstructions');
}
import { logger } from '@/lib/logger';

// Test file for selection priority system
import { 
  getActiveToolbar, 
  shouldShowToolbar, 
  createEditorSelection,
  debugSelection,
  type EditorSelection 
} from './selectionPriority';

// Test scenarios
const scenarios: Array<{ name: string; selection: EditorSelection; expected: string }> = [
  {
    name: 'Text editing should take priority',
    selection: {
      mode: 'edit',
      isTextEditing: true,
      textEditingElement: { sectionId: 'hero', elementKey: 'heading' },
      selectedElement: { sectionId: 'hero', elementKey: 'heading', type: 'text', editMode: 'inline' },
      selectedSection: 'hero'
    },
    expected: 'text'
  },
  {
    name: 'Element selection when not text editing',
    selection: {
      mode: 'edit',
      isTextEditing: false,
      selectedElement: { sectionId: 'hero', elementKey: 'heading', type: 'text', editMode: 'inline' },
      selectedSection: 'hero'
    },
    expected: 'element'
  },
  {
    name: 'Section selection only',
    selection: {
      mode: 'edit',
      isTextEditing: false,
      selectedSection: 'hero'
    },
    expected: 'section'
  },
  {
    name: 'Preview mode should show no toolbar',
    selection: {
      mode: 'preview',
      isTextEditing: true,
      textEditingElement: { sectionId: 'hero', elementKey: 'heading' },
      selectedElement: { sectionId: 'hero', elementKey: 'heading', type: 'text', editMode: 'inline' },
      selectedSection: 'hero'
    },
    expected: 'null'
  },
  {
    name: 'No selection should show no toolbar',
    selection: {
      mode: 'edit',
      isTextEditing: false,
    },
    expected: 'null'
  }
];

// Run tests
export function testSelectionPriority() {
  logger.debug('🧪 Testing Selection Priority System...\n');
  
  let passed = 0;
  let failed = 0;
  
  scenarios.forEach(scenario => {
    logger.debug(`Testing: ${scenario.name}`);
    
    const result = getActiveToolbar(scenario.selection);
    const resultStr = result || 'null';
    
    if (resultStr === scenario.expected) {
      logger.debug(`✅ PASS: Expected ${scenario.expected}, got ${resultStr}`);
      passed++;
    } else {
      logger.debug(`❌ FAIL: Expected ${scenario.expected}, got ${resultStr}`);
      debugSelection(scenario.selection, scenario.name);
      failed++;
    }
    
    // Test shouldShowToolbar for each type
    const shouldShowText = shouldShowToolbar('text', scenario.selection);
    const shouldShowElement = shouldShowToolbar('element', scenario.selection);
    const shouldShowSection = shouldShowToolbar('section', scenario.selection);
    
    logger.debug(`   Text toolbar visible: ${shouldShowText}`);
    logger.debug(`   Element toolbar visible: ${shouldShowElement}`);
    logger.debug(`   Section toolbar visible: ${shouldShowSection}`);
    logger.debug('');
  });
  
  logger.debug(`\n🧪 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    logger.debug('🎉 All tests passed! Priority system working correctly.');
  } else {
    logger.debug('❌ Some tests failed. Check the logic.');
  }
  
  return { passed, failed };
}

// Run tests if called directly
if (typeof window !== 'undefined') {
  (window as any).testSelectionPriority = testSelectionPriority;
  logger.debug('🧪 Selection Priority Test available at window.testSelectionPriority()');
}
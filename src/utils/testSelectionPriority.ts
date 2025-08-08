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
  console.log('🧪 Testing Selection Priority System...\n');
  
  let passed = 0;
  let failed = 0;
  
  scenarios.forEach(scenario => {
    console.log(`Testing: ${scenario.name}`);
    
    const result = getActiveToolbar(scenario.selection);
    const resultStr = result || 'null';
    
    if (resultStr === scenario.expected) {
      console.log(`✅ PASS: Expected ${scenario.expected}, got ${resultStr}`);
      passed++;
    } else {
      console.log(`❌ FAIL: Expected ${scenario.expected}, got ${resultStr}`);
      debugSelection(scenario.selection, scenario.name);
      failed++;
    }
    
    // Test shouldShowToolbar for each type
    const shouldShowText = shouldShowToolbar('text', scenario.selection);
    const shouldShowElement = shouldShowToolbar('element', scenario.selection);
    const shouldShowSection = shouldShowToolbar('section', scenario.selection);
    
    console.log(`   Text toolbar visible: ${shouldShowText}`);
    console.log(`   Element toolbar visible: ${shouldShowElement}`);
    console.log(`   Section toolbar visible: ${shouldShowSection}`);
    console.log('');
  });
  
  console.log(`\n🧪 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Priority system working correctly.');
  } else {
    console.log('❌ Some tests failed. Check the logic.');
  }
  
  return { passed, failed };
}

// Run tests if called directly
if (typeof window !== 'undefined') {
  (window as any).testSelectionPriority = testSelectionPriority;
  console.log('🧪 Selection Priority Test available at window.testSelectionPriority()');
}
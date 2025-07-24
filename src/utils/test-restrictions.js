// Simple test script to verify the restriction system works
const { getElementRestrictions, validateElementAddition, getRestrictionSummary } = require('./elementRestrictions');

// Test the restriction system
console.log('Testing Element Restriction System...\n');

// Test 1: Hero section (strict restrictions)
console.log('1. Testing Hero section restrictions:');
const heroRestrictions = getElementRestrictions('hero', 'centerStacked');
console.log('   Restricted elements:', heroRestrictions.restrictedElements);
console.log('   Allowed elements:', heroRestrictions.allowedElements);
console.log('   Has restrictions:', heroRestrictions.hasRestrictions);
console.log('   Reason:', heroRestrictions.restriction.reason);

// Test 2: Content section (flexible)
console.log('\n2. Testing Content section restrictions:');
const contentRestrictions = getElementRestrictions('content');
console.log('   Restricted elements:', contentRestrictions.restrictedElements);
console.log('   Allowed elements:', contentRestrictions.allowedElements);
console.log('   Has restrictions:', contentRestrictions.hasRestrictions);

// Test 3: Validation
console.log('\n3. Testing element validation:');
const heroValidation = validateElementAddition('text', 'hero', 'centerStacked');
console.log('   Adding text to hero section:', heroValidation);

const contentValidation = validateElementAddition('text', 'content');
console.log('   Adding text to content section:', contentValidation);

// Test 4: Summary
console.log('\n4. Testing restriction summary:');
const heroSummary = getRestrictionSummary('hero', 'centerStacked');
console.log('   Hero summary:', heroSummary);

const contentSummary = getRestrictionSummary('content');
console.log('   Content summary:', contentSummary);

console.log('\n✅ Restriction system test complete!');
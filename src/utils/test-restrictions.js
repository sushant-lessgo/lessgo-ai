// Simple test script to verify the restriction system works
const { getElementRestrictions, validateElementAddition, getRestrictionSummary } = require('./elementRestrictions');

// Test the restriction system - console logs removed for production

// Test 1: Hero section (strict restrictions)
const heroRestrictions = getElementRestrictions('hero', 'centerStacked');

// Test 2: Content section (flexible)
const contentRestrictions = getElementRestrictions('content');

// Test 3: Validation
const heroValidation = validateElementAddition('text', 'hero', 'centerStacked');
const contentValidation = validateElementAddition('text', 'content');

// Test 4: Summary
const heroSummary = getRestrictionSummary('hero', 'centerStacked');
const contentSummary = getRestrictionSummary('content');

// Restriction system test completed
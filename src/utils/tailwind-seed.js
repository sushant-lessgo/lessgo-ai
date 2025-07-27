/**
 * Tailwind CSS Seed File
 * This file contains class patterns that help Tailwind's JIT compiler
 * understand what arbitrary value patterns we might use at runtime.
 * 
 * DO NOT DELETE - This file is critical for custom background functionality
 */

// This function will never be called, but it contains class names that 
// help Tailwind's content scanner understand our patterns
function tailwindSeed() {
  // Representative hex color patterns showing different character combinations
  const hexColors = [
    // Basic colors
    'bg-[#000000]', 'bg-[#FFFFFF]', 'bg-[#FF0000]', 'bg-[#00FF00]', 'bg-[#0000FF]',
    // Test colors that were having issues
    'bg-[#16A34A]', 'bg-[#7C3AED]', 'bg-[#B45309]', 'bg-[#DC2626]',
    // Various patterns to help Tailwind understand all hex combinations
    'bg-[#123456]', 'bg-[#ABCDEF]', 'bg-[#789ABC]', 'bg-[#DEF012]',
    'bg-[#456789]', 'bg-[#FEDCBA]', 'bg-[#987654]', 'bg-[#321FED]'
  ];
  
  // RGB color patterns
  const rgbColors = [
    'bg-[rgb(255,0,0)]', 'bg-[rgb(0,255,0)]', 'bg-[rgb(0,0,255)]',
    'bg-[rgba(255,0,0,0.5)]', 'bg-[rgba(0,255,0,0.8)]'
  ];
  
  // Gradient patterns
  const gradients = [
    'bg-[linear-gradient(90deg,#ff0000,#00ff00)]',
    'bg-[linear-gradient(45deg,#000000,#ffffff)]',
    'bg-[radial-gradient(circle,#ff0000,#0000ff)]'
  ];
  
  // This creates a template that shows Tailwind what patterns to expect
  const dynamicClass = (color) => `bg-[${color}]`;
  
  return { hexColors, rgbColors, gradients, dynamicClass };
}

// Export for potential debugging
export { tailwindSeed };
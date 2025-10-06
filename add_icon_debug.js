const fs = require('fs');
const path = require('path');

function addIconGridDebug() {
  const filePath = path.join(__dirname, 'src/modules/UIBlocks/Features/IconGrid.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add debug logging after icons array
  const pattern1 = /(const icons = \[[\s\S]*?blockContent\.icon_9\s*\];)\s*\n\s*(return titleList\.map)/;

  const replacement1 = `$1

  // Debug logging for IconGrid
  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
    console.log('🎯 [ICON] IconGrid - Raw icons from blockContent:', {
      icon_1: blockContent.icon_1,
      icon_2: blockContent.icon_2,
      icon_3: blockContent.icon_3,
      icon_4: blockContent.icon_4,
      icon_5: blockContent.icon_5,
    });
    console.log('🎯 [ICON] IconGrid - Titles:', titleList);
  }

  $2`;

  content = content.replace(pattern1, replacement1);

  // Replace the return statement
  const pattern2 = /return titleList\.map\(\(title, index\) => \(\{[\s\S]*?icon: getValidatedIcon\(icons\[index\], title\)[\s\S]*?\}\)\);/;

  const replacement2 = `return titleList.map((title, index) => {
    const iconValue = icons[index];
    const finalIcon = getValidatedIcon(iconValue, title);

    if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
      console.log(\`🎯 [ICON] IconGrid - Feature \${index + 1} (\${title}):\`, {
        rawIcon: iconValue,
        isValid: iconValue && isValidIcon(iconValue),
        finalIcon,
        usedFallback: !iconValue || !isValidIcon(iconValue)
      });
    }

    return {
      id: \`feature-\${index}\`,
      index,
      title,
      description: descriptionList[index] || 'Feature description not provided.',
      iconType: '',
      icon: finalIcon
    };
  });`;

  content = content.replace(pattern2, replacement2);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated IconGrid.tsx');
}

function addOutcomeIconsDebug() {
  const filePath = path.join(__dirname, 'src/modules/UIBlocks/Results/OutcomeIcons.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add debug logging after descriptionList
  const pattern1 = /(const descriptionList = descriptions\.split.*?;)\s*\n\s*(return iconList\.map)/;

  const replacement1 = `$1

  // Debug logging for OutcomeIcons
  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
    console.log('🎯 [ICON] OutcomeIcons - Raw data:', {
      iconTypes,
      titles,
      iconList,
      titleList
    });
  }

  $2`;

  content = content.replace(pattern1, replacement1);

  // Replace return statement
  const pattern2 = /return iconList\.map\(\(iconType, index\) => \(\{[\s\S]*?description: descriptionList\[index\][\s\S]*?\}\)\);/;

  const replacement2 = `return iconList.map((iconType, index) => {
    if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
      console.log(\`🎯 [ICON] OutcomeIcons - Item \${index + 1}:\`, {
        iconType,
        title: titleList[index]
      });
    }

    return {
      id: \`outcome-\${index}\`,
      iconType,
      title: titleList[index] || 'Great Outcome',
      description: descriptionList[index] || 'Amazing results await'
    };
  });`;

  content = content.replace(pattern2, replacement2);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated OutcomeIcons.tsx');
}

function addStackedHighlightsDebug() {
  const filePath = path.join(__dirname, 'src/modules/UIBlocks/UniqueMechanism/StackedHighlights.tsx');

  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Find and add basic logging - this is a simpler approach
    if (content.includes('highlight_icon')) {
      const pattern = /(const.*highlight.*icon.*=)/i;
      const replacement = `// Debug logging for StackedHighlights
  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
    console.log('🎯 [ICON] StackedHighlights - Processing highlight icons');
  }

  $1`;

      content = content.replace(pattern, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ Updated StackedHighlights.tsx');
    } else {
      console.log('⚠️  StackedHighlights.tsx - No highlight_icon pattern found, manual update needed');
    }
  } else {
    console.log('❌ StackedHighlights.tsx not found');
  }
}

console.log('Adding icon debug logging to components...\n');

try {
  addIconGridDebug();
} catch (e) {
  console.log('❌ Error updating IconGrid:', e.message);
}

try {
  addOutcomeIconsDebug();
} catch (e) {
  console.log('❌ Error updating OutcomeIcons:', e.message);
}

try {
  addStackedHighlightsDebug();
} catch (e) {
  console.log('❌ Error updating StackedHighlights:', e.message);
}

console.log('\n✅ Done! Restart your dev server to see the debug logs.');

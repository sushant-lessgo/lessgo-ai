#!/usr/bin/env python3
"""Script to add icon debugging to React components"""

import re

# IconGrid.tsx modifications
def add_icongrid_debug():
    file_path = r'C:\Users\susha\lessgo-ai\src\modules\UIBlocks\Features\IconGrid.tsx'

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the parseFeatureData function and add debug logging
    # Pattern 1: Add debug after icons array
    pattern1 = r'(const icons = \[[\s\S]*?blockContent\.icon_9\s*\];)\s*\n\s*(return titleList\.map)'

    replacement1 = r'''\1

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

  \2'''

    content = re.sub(pattern1, replacement1, content)

    # Pattern 2: Replace the return statement to add per-item logging
    pattern2 = r'return titleList\.map\(\(title, index\) => \(\{[\s\S]*?icon: getValidatedIcon\(icons\[index\], title\)[\s\S]*?\}\)\);'

    replacement2 = '''return titleList.map((title, index) => {
    const iconValue = icons[index];
    const finalIcon = getValidatedIcon(iconValue, title);

    if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
      console.log(`🎯 [ICON] IconGrid - Feature ${index + 1} (${title}):`, {
        rawIcon: iconValue,
        isValid: iconValue && isValidIcon(iconValue),
        finalIcon,
        usedFallback: !iconValue || !isValidIcon(iconValue)
      });
    }

    return {
      id: `feature-${index}`,
      index,
      title,
      description: descriptionList[index] || 'Feature description not provided.',
      iconType: '',
      icon: finalIcon
    };
  });'''

    content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Updated {file_path}")

# OutcomeIcons.tsx modifications
def add_outcomeicons_debug():
    file_path = r'C:\Users\susha\lessgo-ai\src\modules\UIBlocks\Results\OutcomeIcons.tsx'

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add debug logging after descriptionList
    pattern1 = r'(const descriptionList = descriptions\.split.*?;)\s*\n\s*(return iconList\.map)'

    replacement1 = r'''\1

  // Debug logging for OutcomeIcons
  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
    console.log('🎯 [ICON] OutcomeIcons - Raw data:', {
      iconTypes,
      titles,
      iconList,
      titleList
    });
  }

  \2'''

    content = re.sub(pattern1, replacement1, content)

    # Replace return statement to add per-item logging
    pattern2 = r'return iconList\.map\(\(iconType, index\) => \(\{[\s\S]*?description: descriptionList\[index\][\s\S]*?\}\)\);'

    replacement2 = '''return iconList.map((iconType, index) => {
    if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
      console.log(`🎯 [ICON] OutcomeIcons - Item ${index + 1}:`, {
        iconType,
        title: titleList[index]
      });
    }

    return {
      id: `outcome-${index}`,
      iconType,
      title: titleList[index] || 'Great Outcome',
      description: descriptionList[index] || 'Amazing results await'
    };
  });'''

    content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Updated {file_path}")

# StackedHighlights.tsx modifications
def add_stackedhighlights_debug():
    file_path = r'C:\Users\susha\lessgo-ai\src\modules\UIBlocks\UniqueMechanism\StackedHighlights.tsx'

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find where highlights are parsed and add debug logging
        # This will need to be customized based on the actual structure
        pattern = r'(highlight_icons.*?split.*?;)'

        if re.search(pattern, content):
            replacement = r'''\1
  // Debug logging for StackedHighlights
  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
    console.log('🎯 [ICON] StackedHighlights - Icon data:', arguments);
  }'''

            content = re.sub(pattern, replacement, content, count=1)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"✅ Updated {file_path}")
        else:
            print(f"⚠️  Pattern not found in {file_path}, manual update needed")
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")

if __name__ == '__main__':
    print("Adding icon debug logging to components...")
    print()

    try:
        add_icongrid_debug()
    except Exception as e:
        print(f"❌ Error updating IconGrid: {e}")

    try:
        add_outcomeicons_debug()
    except Exception as e:
        print(f"❌ Error updating OutcomeIcons: {e}")

    try:
        add_stackedhighlights_debug()
    except Exception as e:
        print(f"❌ Error updating StackedHighlights: {e}")

    print()
    print("✅ Done! Restart your dev server to see the debug logs.")

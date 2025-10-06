#!/bin/bash

# Script to add icon debugging console.log statements to the components

# Backup files first
cp src/modules/UIBlocks/Features/IconGrid.tsx src/modules/UIBlocks/Features/IconGrid.tsx.bak
cp src/modules/UIBlocks/Results/OutcomeIcons.tsx src/modules/UIBlocks/Results/OutcomeIcons.tsx.bak
cp src/modules/UIBlocks/UniqueMechanism/StackedHighlights.tsx src/modules/UIBlocks/UniqueMechanism/StackedHighlights.tsx.bak

echo "Files backed up"
echo "To add debug logging, manually add the following console.log statements:"
echo ""
echo "1. In IconGrid.tsx parseFeatureData function (around line 145), add after line 160 (after icons array):"
echo ""
echo "  // Debug logging for IconGrid"
echo "  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {"
echo "    console.log('🎯 [ICON] IconGrid - Raw blockContent:', blockContent);"
echo "    console.log('🎯 [ICON] IconGrid - Icons array:', icons);"
echo "  }"
echo ""
echo "2. In OutcomeIcons.tsx parseOutcomeData function (around line 44), add after line 47:"
echo ""
echo "  // Debug logging for OutcomeIcons"
echo "  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {"
echo "    console.log('🎯 [ICON] OutcomeIcons - Icon types:', iconList);"
echo "    console.log('🎯 [ICON] OutcomeIcons - Titles:', titleList);"
echo "  }"
echo ""
echo "3. In StackedHighlights.tsx, search for highlight_icons parsing and add similar logging"

// hooks/useAdvancedActionsMenu.ts - Smart positioning and grouping logic for advanced actions menu
import { useState, useCallback, useEffect, useRef } from 'react';
import type { AdvancedActionItem, AdvancedActionGroup } from '@/app/edit/[token]/components/toolbars/AdvancedActionsMenu';

export interface MenuPosition {
  x: number;
  y: number;
  transform?: string;
  arrow?: {
    side: 'top' | 'bottom' | 'left' | 'right';
    offset: number;
  };
}

interface UseAdvancedActionsMenuProps {
  triggerElement: HTMLElement;
  isVisible: boolean;
  onClose: () => void;
  actions: AdvancedActionItem[];
  toolbarType: 'section' | 'element' | 'text' | 'form' | 'image';
}

// Get group configurations based on toolbar type
const getGroupConfigs = (toolbarType: string) => {
  const configs = {
    section: [
      { key: 'layout', label: 'Layout' },
      { key: 'content', label: 'Content' },
      { key: 'design', label: 'Design' },
      { key: 'ai', label: 'AI Tools' },
      { key: 'advanced', label: 'Advanced' },
    ],
    element: [
      { key: 'edit', label: 'Edit' },
      { key: 'ai', label: 'AI Tools' },
      { key: 'style', label: 'Style' },
      { key: 'advanced', label: 'Advanced' },
    ],
    text: [
      { key: 'format', label: 'Format' },
      { key: 'style', label: 'Style' },
      { key: 'typography', label: 'Typography' },
      { key: 'advanced', label: 'Advanced' },
    ],
    form: [
      { key: 'fields', label: 'Fields' },
      { key: 'validation', label: 'Validation' },
      { key: 'integration', label: 'Integration' },
      { key: 'advanced', label: 'Advanced' },
    ],
    image: [
      { key: 'edit', label: 'Edit' },
      { key: 'filters', label: 'Filters' },
      { key: 'optimization', label: 'Optimization' },
      { key: 'advanced', label: 'Advanced' },
    ],
  };

  return configs[toolbarType as keyof typeof configs] || [];
};

export function useAdvancedActionsMenu({
  triggerElement,
  isVisible,
  onClose,
  actions,
  toolbarType,
}: UseAdvancedActionsMenuProps) {
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [groupedActions, setGroupedActions] = useState<AdvancedActionGroup[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Group actions by their group property
  const groupActions = useCallback((actions: AdvancedActionItem[]): AdvancedActionGroup[] => {
    console.log('🎯 groupActions called with:', actions);
    
    const groups = new Map<string, AdvancedActionItem[]>();
    
    // Group actions by their group property
    actions.forEach(action => {
      const groupKey = action.group || 'default';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(action);
    });
    
    console.log('🎯 Groups map:', Array.from(groups.entries()));

    // Convert to array with proper labels based on toolbar type
    const result: AdvancedActionGroup[] = [];
    
    // Define group order and labels based on toolbar type
    const groupConfigs = getGroupConfigs(toolbarType);
    
    // Process groups in defined order
    groupConfigs.forEach(config => {
      const groupActions = groups.get(config.key);
      if (groupActions && groupActions.length > 0) {
        result.push({
          id: config.key,
          label: config.label,
          actions: groupActions,
        });
      }
    });

    // Add any remaining ungrouped actions
    const remainingActions = groups.get('default') || [];
    if (remainingActions.length > 0) {
      result.push({
        id: 'default',
        label: undefined,
        actions: remainingActions,
      });
    }

    console.log('🎯 Final grouped actions:', result);
    return result;
  }, [toolbarType]);

  // Calculate optimal position for menu relative to trigger element
  const calculateOptimalPosition = useCallback((
    triggerBounds: DOMRect,
    menuWidth: number = 220,
    menuHeight: number = 200
  ): MenuPosition => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const spacing = 8; // Distance from trigger element
    const arrowSize = 8; // Arrow indicator size

    // Try positions in order of preference
    const positions = [
      {
        name: 'bottom-left',
        x: triggerBounds.left,
        y: triggerBounds.bottom + spacing,
        arrow: { side: 'top' as const, offset: 20 },
      },
      {
        name: 'bottom-right',
        x: triggerBounds.right - menuWidth,
        y: triggerBounds.bottom + spacing,
        arrow: { side: 'top' as const, offset: menuWidth - 20 },
      },
      {
        name: 'top-left',
        x: triggerBounds.left,
        y: triggerBounds.top - menuHeight - spacing,
        arrow: { side: 'bottom' as const, offset: 20 },
      },
      {
        name: 'top-right',
        x: triggerBounds.right - menuWidth,
        y: triggerBounds.top - menuHeight - spacing,
        arrow: { side: 'bottom' as const, offset: menuWidth - 20 },
      },
      {
        name: 'right-top',
        x: triggerBounds.right + spacing,
        y: triggerBounds.top,
        arrow: { side: 'left' as const, offset: 20 },
      },
      {
        name: 'left-top',
        x: triggerBounds.left - menuWidth - spacing,
        y: triggerBounds.top,
        arrow: { side: 'right' as const, offset: 20 },
      },
    ];

    // Find first position that fits in viewport
    for (const pos of positions) {
      const fitsHorizontally = pos.x >= 0 && pos.x + menuWidth <= viewport.width;
      const fitsVertically = pos.y >= 0 && pos.y + menuHeight <= viewport.height;

      if (fitsHorizontally && fitsVertically) {
        return {
          x: pos.x,
          y: pos.y,
          arrow: pos.arrow,
        };
      }
    }

    // Fallback: center in viewport with adjustments
    let fallbackX = Math.max(0, Math.min(viewport.width - menuWidth, triggerBounds.left));
    let fallbackY = Math.max(0, Math.min(viewport.height - menuHeight, triggerBounds.bottom + spacing));

    // Adjust if still doesn't fit
    if (fallbackX + menuWidth > viewport.width) {
      fallbackX = viewport.width - menuWidth - spacing;
    }
    if (fallbackY + menuHeight > viewport.height) {
      fallbackY = triggerBounds.top - menuHeight - spacing;
      if (fallbackY < 0) {
        fallbackY = spacing;
      }
    }

    return {
      x: fallbackX,
      y: fallbackY,
      arrow: undefined, // No arrow for fallback position
    };
  }, []);

  // Update menu position
  const updatePosition = useCallback(() => {
    if (!triggerElement || !isVisible) return;

    const triggerBounds = triggerElement.getBoundingClientRect();
    const menuElement = menuRef.current;
    
    // Get actual menu dimensions if available, otherwise use estimates
    const menuWidth = menuElement?.offsetWidth || 220;
    const menuHeight = menuElement?.offsetHeight || 200;

    const newPosition = calculateOptimalPosition(triggerBounds, menuWidth, menuHeight);
    setPosition(newPosition);
  }, [triggerElement, isVisible, calculateOptimalPosition]);

  // Handle click outside to close menu
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    console.log('🎯 handleClickOutside called:', {
      target: target.tagName,
      targetClass: target.className,
      isInTrigger: triggerElement?.contains(target),
      isInMenu: menuRef.current?.contains(target)
    });
    
    // Don't close if clicking on the trigger element or menu
    if (triggerElement?.contains(target) || menuRef.current?.contains(target)) {
      console.log('🎯 Click inside menu or trigger, not closing');
      return;
    }

    console.log('🎯 Click outside, closing menu');
    onClose();
  }, [triggerElement, onClose]);

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (!isVisible) return;

    const menuElement = menuRef.current;
    if (!menuElement) return;

    const menuItems = menuElement.querySelectorAll('[role="menuitem"]:not([disabled])');
    const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;

      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        (menuItems[nextIndex] as HTMLElement).focus();
        break;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        (menuItems[prevIndex] as HTMLElement).focus();
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0) {
          (menuItems[currentIndex] as HTMLElement).click();
        }
        break;

      case 'Home':
        event.preventDefault();
        (menuItems[0] as HTMLElement).focus();
        break;

      case 'End':
        event.preventDefault();
        (menuItems[menuItems.length - 1] as HTMLElement).focus();
        break;
    }
  }, [isVisible, onClose]);

  // Update grouped actions when actions change
  useEffect(() => {
    const grouped = groupActions(actions);
    console.log('🎯 Setting grouped actions:', grouped);
    setGroupedActions(grouped);
  }, [actions, groupActions]);

  // Update position when trigger element or visibility changes
  useEffect(() => {
    if (isVisible) {
      // Use setTimeout to ensure menu is rendered before calculating position
      const timeoutId = setTimeout(updatePosition, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, updatePosition]);

  // Update position on scroll and resize
  useEffect(() => {
    if (!isVisible) return;

    const handleScroll = () => {
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, updatePosition]);

  // Focus first menu item when menu becomes visible
  useEffect(() => {
    if (isVisible && menuRef.current) {
      const firstMenuItem = menuRef.current.querySelector('[role="menuitem"]:not([disabled])') as HTMLElement;
      if (firstMenuItem) {
        setTimeout(() => firstMenuItem.focus(), 100);
      }
    }
  }, [isVisible]);

  console.log('🎯 useAdvancedActionsMenu returning:', { 
    position, 
    groupedActionsLength: groupedActions.length,
    groupedActions 
  });

  return {
    position,
    groupedActions,
    menuRef,
    updatePosition,
    handleClickOutside,
    handleKeyNavigation,
  };
}
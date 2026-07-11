// app/edit/[token]/components/ui/FloatingToolbars.tsx
//
// Phase-3 rebuild: this file no longer resolves selection, positioning, or the
// legacy `toolbar.position`/`toolbar.actions` plumbing. It simply mounts the ONE
// floating shell, which owns visibility, positioning, arrow, and dismissal.
import React from 'react';
import { ToolbarShell } from '../toolbars/ToolbarShell';

export function FloatingToolbars() {
  return <ToolbarShell />;
}

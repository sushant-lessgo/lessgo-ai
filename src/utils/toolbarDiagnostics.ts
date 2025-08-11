// src/utils/toolbarDiagnostics.ts - Comprehensive toolbar diagnostic system
// Provides detailed debugging info for toolbar visibility issues

export interface ToolbarDiagnostic {
  timestamp: number;
  phase: 'click' | 'selection' | 'anchor' | 'render' | 'priority';
  component: string;
  data: Record<string, any>;
  level: 'info' | 'warn' | 'error';
}

export interface AnchorDiagnostic {
  key: string;
  exists: boolean;
  element: HTMLElement | null;
  rect: DOMRect | null;
  isVisible: boolean;
  isInDOM: boolean;
  registeredAt?: number;
}

export interface SelectionDiagnostic {
  selectedSection: string | null;
  selectedElement: any;
  textEditingElement: any;
  mode: string;
  anchorCount: number;
  priorityResult: {
    activeToolbar: string | null;
    shouldShowToolbar: Record<string, boolean>;
  };
}

// PHASE 4: Smart diagnostic buffering with sampling
interface ComponentDiagnosticState {
  lastFlush: number;
  pendingDiagnostics: Map<string, ToolbarDiagnostic>; // key -> latest diagnostic
  sampleCount: number;
}

const componentDiagnosticStates = new Map<string, ComponentDiagnosticState>();
const globalDiagnosticBuffer: ToolbarDiagnostic[] = [];
const MAX_GLOBAL_DIAGNOSTICS = 200;
const FLUSH_INTERVAL = 250; // ms - max flush frequency
const SAMPLE_RATE = 0.01; // ENHANCED PHASE 5: 1% sampling for render logs (was 10%)

// Feature flags for diagnostic control
let diagnosticsEnabled = process.env.NODE_ENV === 'development';
let verboseDiagnostics = false;

/**
 * Enable or disable diagnostics
 */
export function setDiagnosticsEnabled(enabled: boolean, verbose: boolean = false): void {
  diagnosticsEnabled = enabled;
  verboseDiagnostics = verbose;
}

/**
 * Get component diagnostic state, creating if needed
 */
function getComponentState(componentName: string): ComponentDiagnosticState {
  if (!componentDiagnosticStates.has(componentName)) {
    componentDiagnosticStates.set(componentName, {
      lastFlush: 0,
      pendingDiagnostics: new Map(),
      sampleCount: 0,
    });
  }
  return componentDiagnosticStates.get(componentName)!;
}

/**
 * PHASE 4: Smart diagnostic logging with sampling and buffering
 */
export function logToolbarDiagnostic(
  phase: ToolbarDiagnostic['phase'],
  component: string,
  data: Record<string, any>,
  level: ToolbarDiagnostic['level'] = 'info'
) {
  if (!diagnosticsEnabled) return;

  const diagnostic: ToolbarDiagnostic = {
    timestamp: Date.now(),
    phase,
    component,
    data,
    level
  };

  const state = getComponentState(component);
  
  // PHASE 4: Last-write-wins buffering per component
  const key = `${phase}-${level}`;
  state.pendingDiagnostics.set(key, diagnostic);
  
  // PHASE 4: Sampling for render phase to reduce spam
  if (phase === 'render') {
    state.sampleCount++;
    if (state.sampleCount % Math.ceil(1 / SAMPLE_RATE) !== 0) {
      // Skip this render log (sampling)
      return;
    }
  }

  // Schedule flush if not already scheduled
  const now = Date.now();
  if (now - state.lastFlush >= FLUSH_INTERVAL) {
    flushComponentDiagnostics(component);
  } else if (level === 'error') {
    // Always flush errors immediately
    flushComponentDiagnostics(component);
  }
}

/**
 * Flush pending diagnostics for a component
 */
function flushComponentDiagnostics(component: string): void {
  const state = getComponentState(component);
  const now = Date.now();
  
  if (state.pendingDiagnostics.size === 0) return;
  
  // Add all pending diagnostics to global buffer
  for (const diagnostic of state.pendingDiagnostics.values()) {
    globalDiagnosticBuffer.push(diagnostic);
    
    // Log to console with feature flag check
    if (diagnosticsEnabled && (verboseDiagnostics || diagnostic.level === 'error')) {
      const icon = diagnostic.level === 'error' ? '❌' : diagnostic.level === 'warn' ? '⚠️' : '🔍';
      const phaseIcon = {
        click: '🖱️',
        selection: '🎯',
        anchor: '⚓',
        render: '🎨',
        priority: '📊'
      }[diagnostic.phase];
      
      console.log(
        `${icon} ${phaseIcon} [${component}] ${diagnostic.phase.toUpperCase()}:`,
        diagnostic.data
      );
    }
  }
  
  // Clear pending diagnostics and update flush time
  state.pendingDiagnostics.clear();
  state.lastFlush = now;
  
  // Keep global buffer manageable
  while (globalDiagnosticBuffer.length > MAX_GLOBAL_DIAGNOSTICS) {
    globalDiagnosticBuffer.shift();
  }
}

/**
 * Diagnose anchor registration and positioning
 */
export function diagnoseAnchorSystem(globalAnchor: any): {
  summary: string;
  details: AnchorDiagnostic[];
  recommendations: string[];
} {
  const allAnchors = globalAnchor.getAllAnchors();
  const anchorCount = globalAnchor.anchorCount;
  
  const details: AnchorDiagnostic[] = Object.entries(allAnchors).map(([key, anchor]: [string, any]) => {
    const element = anchor.element;
    const rect = element ? element.getBoundingClientRect() : null;
    const isInDOM = element ? document.contains(element) : false;
    const isVisible = rect ? (rect.width > 0 && rect.height > 0) : false;

    return {
      key,
      exists: !!anchor,
      element,
      rect,
      isVisible,
      isInDOM,
      registeredAt: anchor.registeredAt
    };
  });

  // Generate summary
  const validAnchors = details.filter(d => d.exists && d.isInDOM && d.isVisible);
  const staleAnchors = details.filter(d => d.exists && (!d.isInDOM || !d.isVisible));
  
  const summary = `${validAnchors.length}/${details.length} anchors valid, ${staleAnchors.length} stale`;

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (anchorCount === 0) {
    recommendations.push('No anchors registered - check component anchor registration');
  }
  
  if (staleAnchors.length > 0) {
    recommendations.push(`${staleAnchors.length} stale anchors found - cleanup needed`);
  }

  const elementAnchors = details.filter(d => d.key.startsWith('element:'));
  if (elementAnchors.length === 0) {
    recommendations.push('No element anchors found - check InlineTextEditor dual registration');
  }

  return { summary, details, recommendations };
}

/**
 * Diagnose selection and priority system
 */
export function diagnoseSelection(editorSelection: any, priorityResult: any): SelectionDiagnostic {
  return {
    selectedSection: editorSelection.selectedSection,
    selectedElement: editorSelection.selectedElement,
    textEditingElement: editorSelection.textEditingElement,
    mode: editorSelection.mode,
    anchorCount: priorityResult.globalAnchor?.anchorCount || 0,
    priorityResult: {
      activeToolbar: priorityResult.activeToolbar,
      shouldShowToolbar: {
        text: priorityResult.shouldShowToolbar?.('text'),
        element: priorityResult.shouldShowToolbar?.('element'),
        section: priorityResult.shouldShowToolbar?.('section'),
        image: priorityResult.shouldShowToolbar?.('image'),
        form: priorityResult.shouldShowToolbar?.('form')
      }
    }
  };
}

/**
 * Generate comprehensive diagnostic report
 */
export function generateDiagnosticReport(
  globalAnchor: any,
  editorSelection: any,
  priorityResult: any
): {
  timestamp: number;
  anchor: ReturnType<typeof diagnoseAnchorSystem>;
  selection: SelectionDiagnostic;
  recentEvents: ToolbarDiagnostic[];
  verdict: {
    shouldElementToolbarShow: boolean;
    blockingFactors: string[];
    nextSteps: string[];
  };
} {
  const anchor = diagnoseAnchorSystem(globalAnchor);
  const selection = diagnoseSelection(editorSelection, priorityResult);
  
  // Get recent events
  const recentEvents = globalDiagnosticBuffer.slice(-10);
  
  // Determine verdict
  const blockingFactors: string[] = [];
  const nextSteps: string[] = [];
  
  // Check for common blocking factors
  if (selection.mode !== 'edit') {
    blockingFactors.push(`Mode is '${selection.mode}', not 'edit'`);
  }
  
  if (!selection.selectedElement) {
    blockingFactors.push('No element selected');
  }
  
  if (selection.anchorCount === 0) {
    blockingFactors.push('No anchors registered');
  }
  
  if (!selection.priorityResult.shouldShowToolbar.element) {
    blockingFactors.push('Priority system says element toolbar should not show');
  }

  const elementAnchorExists = anchor.details.some(d => 
    d.key.startsWith('element:') && d.exists && d.isInDOM && d.isVisible
  );
  
  if (!elementAnchorExists) {
    blockingFactors.push('No valid element anchor exists');
    nextSteps.push('Check InlineTextEditor dual anchor registration');
  }

  // Determine if element toolbar should show
  const shouldElementToolbarShow = (
    selection.mode === 'edit' &&
    !!selection.selectedElement &&
    selection.anchorCount > 0 &&
    selection.priorityResult.shouldShowToolbar.element &&
    elementAnchorExists
  );

  if (!shouldElementToolbarShow && blockingFactors.length === 0) {
    blockingFactors.push('Unknown reason - all checks pass but toolbar not showing');
  }

  return {
    timestamp: Date.now(),
    anchor,
    selection,
    recentEvents,
    verdict: {
      shouldElementToolbarShow,
      blockingFactors,
      nextSteps
    }
  };
}

/**
 * PHASE 4: Export diagnostics data with enhanced summary
 */
export function exportDiagnostics(): {
  buffer: ToolbarDiagnostic[];
  componentStates: Record<string, any>;
  summary: {
    totalEvents: number;
    byPhase: Record<string, number>;
    byLevel: Record<string, number>;
    byComponent: Record<string, number>;
    timeRange: { start: number; end: number };
    samplingStats: {
      renderLogsSampled: number;
      totalRenderAttempts: number;
      samplingRate: number;
    };
  };
} {
  // Flush all pending diagnostics first
  for (const component of componentDiagnosticStates.keys()) {
    flushComponentDiagnostics(component);
  }

  const byPhase: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  const byComponent: Record<string, number> = {};
  let start = Infinity;
  let end = 0;
  let totalRenderAttempts = 0;

  globalDiagnosticBuffer.forEach(d => {
    byPhase[d.phase] = (byPhase[d.phase] || 0) + 1;
    byLevel[d.level] = (byLevel[d.level] || 0) + 1;
    byComponent[d.component] = (byComponent[d.component] || 0) + 1;
    start = Math.min(start, d.timestamp);
    end = Math.max(end, d.timestamp);
  });

  // Calculate sampling stats
  for (const state of componentDiagnosticStates.values()) {
    totalRenderAttempts += state.sampleCount;
  }

  const renderLogsSampled = byPhase['render'] || 0;

  return {
    buffer: [...globalDiagnosticBuffer],
    componentStates: Object.fromEntries(
      Array.from(componentDiagnosticStates.entries()).map(([name, state]) => [
        name,
        {
          lastFlush: state.lastFlush,
          pendingCount: state.pendingDiagnostics.size,
          sampleCount: state.sampleCount,
        }
      ])
    ),
    summary: {
      totalEvents: globalDiagnosticBuffer.length,
      byPhase,
      byLevel,
      byComponent,
      timeRange: { start: start === Infinity ? 0 : start, end },
      samplingStats: {
        renderLogsSampled,
        totalRenderAttempts,
        samplingRate: SAMPLE_RATE,
      }
    }
  };
}

/**
 * PHASE 4: Clear diagnostic buffers and component states
 */
export function clearDiagnostics(): void {
  globalDiagnosticBuffer.length = 0;
  componentDiagnosticStates.clear();
}

/**
 * Hook for components to easily log diagnostics
 */
export function useToolbarDiagnostics(componentName: string) {
  return {
    log: (phase: ToolbarDiagnostic['phase'], data: Record<string, any>, level?: ToolbarDiagnostic['level']) =>
      logToolbarDiagnostic(phase, componentName, data, level),
    
    logClick: (data: Record<string, any>) => 
      logToolbarDiagnostic('click', componentName, data),
    
    logSelection: (data: Record<string, any>) => 
      logToolbarDiagnostic('selection', componentName, data),
    
    logAnchor: (data: Record<string, any>) => 
      logToolbarDiagnostic('anchor', componentName, data),
    
    logRender: (data: Record<string, any>) => 
      logToolbarDiagnostic('render', componentName, data),
    
    logPriority: (data: Record<string, any>) => 
      logToolbarDiagnostic('priority', componentName, data),
  };
}
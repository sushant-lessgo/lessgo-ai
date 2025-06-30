/**
 * Toolbar position
 */
export interface ToolbarPosition {
  /** X coordinate */
  x: number;
  
  /** Y coordinate */
  y: number;
  
  /** Positioning strategy */
  strategy: 'absolute' | 'fixed' | 'relative';
  
  /** Anchor point */
  anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  
  /** Offset from anchor */
  offset: { x: number; y: number };
  
  /** Bounds checking */
  bounds?: PositionBounds;
}

/**
 * Position bounds for toolbar placement
 */
export interface PositionBounds {
  /** Minimum X */
  minX: number;
  
  /** Maximum X */
  maxX: number;
  
  /** Minimum Y */
  minY: number;
  
  /** Maximum Y */
  maxY: number;
}

/**
 * Toolbar types
 */
export type ToolbarType = 
  | 'section'       // Section-level toolbar
  | 'element'       // Element-level toolbar
  | 'text'          // Text formatting toolbar
  | 'image'         // Image editing toolbar
  | 'form'          // Form editing toolbar
  | 'ai'            // AI generation toolbar
  | 'context'       // Context-sensitive toolbar
  | 'floating'      // General floating toolbar
  | 'inline';       // Inline editing toolbar

/**
 * Toolbar action
 */
export interface ToolbarAction {
  /** Action ID */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action icon */
  icon?: string;
  
  /** Action type */
  type: ToolbarActionType;
  
  /** Action handler */
  handler: string;
  
  /** Action parameters */
  parameters?: Record<string, any>;
  
  /** Action state */
  state: ActionState;
  
  /** Action shortcuts */
  shortcuts?: KeyboardShortcut[];
  
  /** Action group */
  group?: string;
  
  /** Action priority */
  priority: number;
}

/**
 * Toolbar action types
 */
export type ToolbarActionType = 
  | 'button'        // Simple button
  | 'toggle'        // Toggle button
  | 'dropdown'      // Dropdown menu
  | 'color-picker'  // Color selection
  | 'slider'        // Value slider
  | 'text-input'    // Text input field
  | 'separator'     // Visual separator
  | 'group';        // Action group

/**
 * Action state
 */
export interface ActionState {
  /** Is action enabled */
  enabled: boolean;
  
  /** Is action active/pressed */
  active: boolean;
  
  /** Is action loading */
  loading: boolean;
  
  /** Action visibility */
  visible: boolean;
  
  /** Current value (for inputs) */
  value?: any;
  
  /** Action badge/count */
  badge?: string | number;
  
  /** Action tooltip */
  tooltip?: string;
}

/**
 * Keyboard shortcut
 */
export interface KeyboardShortcut {
  /** Key combination */
  keys: string[];
  
  /** Platform-specific keys */
  platform?: PlatformShortcuts;
  
  /** Shortcut description */
  description: string;
  
  /** Shortcut scope */
  scope: 'global' | 'mode' | 'selection' | 'context';
}

/**
 * Platform-specific shortcuts
 */
export interface PlatformShortcuts {
  /** Windows shortcuts */
  windows?: string[];
  
  /** macOS shortcuts */
  mac?: string[];
  
  /** Linux shortcuts */
  linux?: string[];
}

/**
 * Toolbar configuration
 */
export interface ToolbarConfig {
  /** Auto-hide toolbar */
  autoHide: boolean;
  
  /** Hide delay (ms) */
  hideDelay: number;
  
  /** Show animation */
  showAnimation: 'fade' | 'slide' | 'scale' | 'none';
  
  /** Hide animation */
  hideAnimation: 'fade' | 'slide' | 'scale' | 'none';
  
  /** Animation duration (ms) */
  animationDuration: number;
  
  /** Toolbar theme */
  theme: 'light' | 'dark' | 'auto';
  
  /** Compact mode */
  compact: boolean;
  
  /** Sticky behavior */
  sticky: boolean;
}

/**
 * Toolbar state data
 */
export interface ToolbarStateData {
  /** Is toolbar docked */
  isDocked: boolean;
  
  /** Dock position */
  dockPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  /** Is toolbar expanded */
  isExpanded: boolean;
  
  /** Active tool */
  activeTool?: string;
  
  /** Tool history */
  toolHistory: string[];
  
  /** Custom state data */
  customData?: Record<string, any>;
}

/**
 * ===== PANEL SYSTEM =====
 */

/**
 * Panel configuration
 */
export interface PanelState {
  /** Panel ID */
  id: string;
  
  /** Panel type */
  type: PanelType;
  
  /** Panel visibility */
  isVisible: boolean;
  
  /** Panel position */
  position: PanelPosition;
  
  /** Panel size */
  size: PanelSize;
  
  /** Panel content */
  content: PanelContent;
  
  /** Panel behavior */
  behavior: PanelBehavior;
  
  /** Panel state */
  state: PanelStateData;
}

/**
 * Panel types
 */
export type PanelType = 
  | 'left'          // Left sidebar panel
  | 'right'         // Right sidebar panel
  | 'bottom'        // Bottom panel
  | 'floating'      // Floating panel
  | 'modal'         // Modal panel
  | 'drawer'        // Slide-out drawer
  | 'popover'       // Small popover panel
  | 'tooltip';      // Tooltip panel

/**
 * Panel position
 */
export interface PanelPosition {
  /** Side of screen */
  side: 'left' | 'right' | 'top' | 'bottom' | 'center';
  
  /** Position within side */
  alignment: 'start' | 'center' | 'end' | 'stretch';
  
  /** Distance from edge */
  offset: number;
  
  /** Z-index layer */
  zIndex: number;
  
  /** Floating position */
  floating?: { x: number; y: number };
}

/**
 * Panel size
 */
export interface PanelSize {
  /** Panel width */
  width: PanelDimension;
  
  /** Panel height */
  height: PanelDimension;
  
  /** Minimum size */
  minSize?: { width: number; height: number };
  
  /** Maximum size */
  maxSize?: { width: number; height: number };
  
  /** Is resizable */
  resizable: boolean;
  
  /** Resize handles */
  resizeHandles?: ResizeHandle[];
}

/**
 * Panel dimension
 */
export interface PanelDimension {
  /** Dimension value */
  value: number;
  
  /** Dimension unit */
  unit: 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw' | 'auto';
  
  /** Responsive values */
  responsive?: ResponsiveDimension[];
}

/**
 * Responsive dimension
 */
export interface ResponsiveDimension {
  /** Breakpoint */
  breakpoint: string;
  
  /** Value at breakpoint */
  value: number;
  
  /** Unit at breakpoint */
  unit: string;
}

/**
 * Resize handle
 */
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Panel content configuration
 */
export interface PanelContent {
  /** Content type */
  type: PanelContentType;
  
  /** Content component */
  component?: string;
  
  /** Content props */
  props?: Record<string, any>;
  
  /** Content tabs */
  tabs?: PanelTab[];
  
  /** Active tab */
  activeTab?: string;
  
  /** Content header */
  header?: PanelHeader;
  
  /** Content footer */
  footer?: PanelFooter;
}

/**
 * Panel content types
 */
export type PanelContentType = 
  | 'sections'      // Section management
  | 'properties'    // Property editor
  | 'layers'        // Layer tree
  | 'assets'        // Asset browser
  | 'forms'         // Form builder
  | 'ai'            // AI controls
  | 'settings'      // Settings panel
  | 'history'       // Undo/redo history
  | 'comments'      // Comments and feedback
  | 'help'          // Help and documentation
  | 'custom';       // Custom content

/**
 * Panel tab
 */
export interface PanelTab {
  /** Tab ID */
  id: string;
  
  /** Tab label */
  label: string;
  
  /** Tab icon */
  icon?: string;
  
  /** Tab content */
  content: PanelContent;
  
  /** Tab state */
  state: TabState;
  
  /** Tab badge */
  badge?: string | number;
  
  /** Tab shortcuts */
  shortcuts?: KeyboardShortcut[];
}

/**
 * Tab state
 */
export interface TabState {
  /** Is tab active */
  active: boolean;
  
  /** Is tab enabled */
  enabled: boolean;
  
  /** Is tab loading */
  loading: boolean;
  
  /** Has unsaved changes */
  hasChanges: boolean;
  
  /** Tab notification count */
  notifications?: number;
}

/**
 * Panel header
 */
export interface PanelHeader {
  /** Header title */
  title: string;
  
  /** Header subtitle */
  subtitle?: string;
  
  /** Header icon */
  icon?: string;
  
  /** Header actions */
  actions?: ToolbarAction[];
  
  /** Header search */
  search?: SearchConfig;
  
  /** Header filters */
  filters?: FilterConfig[];
}

/**
 * Panel footer
 */
export interface PanelFooter {
  /** Footer content */
  content?: string;
  
  /** Footer actions */
  actions?: ToolbarAction[];
  
  /** Footer status */
  status?: StatusIndicator;
}

/**
 * Panel behavior
 */
export interface PanelBehavior {
  /** Can panel be closed */
  closable: boolean;
  
  /** Can panel be minimized */
  minimizable: boolean;
  
  /** Can panel be maximized */
  maximizable: boolean;
  
  /** Can panel be moved */
  draggable: boolean;
  
  /** Auto-collapse behavior */
  autoCollapse?: AutoCollapseConfig;
  
  /** Panel persistence */
  persistent: boolean;
  
  /** Panel modal behavior */
  modal?: boolean;
  
  /** Panel escape handling */
  escapeClose?: boolean;
}

/**
 * Auto-collapse configuration
 */
export interface AutoCollapseConfig {
  /** Enable auto-collapse */
  enabled: boolean;
  
  /** Collapse trigger */
  trigger: 'idle' | 'focus-lost' | 'resize' | 'custom';
  
  /** Collapse delay (ms) */
  delay: number;
  
  /** Exceptions */
  exceptions?: string[];
}

/**
 * Panel state data
 */
export interface PanelStateData {
  /** Is panel collapsed */
  isCollapsed: boolean;
  
  /** Is panel minimized */
  isMinimized: boolean;
  
  /** Is panel maximized */
  isMaximized: boolean;
  
  /** Is panel docked */
  isDocked: boolean;
  
  /** Panel focus state */
  hasFocus: boolean;
  
  /** Panel scroll position */
  scrollPosition?: { x: number; y: number };
  
  /** Custom state data */
  customData?: Record<string, any>;
}

/**
 * ===== NAVIGATION SYSTEM =====
 */

/**
 * Navigation state
 */
export interface NavigationState {
  /** Current route */
  currentRoute: RouteInfo;
  
  /** Navigation history */
  history: NavigationHistory;
  
  /** Breadcrumb navigation */
  breadcrumbs: BreadcrumbItem[];
  
  /** Navigation menu state */
  menuState: MenuState;
  
  /** Navigation preferences */
  preferences: NavigationPreferences;
}

/**
 * Route information
 */
export interface RouteInfo {
  /** Route path */
  path: string;
  
  /** Route parameters */
  params: Record<string, string>;
  
  /** Query parameters */
  query: Record<string, string>;
  
  /** Route metadata */
  metadata: RouteMetadata;
}

/**
 * Route metadata
 */
export interface RouteMetadata {
  /** Route title */
  title: string;
  
  /** Route description */
  description?: string;
  
  /** Route icon */
  icon?: string;
  
  /** Route permissions */
  permissions?: string[];
  
  /** Route analytics */
  analytics?: RouteAnalytics;
}

/**
 * Route analytics
 */
export interface RouteAnalytics {
  /** Page views */
  views: number;
  
  /** Average time on page */
  avgTimeOnPage: number;
  
  /** Bounce rate */
  bounceRate: number;
  
  /** Entry rate */
  entryRate: number;
  
  /** Exit rate */
  exitRate: number;
}

/**
 * Navigation history
 */
export interface NavigationHistory {
  /** History entries */
  entries: HistoryEntry[];
  
  /** Current index */
  currentIndex: number;
  
  /** Can go back */
  canGoBack: boolean;
  
  /** Can go forward */
  canGoForward: boolean;
  
  /** History limit */
  limit: number;
}

/**
 * History entry
 */
export interface HistoryEntry {
  /** Entry route */
  route: RouteInfo;
  
  /** Entry timestamp */
  timestamp: Date;
  
  /** Entry state */
  state?: Record<string, any>;
  
  /** Entry title */
  title: string;
  
  /** Entry type */
  type: 'push' | 'replace' | 'pop';
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Item ID */
  id: string;
  
  /** Item label */
  label: string;
  
  /** Item route */
  route?: string;
  
  /** Item icon */
  icon?: string;
  
  /** Is item active */
  active: boolean;
  
  /** Is item clickable */
  clickable: boolean;
  
  /** Item metadata */
  metadata?: Record<string, any>;
}

/**
 * Menu state
 */
export interface MenuState {
  /** Is menu open */
  isOpen: boolean;
  
  /** Active menu item */
  activeItem?: string;
  
  /** Menu items */
  items: MenuItem[];
  
  /** Menu configuration */
  config: MenuConfig;
}

/**
 * Menu item
 */
export interface MenuItem {
  /** Item ID */
  id: string;
  
  /** Item label */
  label: string;
  
  /** Item icon */
  icon?: string;
  
  /** Item route */
  route?: string;
  
  /** Item action */
  action?: string;
  
  /** Item children */
  children?: MenuItem[];
  
  /** Item state */
  state: MenuItemState;
  
  /** Item metadata */
  metadata?: Record<string, any>;
}

/**
 * Menu item state
 */
export interface MenuItemState {
  /** Is item active */
  active: boolean;
  
  /** Is item enabled */
  enabled: boolean;
  
  /** Is item expanded */
  expanded: boolean;
  
  /** Is item loading */
  loading: boolean;
  
  /** Item badge */
  badge?: string | number;
  
  /** Item notifications */
  notifications?: number;
}

/**
 * Menu configuration
 */
export interface MenuConfig {
  /** Menu type */
  type: 'horizontal' | 'vertical' | 'dropdown' | 'context';
  
  /** Menu theme */
  theme: 'light' | 'dark' | 'auto';
  
  /** Menu size */
  size: 'small' | 'medium' | 'large';
  
  /** Menu behavior */
  behavior: MenuBehavior;
}

/**
 * Menu behavior
 */
export interface MenuBehavior {
  /** Auto-close on selection */
  autoClose: boolean;
  
  /** Close on outside click */
  closeOnOutsideClick: boolean;
  
  /** Keyboard navigation */
  keyboardNavigation: boolean;
  
  /** Menu animations */
  animations: boolean;
  
  /** Multi-level expansion */
  multiLevel: boolean;
}

/**
 * Navigation preferences
 */
export interface NavigationPreferences {
  /** Preferred navigation style */
  style: 'tabs' | 'breadcrumbs' | 'tree' | 'list';
  
  /** Show navigation labels */
  showLabels: boolean;
  
  /** Show navigation icons */
  showIcons: boolean;
  
  /** Navigation position */
  position: 'top' | 'left' | 'right' | 'bottom';
  
  /** Compact navigation */
  compact: boolean;
  
  /** Auto-hide navigation */
  autoHide: boolean;
}

/**
 * ===== SEARCH AND FILTER SYSTEM =====
 */

/**
 * Search configuration
 */
export interface SearchConfig {
  /** Search enabled */
  enabled: boolean;
  
  /** Search placeholder */
  placeholder: string;
  
  /** Search type */
  type: SearchType;
  
  /** Search scope */
  scope: string[];
  
  /** Search filters */
  filters?: FilterConfig[];
  
  /** Search suggestions */
  suggestions?: SuggestionConfig;
  
  /** Search behavior */
  behavior: SearchBehavior;
}

/**
 * Search types
 */
export type SearchType = 
  | 'text'          // Text search
  | 'fuzzy'         // Fuzzy search
  | 'semantic'      // Semantic search
  | 'visual'        // Visual search
  | 'ai'            // AI-powered search
  | 'advanced';     // Advanced search with filters

/**
 * Filter configuration
 */
export interface FilterConfig {
  /** Filter ID */
  id: string;
  
  /** Filter label */
  label: string;
  
  /** Filter type */
  type: FilterType;
  
  /** Filter options */
  options?: FilterOption[];
  
  /** Filter value */
  value?: any;
  
  /** Filter state */
  state: FilterState;
}

/**
 * Filter types
 */
export type FilterType = 
  | 'select'        // Single selection
  | 'multiselect'   // Multiple selection
  | 'range'         // Range filter
  | 'date'          // Date filter
  | 'boolean'       // Boolean filter
  | 'text'          // Text filter
  | 'color'         // Color filter
  | 'tag';          // Tag filter

/**
 * Filter option
 */
export interface FilterOption {
  /** Option value */
  value: any;
  
  /** Option label */
  label: string;
  
  /** Option count */
  count?: number;
  
  /** Option icon */
  icon?: string;
  
  /** Option group */
  group?: string;
  
  /** Option metadata */
  metadata?: Record<string, any>;
}

/**
 * Filter state
 */
export interface FilterState {
  /** Is filter active */
  active: boolean;
  
  /** Is filter enabled */
  enabled: boolean;
  
  /** Filter has value */
  hasValue: boolean;
  
  /** Filter is loading */
  loading: boolean;
  
  /** Filter error */
  error?: string;
}

/**
 * Suggestion configuration
 */
export interface SuggestionConfig {
  /** Enable suggestions */
  enabled: boolean;
  
  /** Suggestion sources */
  sources: SuggestionSource[];
  
  /** Maximum suggestions */
  maxSuggestions: number;
  
  /** Suggestion delay (ms) */
  delay: number;
  
  /** Suggestion behavior */
  behavior: SuggestionBehavior;
}

/**
 * Suggestion source
 */
export interface SuggestionSource {
  /** Source type */
  type: 'history' | 'popular' | 'ai' | 'static' | 'api';
  
  /** Source configuration */
  config: Record<string, any>;
  
  /** Source priority */
  priority: number;
  
  /** Source enabled */
  enabled: boolean;
}

/**
 * Suggestion behavior
 */
export interface SuggestionBehavior {
  /** Auto-complete */
  autoComplete: boolean;
  
  /** Highlight matches */
  highlightMatches: boolean;
  
  /** Group suggestions */
  groupSuggestions: boolean;
  
  /** Show suggestion icons */
  showIcons: boolean;
  
  /** Keyboard navigation */
  keyboardNavigation: boolean;
}

/**
 * Search behavior
 */
export interface SearchBehavior {
  /** Search as you type */
  instantSearch: boolean;
  
  /** Search delay (ms) */
  searchDelay: number;
  
  /** Minimum search length */
  minLength: number;
  
  /** Clear on escape */
  clearOnEscape: boolean;
  
  /** Focus on slash */
  focusOnSlash: boolean;
  
  /** Search history */
  saveHistory: boolean;
}

/**
 * ===== STATUS AND INDICATORS =====
 */

/**
 * Status indicator
 */
export interface StatusIndicator {
  /** Status type */
  type: StatusType;
  
  /** Status message */
  message: string;
  
  /** Status icon */
  icon?: string;
  
  /** Status color */
  color?: string;
  
  /** Status progress */
  progress?: number;
  
  /** Status actions */
  actions?: StatusAction[];
  
  /** Status timestamp */
  timestamp?: Date;
}

/**
 * Status types
 */
export type StatusType = 
  | 'success'       // Success state
  | 'error'         // Error state
  | 'warning'       // Warning state
  | 'info'          // Info state
  | 'loading'       // Loading state
  | 'processing'    // Processing state
  | 'idle'          // Idle state
  | 'offline'       // Offline state
  | 'syncing'       // Syncing state
  | 'saved';        // Saved state

/**
 * Status action
 */
export interface StatusAction {
  /** Action label */
  label: string;
  
  /** Action handler */
  handler: string;
  
  /** Action type */
  type: 'primary' | 'secondary' | 'danger';
  
  /** Action parameters */
  parameters?: Record<string, any>;
}

/**
 * ===== LOADING STATES =====
 */

/**
 * Loading state
 */
export interface LoadingState {
  /** Is loading */
  isLoading: boolean;
  
  /** Loading type */
  type: LoadingType;
  
  /** Loading message */
  message?: string;
  
  /** Loading progress */
  progress?: LoadingProgress;
  
  /** Loading overlay */
  overlay?: boolean;
  
  /** Loading animation */
  animation?: LoadingAnimation;
}

/**
 * Loading types
 */
export type LoadingType = 
  | 'page'          // Full page loading
  | 'section'       // Section loading
  | 'component'     // Component loading
  | 'inline'        // Inline loading
  | 'overlay'       // Overlay loading
  | 'skeleton'      // Skeleton loading
  | 'spinner'       // Spinner loading
  | 'progress';     // Progress bar loading

/**
 * Loading progress
 */
export interface LoadingProgress {
  /** Current progress (0-100) */
  current: number;
  
  /** Total items */
  total?: number;
  
  /** Completed items */
  completed?: number;
  
  /** Progress stages */
  stages?: ProgressStage[];
  
  /** Current stage */
  currentStage?: number;
  
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
}

/**
 * Progress stage
 */
export interface ProgressStage {
  /** Stage ID */
  id: string;
  
  /** Stage label */
  label: string;
  
  /** Stage progress */
  progress: number;
  
  /** Stage status */
  status: 'pending' | 'active' | 'completed' | 'error';
  
  /** Stage duration */
  duration?: number;
}

/**
 * Loading animation
 */
export interface LoadingAnimation {
  /** Animation type */
  type: 'fade' | 'slide' | 'scale' | 'bounce' | 'pulse' | 'spin';
  
  /** Animation duration (ms) */
  duration: number;
  
  /** Animation easing */
  easing: string;
  
  /** Animation repeat */
  repeat: boolean;
}

/**
 * ===== TOAST NOTIFICATIONS =====
 */

/**
 * Toast notification
 */
export interface ToastNotification {
  /** Notification ID */
  id: string;
  
  /** Notification type */
  type: NotificationType;
  
  /** Notification title */
  title?: string;
  
  /** Notification message */
  message: string;
  
  /** Notification icon */
  icon?: string;
  
  /** Notification duration (ms) */
  duration?: number;
  
  /** Notification actions */
  actions?: NotificationAction[];
  
  /** Notification position */
  position?: NotificationPosition;
  
  /** Notification behavior */
  behavior?: NotificationBehavior;
}

/**
 * Notification types
 */
export type NotificationType = 
  | 'success'       // Success notification
  | 'error'         // Error notification
  | 'warning'       // Warning notification
  | 'info'          // Info notification
  | 'default';      // Default notification

/**
 * Notification action
 */
export interface NotificationAction {
  /** Action label */
  label: string;
  
  /** Action handler */
  handler: string;
  
  /** Action type */
  type: 'primary' | 'secondary' | 'danger';
  
  /** Action parameters */
  parameters?: Record<string, any>;
  
  /** Dismiss on action */
  dismissOnAction?: boolean;
}

/**
 * Notification position
 */
export type NotificationPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center';

/**
 * Notification behavior
 */
export interface NotificationBehavior {
  /** Auto-dismiss */
  autoDismiss: boolean;
  
  /** Dismiss on click */
  dismissOnClick: boolean;
  
  /** Pausable */
  pausable: boolean;
  
  /** Stack notifications */
  stackable: boolean;
  
  /** Maximum stack size */
  maxStack?: number;
  
  /** Animation */
  animation: NotificationAnimation;
}

/**
 * Notification animation
 */
export interface NotificationAnimation {
  /** Enter animation */
  enter: string;
  
  /** Exit animation */
  exit: string;
  
  /** Animation duration (ms) */
  duration: number;
}

/**
 * ===== RESPONSIVE BEHAVIOR =====
 */

/**
 * Responsive state
 */
export interface ResponsiveState {
  /** Current breakpoint */
  breakpoint: Breakpoint;
  
  /** Screen dimensions */
  screen: ScreenDimensions;
  
  /** Device information */
  device: DeviceInfo;
  
  /** Responsive configuration */
  config: ResponsiveConfig;
}

/**
 * Breakpoint information
 */
export interface Breakpoint {
  /** Breakpoint name */
  name: string;
  
  /** Breakpoint min width */
  minWidth: number;
  
  /** Breakpoint max width */
  maxWidth?: number;
  
  /** Breakpoint category */
  category: 'mobile' | 'tablet' | 'desktop' | 'large';
}

/**
 * Screen dimensions
 */
export interface ScreenDimensions {
  /** Screen width */
  width: number;
  
  /** Screen height */
  height: number;
  
  /** Available width */
  availableWidth: number;
  
  /** Available height */
  availableHeight: number;
  
  /** Device pixel ratio */
  pixelRatio: number;
  
  /** Orientation */
  orientation: 'portrait' | 'landscape';
}

/**
 * Device information
 */
export interface DeviceInfo {
  /** Device type */
  type: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'watch' | 'unknown';
  
  /** Operating system */
  os: string;
  
  /** Browser information */
  browser: BrowserInfo;
  
  /** Touch support */
  touchSupport: boolean;
  
  /** Hover support */
  hoverSupport: boolean;
  
  /** Pointer type */
  pointerType: 'mouse' | 'touch' | 'pen' | 'none';
}

/**
 * Browser information
 */
export interface BrowserInfo {
  /** Browser name */
  name: string;
  
  /** Browser version */
  version: string;
  
  /** Engine name */
  engine: string;
  
  /** Engine version */
  engineVersion: string;
  
  /** Supported features */
  features: BrowserFeatures;
}

/**
 * Browser features
 */
export interface BrowserFeatures {
  /** WebP support */
  webp: boolean;
  
  /** AVIF support */
  avif: boolean;
  
  /** CSS Grid support */
  cssGrid: boolean;
  
  /** CSS Flexbox support */
  flexbox: boolean;
  
  /** Service Worker support */
  serviceWorker: boolean;
  
  /** Local Storage support */
  localStorage: boolean;
  
  /** WebGL support */
  webgl: boolean;
}

/**
 * Responsive configuration
 */
export interface ResponsiveConfig {
  /** Breakpoint definitions */
  breakpoints: Record<string, number>;
  
  /** Default breakpoint */
  defaultBreakpoint: string;
  
  /** Responsive behavior */
  behavior: ResponsiveBehavior;
  
  /** Adaptive loading */
  adaptiveLoading: boolean;
}

/**
 * Responsive behavior
 */
export interface ResponsiveBehavior {
  /** Auto-adapt layout */
  autoAdapt: boolean;
  
  /** Touch optimization */
  touchOptimization: boolean;
  
  /** Mobile-first design */
  mobileFirst: boolean;
  
  /** Progressive enhancement */
  progressiveEnhancement: boolean;
  
  /** Responsive images */
  responsiveImages: boolean;
  
  /** Adaptive typography */
  adaptiveTypography: boolean;
}

/**
 * ===== DRAG AND DROP SYSTEM =====
 */

/**
 * Drag and drop state
 */
export interface DragDropState {
  /** Is dragging active */
  isDragging: boolean;
  
  /** Drag source */
  source?: DragSource;
  
  /** Drop target */
  target?: DropTarget;
  
  /** Drag data */
  data?: DragData;
  
  /** Drag preview */
  preview?: DragPreview;
  
  /** Drop zones */
  dropZones: DropZone[];
  
  /** Drag configuration */
  config: DragDropConfig;
}

/**
 * Drag source
 */
export interface DragSource {
  /** Source ID */
  id: string;
  
  /** Source type */
  type: DragSourceType;
  
  /** Source element */
  element: string;
  
  /** Source data */
  data: any;
  
  /** Source position */
  position: { x: number; y: number };
  
  /** Source constraints */
  constraints?: DragConstraints;
}

/**
 * Drag source types
 */
export type DragSourceType = 
  | 'section'       // Section element
  | 'element'       // Content element
  | 'form-field'    // Form field
  | 'image'         // Image
  | 'component'     // Component from palette
  | 'file'          // File from system
  | 'text'          // Text content
  | 'custom';       // Custom drag type

/**
 * Drop target
 */
export interface DropTarget {
  /** Target ID */
  id: string;
  
  /** Target type */
  type: DropTargetType;
  
  /** Target element */
  element: string;
  
  /** Drop position */
  position: DropPosition;
  
  /** Target constraints */
  constraints?: DropConstraints;
  
  /** Visual feedback */
  feedback?: DropFeedback;
}

/**
 * Drop target types
 */
export type DropTargetType = 
  | 'container'     // Container element
  | 'section'       // Section
  | 'form'          // Form
  | 'gallery'       // Image gallery
  | 'trash'         // Delete target
  | 'canvas'        // Design canvas
  | 'library'       // Asset library
  | 'custom';       // Custom drop type

/**
 * Drop position
 */
export interface DropPosition {
  /** Position type */
  type: 'before' | 'after' | 'inside' | 'replace';
  
  /** Relative to element */
  relativeTo?: string;
  
  /** Insertion index */
  index?: number;
  
  /** Position coordinates */
  coordinates: { x: number; y: number };
}

/**
 * Drag data
 */
export interface DragData {
  /** Data type */
  type: string;
  
  /** Data payload */
  payload: any;
  
  /** Data format */
  format: 'json' | 'text' | 'html' | 'binary';
  
  /** Data size */
  size?: number;
  
  /** Data metadata */
  metadata?: Record<string, any>;
}

/**
 * Drag preview
 */
export interface DragPreview {
  /** Preview type */
  type: 'element' | 'image' | 'custom';
  
  /** Preview content */
  content: string | HTMLElement;
  
  /** Preview size */
  size: { width: number; height: number };
  
  /** Preview offset */
  offset: { x: number; y: number };
  
  /** Preview opacity */
  opacity: number;
}

/**
 * Drop zone
 */
export interface DropZone {
  /** Zone ID */
  id: string;
  
  /** Zone element */
  element: string;
  
  /** Zone bounds */
  bounds: DOMRect;
  
  /** Accepted types */
  acceptedTypes: string[];
  
  /** Zone state */
  state: DropZoneState;
  
  /** Zone configuration */
  config: DropZoneConfig;
}

/**
 * Drop zone state
 */
export interface DropZoneState {
  /** Is zone active */
  active: boolean;
  
  /** Is zone hovered */
  hovered: boolean;
  
  /** Is zone valid drop target */
  valid: boolean;
  
  /** Zone highlight level */
  highlight: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Drop zone configuration
 */
export interface DropZoneConfig {
  /** Visual feedback */
  feedback: boolean;
  
  /** Feedback animation */
  animation: 'pulse' | 'glow' | 'border' | 'fill';
  
  /** Snap to grid */
  snapToGrid: boolean;
  
  /** Grid size */
  gridSize?: number;
  
  /** Auto-scroll */
  autoScroll: boolean;
}

/**
 * Drag constraints
 */
export interface DragConstraints {
  /** Allowed axes */
  axis?: 'x' | 'y' | 'both';
  
  /** Containment bounds */
  containment?: DOMRect;
  
  /** Minimum distance */
  minDistance?: number;
  
  /** Maximum distance */
  maxDistance?: number;
  
  /** Snap targets */
  snapTargets?: SnapTarget[];
}

/**
 * Drop constraints
 */
export interface DropConstraints {
  /** Accepted types */
  acceptedTypes: string[];
  
  /** Rejected types */
  rejectedTypes?: string[];
  
  /** Maximum items */
  maxItems?: number;
  
  /** Validation rules */
  validation?: ValidationRule[];
}

/**
 * Snap target
 */
export interface SnapTarget {
  /** Target element */
  element: string;
  
  /** Snap distance */
  distance: number;
  
  /** Snap strength */
  strength: number;
  
  /** Snap axes */
  axes: ('x' | 'y')[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule type */
  type: string;
  
  /** Rule condition */
  condition: string;
  
  /** Rule message */
  message: string;
  
  /** Rule severity */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Drop feedback
 */
export interface DropFeedback {
  /** Feedback type */
  type: 'visual' | 'audio' | 'haptic';
  
  /** Feedback intensity */
  intensity: 'low' | 'medium' | 'high';
  
  /** Feedback duration */
  duration: number;
  
  /** Feedback delay */
  delay?: number;
}

/**
 * Drag and drop configuration
 */
export interface DragDropConfig {
  /** Enable drag and drop */
  enabled: boolean;
  
  /** Touch support */
  touchSupport: boolean;
  
  /** Auto-scroll */
  autoScroll: boolean;
  
  /** Scroll speed */
  scrollSpeed: number;
  
  /** Scroll threshold */
  scrollThreshold: number;
  
  /** Default preview */
  defaultPreview: 'element' | 'ghost' | 'none';
  
  /** Animation duration */
  animationDuration: number;
}

/**
 * ===== KEYBOARD SHORTCUTS =====
 */

/**
 * Keyboard shortcut registry
 */
export interface ShortcutRegistry {
  /** Global shortcuts */
  global: Record<string, ShortcutDefinition>;
  
  /** Mode-specific shortcuts */
  modes: Record<string, Record<string, ShortcutDefinition>>;
  
  /** Context-specific shortcuts */
  contexts: Record<string, Record<string, ShortcutDefinition>>;
  
  /** User-defined shortcuts */
  custom: Record<string, ShortcutDefinition>;
  
  /** Shortcut configuration */
  config: ShortcutConfig;
}

/**
 * Shortcut definition
 */
export interface ShortcutDefinition {
  /** Shortcut keys */
  keys: string[];
  
  /** Platform-specific keys */
  platform?: PlatformShortcuts;
  
  /** Shortcut description */
  description: string;
  
  /** Shortcut category */
  category: string;
  
  /** Shortcut action */
  action: string;
  
  /** Action parameters */
  parameters?: Record<string, any>;
  
  /** Shortcut scope */
  scope: ShortcutScope;
  
  /** Shortcut state */
  state: ShortcutState;
}

/**
 * Shortcut scope
 */
export interface ShortcutScope {
  /** Scope type */
  type: 'global' | 'mode' | 'context' | 'element';
  
  /** Scope conditions */
  conditions?: ScopeCondition[];
  
  /** Scope priority */
  priority: number;
  
  /** Scope exclusions */
  exclusions?: string[];
}

/**
 * Scope condition
 */
export interface ScopeCondition {
  /** Condition type */
  type: 'mode' | 'selection' | 'focus' | 'state' | 'custom';
  
  /** Condition value */
  value: any;
  
  /** Condition operator */
  operator: 'equals' | 'not-equals' | 'contains' | 'matches';
}

/**
 * Shortcut state
 */
export interface ShortcutState {
  /** Is shortcut enabled */
  enabled: boolean;
  
  /** Is shortcut active */
  active: boolean;
  
  /** Shortcut conflicts */
  conflicts?: string[];
  
  /** Last used timestamp */
  lastUsed?: Date;
  
  /** Usage count */
  usageCount: number;
}

/**
 * Shortcut configuration
 */
export interface ShortcutConfig {
  /** Enable shortcuts */
  enabled: boolean;
  
  /** Show shortcuts in UI */
  showInUI: boolean;
  
  /** Shortcut hints */
  showHints: boolean;
  
  /** Conflict resolution */
  conflictResolution: 'priority' | 'context' | 'user-choice';
  
  /** Custom shortcuts allowed */
  allowCustom: boolean;
  
  /** Platform detection */
  platformDetection: boolean;
}

/**
 * ===== THEME AND APPEARANCE =====
 */

/**
 * UI theme state
 */
export interface UIThemeState {
  /** Current theme */
  currentTheme: string;
  
  /** Available themes */
  availableThemes: UITheme[];
  
  /** Theme preferences */
  preferences: ThemePreferences;
  
  /** Custom themes */
  customThemes: UITheme[];
  
  /** Theme configuration */
  config: ThemeConfig;
}

/**
 * UI theme
 */
export interface UITheme {
  /** Theme ID */
  id: string;
  
  /** Theme name */
  name: string;
  
  /** Theme description */
  description?: string;
  
  /** Theme type */
  type: 'light' | 'dark' | 'auto' | 'high-contrast' | 'custom';
  
  /** Theme colors */
  colors: UIColors;
  
  /** Theme typography */
  typography: UITypography;
  
  /** Theme spacing */
  spacing: UISpacing;
  
  /** Theme shadows */
  shadows: UIShadows;
  
  /** Theme animations */
  animations: UIAnimations;
  
  /** Theme metadata */
  metadata: ThemeMetadata;
}

/**
 * UI colors
 */
export interface UIColors {
  /** Primary colors */
  primary: ColorScale;
  
  /** Secondary colors */
  secondary: ColorScale;
  
  /** Background colors */
  background: BackgroundColors;
  
  /** Text colors */
  text: TextColors;
  
  /** Border colors */
  border: BorderColors;
  
  /** State colors */
  state: StateColors;
  
  /** Semantic colors */
  semantic: SemanticColors;
}

/**
 * Color scale
 */
export interface ColorScale {
  /** Base color */
  base: string;
  
  /** Color variations */
  variations: Record<string, string>;
  
  /** Color opacity variants */
  opacity: Record<string, string>;
}

/**
 * Background colors
 */
export interface BackgroundColors {
  /** Primary background */
  primary: string;
  
  /** Secondary background */
  secondary: string;
  
  /** Surface background */
  surface: string;
  
  /** Elevated surface */
  elevated: string;
  
  /** Overlay background */
  overlay: string;
}

/**
 * Text colors
 */
export interface TextColors {
  /** Primary text */
  primary: string;
  
  /** Secondary text */
  secondary: string;
  
  /** Muted text */
  muted: string;
  
  /** Inverse text */
  inverse: string;
  
  /** Link text */
  link: string;
}

/**
 * Border colors
 */
export interface BorderColors {
  /** Default border */
  default: string;
  
  /** Subtle border */
  subtle: string;
  
  /** Focus border */
  focus: string;
  
  /** Hover border */
  hover: string;
  
  /** Active border */
  active: string;
}

/**
 * UI typography
 */
export interface UITypography {
  /** Font families */
  fontFamilies: FontFamilies;
  
  /** Font sizes */
  fontSizes: FontSizes;
  
  /** Font weights */
  fontWeights: FontWeights;
  
  /** Line heights */
  lineHeights: LineHeights;
  
  /** Letter spacing */
  letterSpacing: LetterSpacing;
}

/**
 * Font families
 */
export interface FontFamilies {
  /** UI font */
  ui: string;
  
  /** Heading font */
  heading: string;
  
  /** Body font */
  body: string;
  
  /** Monospace font */
  mono: string;
}

/**
 * Font sizes
 */
export interface FontSizes {
  /** Extra small */
  xs: string;
  
  /** Small */
  sm: string;
  
  /** Medium */
  md: string;
  
  /** Large */
  lg: string;
  
  /** Extra large */
  xl: string;
  
  /** 2X large */
  '2xl': string;
  
  /** 3X large */
  '3xl': string;
}

/**
 * Line heights
 */
export interface LineHeights {
  /** Tight line height */
  tight: string;
  
  /** Normal line height */
  normal: string;
  
  /** Relaxed line height */
  relaxed: string;
  
  /** Loose line height */
  loose: string;
}

/**
 * Letter spacing
 */
export interface LetterSpacing {
  /** Tight letter spacing */
  tight: string;
  
  /** Normal letter spacing */
  normal: string;
  
  /** Wide letter spacing */
  wide: string;
}

/**
 * UI spacing
 */
export interface UISpacing {
  /** Spacing scale */
  scale: Record<string, string>;
  
  /** Component spacing */
  components: ComponentSpacing;
  
  /** Layout spacing */
  layout: LayoutSpacing;
}

/**
 * Component spacing
 */
export interface ComponentSpacing {
  /** Button spacing */
  button: string;
  
  /** Input spacing */
  input: string;
  
  /** Card spacing */
  card: string;
  
  /** Panel spacing */
  panel: string;
  
  /** Toolbar spacing */
  toolbar: string;
}

/**
 * Layout spacing
 */
export interface LayoutSpacing {
  /** Section spacing */
  section: string;
  
  /** Container spacing */
  container: string;
  
  /** Grid spacing */
  grid: string;
  
  /** Stack spacing */
  stack: string;
}

/**
 * UI shadows
 */
export interface UIShadows {
  /** Small shadow */
  sm: string;
  
  /** Medium shadow */
  md: string;
  
  /** Large shadow */
  lg: string;
  
  /** Extra large shadow */
  xl: string;
  
  /** Inner shadow */
  inner: string;
  
  /** No shadow */
  none: string;
}

/**
 * UI animations
 */
export interface UIAnimations {
  /** Animation durations */
  durations: AnimationDurations;
  
  /** Animation easings */
  easings: AnimationEasings;
  
  /** Transition effects */
  transitions: TransitionEffects;
}

/**
 * Animation durations
 */
export interface AnimationDurations {
  /** Instant */
  instant: string;
  
  /** Fast */
  fast: string;
  
  /** Normal */
  normal: string;
  
  /** Slow */
  slow: string;
}

/**
 * Animation easings
 */
export interface AnimationEasings {
  /** Linear easing */
  linear: string;
  
  /** Ease in */
  easeIn: string;
  
  /** Ease out */
  easeOut: string;
  
  /** Ease in out */
  easeInOut: string;
  
  /** Bounce */
  bounce: string;
}

/**
 * Transition effects
 */
export interface TransitionEffects {
  /** Fade transition */
  fade: string;
  
  /** Slide transition */
  slide: string;
  
  /** Scale transition */
  scale: string;
  
  /** Rotate transition */
  rotate: string;
}

/**
 * Theme metadata
 */
export interface ThemeMetadata {
  /** Theme author */
  author?: string;
  
  /** Theme version */
  version: string;
  
  /** Creation date */
  createdAt: Date;
  
  /** Update date */
  updatedAt: Date;
  
  /** Theme tags */
  tags: string[];
  
  /** Theme preview */
  preview?: string;
}

/**
 * Theme preferences
 */
export interface ThemePreferences {
  /** Auto theme switching */
  autoSwitch: boolean;
  
  /** Follow system theme */
  followSystem: boolean;
  
  /** Theme switching time */
  switchTime?: { light: string; dark: string };
  
  /** High contrast support */
  highContrast: boolean;
  
  /** Reduced motion */
  reducedMotion: boolean;
  
  /** Custom CSS variables */
  customVariables: Record<string, string>;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Enable theme switching */
  enableSwitching: boolean;
  
  /** Default theme */
  defaultTheme: string;
  
  /** Storage key */
  storageKey: string;
  
  /** CSS variables prefix */
  cssPrefix: string;
  
  /** Theme validation */
  validation: boolean;
}

/**
 * ===== ACCESSIBILITY =====
 */

/**
 * Accessibility state
 */
export interface AccessibilityState {
  /** Screen reader support */
  screenReader: ScreenReaderState;
  
  /** Keyboard navigation */
  keyboardNavigation: KeyboardNavigationState;
  
  /** Focus management */
  focusManagement: FocusManagementState;
  
  /** Color contrast */
  colorContrast: ColorContrastState;
  
  /** Motion preferences */
  motionPreferences: MotionPreferencesState;
  
  /** Accessibility configuration */
  config: AccessibilityConfig;
}

/**
 * Screen reader state
 */
export interface ScreenReaderState {
  /** Is screen reader detected */
  detected: boolean;
  
  /** Screen reader type */
  type?: string;
  
  /** Live region updates */
  liveRegions: LiveRegion[];
  
  /** Announcement queue */
  announcements: Announcement[];
}

/**
 * Live region
 */
export interface LiveRegion {
  /** Region ID */
  id: string;
  
  /** Region type */
  type: 'polite' | 'assertive' | 'off';
  
  /** Current content */
  content: string;
  
  /** Region element */
  element: string;
}

/**
 * Screen reader announcement
 */
export interface Announcement {
  /** Announcement ID */
  id: string;
  
  /** Announcement text */
  text: string;
  
  /** Announcement priority */
  priority: 'low' | 'medium' | 'high';
  
  /** Announcement timestamp */
  timestamp: Date;
  
  /** Is announced */
  announced: boolean;
}

/**
 * Keyboard navigation state
 */
export interface KeyboardNavigationState {
  /** Current focus */
  currentFocus?: string;
  
  /** Focus history */
  focusHistory: string[];
  
  /** Tab order */
  tabOrder: string[];
  
  /** Navigation mode */
  mode: 'tab' | 'arrow' | 'vim' | 'custom';
  
  /** Skip links */
  skipLinks: SkipLink[];
}

/**
 * Skip link
 */
export interface SkipLink {
  /** Link ID */
  id: string;
  
  /** Link text */
  text: string;
  
  /** Target element */
  target: string;
  
  /** Link position */
  position: number;
  
  /** Is visible */
  visible: boolean;
}

/**
 * Focus management state
 */
export interface FocusManagementState {
  /** Focus trap active */
  trapActive: boolean;
  
  /** Trap boundaries */
  trapBoundaries?: { start: string; end: string };
  
  /** Focus restoration */
  restoreTarget?: string;
  
  /** Focus outline visible */
  outlineVisible: boolean;
  
  /** Focus indicators */
  indicators: FocusIndicator[];
}

/**
 * Focus indicator
 */
export interface FocusIndicator {
  /** Indicator type */
  type: 'outline' | 'highlight' | 'shadow' | 'border';
  
  /** Indicator style */
  style: string;
  
  /** Indicator elements */
  elements: string[];
  
  /** Indicator active */
  active: boolean;
}

/**
 * Color contrast state
 */
export interface ColorContrastState {
  /** Current contrast level */
  level: 'aa' | 'aaa' | 'custom';
  
  /** Contrast ratios */
  ratios: Record<string, number>;
  
  /** Contrast issues */
  issues: ContrastIssue[];
  
  /** High contrast mode */
  highContrast: boolean;
}

/**
 * Contrast issue
 */
export interface ContrastIssue {
  /** Issue ID */
  id: string;
  
  /** Affected elements */
  elements: string[];
  
  /** Current ratio */
  currentRatio: number;
  
  /** Required ratio */
  requiredRatio: number;
  
  /** Issue severity */
  severity: 'warning' | 'error';
  
  /** Suggested fix */
  suggestedFix?: string;
}

/**
 * Motion preferences state
 */
export interface MotionPreferencesState {
  /** Reduced motion enabled */
  reducedMotion: boolean;
  
  /** Animation level */
  animationLevel: 'none' | 'reduced' | 'normal' | 'enhanced';
  
  /** Transition preferences */
  transitions: MotionTransitionPrefs;
  
  /** Parallax preferences */
  parallax: boolean;
}

/**
 * Motion transition preferences
 */
export interface MotionTransitionPrefs {
  /** Duration multiplier */
  durationMultiplier: number;
  
  /** Easing preference */
  easing: 'linear' | 'ease' | 'custom';
  
  /** Disable specific animations */
  disabled: string[];
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Enable accessibility features */
  enabled: boolean;
  
  /** ARIA support */
  ariaSupport: boolean;
  
  /** Semantic HTML enforcement */
  semanticHTML: boolean;
  
  /** Accessibility testing */
  testing: boolean;
  
  /** Auto-announcements */
  autoAnnouncements: boolean;
  
  /** Focus management */
  focusManagement: boolean;
}
  // types/ui.ts - UI state management types for create, preview, and edit modes
// Handles selection, toolbars, panels, navigation, and user interactions

import { SectionType, ElementType, BackgroundType } from './content';
import { FormFieldType } from './forms';

/**
 * ===== APPLICATION MODES =====
 */

/**
 * Main application mode
 */
export type AppMode = 'create' | 'preview' | 'edit' | 'publish';

/**
 * Edit mode sub-states
 */
export type EditMode = 
  | 'design'        // Visual design editing
  | 'content'       // Content editing
  | 'forms'         // Form builder
  | 'images'        // Image management
  | 'settings'      // Page settings
  | 'ai'            // AI generation controls
  | 'preview'       // Live preview
  | 'code';         // Code view

/**
 * ===== SELECTION SYSTEM =====
 */

/**
 * Currently selected element
 */
export interface ElementSelection {
  /** Selection type */
  type: 'section' | 'element' | 'form' | 'form-field' | 'image' | 'collection';
  
  /** Selected item ID */
  id: string;
  
  /** Element type (for element selections) */
  elementType?: ElementType;
  
  /** Parent section ID */
  parentSection?: string;
  
  /** Parent form ID (for form field selections) */
  parentForm?: string;
  
  /** Selection metadata */
  metadata: SelectionMetadata;
  
  /** Multiple selection */
  multiSelect?: MultiSelection;
}

/**
 * Selection metadata
 */
export interface SelectionMetadata {
  /** When selection was made */
  selectedAt: Date;
  
  /** How selection was made */
  selectionMethod: 'click' | 'keyboard' | 'api' | 'drag' | 'search';
  
  /** Selection context */
  context?: SelectionContext;
  
  /** Previous selection */
  previousSelection?: ElementSelection;
  
  /** Selection path for breadcrumbs */
  selectionPath: SelectionPathItem[];
}

/**
 * Selection context
 */
export interface SelectionContext {
  /** User action that triggered selection */
  triggerAction: string;
  
  /** UI element that triggered selection */
  triggerElement?: string;
  
  /** Additional context data */
  data?: Record<string, any>;
}

/**
 * Selection path item for breadcrumbs
 */
export interface SelectionPathItem {
  /** Item type */
  type: 'page' | 'section' | 'element' | 'form' | 'field';
  
  /** Item ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Item icon */
  icon?: string;
  
  /** Is selectable */
  selectable: boolean;
}

/**
 * Multiple selection data
 */
export interface MultiSelection {
  /** All selected items */
  items: ElementSelection[];
  
  /** Primary selection (for actions) */
  primary: string;
  
  /** Selection bounds */
  bounds?: SelectionBounds;
  
  /** Common properties */
  commonProperties?: Record<string, any>;
}

/**
 * Selection bounds for multi-select
 */
export interface SelectionBounds {
  /** Top coordinate */
  top: number;
  
  /** Left coordinate */
  left: number;
  
  /** Width */
  width: number;
  
  /** Height */
  height: number;
  
  /** Center point */
  center: { x: number; y: number };
}

/**
 * ===== TOOLBAR SYSTEM =====
 */

/**
 * Floating toolbar state
 */
export interface ToolbarState {
  /** Toolbar visibility */
  isVisible: boolean;
  
  /** Toolbar position */
  position: ToolbarPosition;
  
  /** Toolbar type */
  type: ToolbarType;
  
  /** Target element */
  targetId: string;
  
  /** Available actions */
  actions: ToolbarAction[];
  
  /** Toolbar configuration */
  config: ToolbarConfig;
  
  /** Toolbar state */
  state: ToolbarStateData;
}

/**
 * Toolbar position
 */
export interface ToolbarPosition {
  /** X coordinate */
  x: number;
  
  /** Y coordinate */
  y: number;
  
  /** Positioning strategy */
  strategy: 'absolute' | 'fixed' | 'relative';
  
  /** Anchor point */
  anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  
  /** Offset from anchor */
  offset: { x: number; y: number };
  
  /** Bounds checking */
  bounds?: PositionBounds;
}

/**
 * Position bounds for toolbar placement
 */
export interface PositionBounds {
  /** Minimum X */
  minX: number;
  
  /** Maximum X */
  maxX: number;
  
  /** Minimum Y */
  minY: number;
  
  /** Maximum Y */
  maxY: number;
}

/**
 * Font weights
 */
export interface FontWeights {
  /** Light weight */
  light: number;
  
  /** Normal weight */
  normal: number;
  
  /** Medium weight */
  medium: number;
  
  /** Semibold weight */
  semibold: number;
  
  /** Bold weight */
  bold: number;
}

/**
 * Semantic colors
 */
export interface SemanticColors {
  /** Success states */
  success: string;
  
  /** Warning states */
  warning: string;
  
  /** Error states */
  error: string;
  
  /** Info states */
  info: string;
  
  /** Neutral states */
  neutral: string;
}

/**
 * State colors (hover, focus, etc.)
 */
export interface StateColors {
  /** Hover state colors */
  hover: Record<string, string>;
  
  /** Focus state colors */
  focus: Record<string, string>;
  
  /** Active state colors */
  active: Record<string, string>;
  
  /** Disabled state colors */
  disabled: Record<string, string>;
}
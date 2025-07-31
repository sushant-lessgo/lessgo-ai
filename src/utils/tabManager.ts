// Tab management utility for coordinating between edit and preview tabs
// Uses BroadcastChannel API for cross-tab communication

interface TabInfo {
  id: string;
  type: 'edit' | 'preview';
  tokenId: string;
  timestamp: number;
}

interface TabMessage {
  type: 'register' | 'unregister' | 'ping' | 'pong' | 'focus' | 'check';
  tabInfo: TabInfo;
  targetId?: string;
}

class TabManager {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private tabInfo: TabInfo;
  private activeTabs: Map<string, TabInfo> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(type: 'edit' | 'preview', tokenId: string) {
    this.tabId = this.generateTabId();
    this.tabInfo = {
      id: this.tabId,
      type,
      tokenId,
      timestamp: Date.now()
    };

    // Initialize if BroadcastChannel is supported
    if (typeof BroadcastChannel !== 'undefined') {
      this.initializeChannel();
    }

    // Store tab ID in sessionStorage for reference
    sessionStorage.setItem('tabId', this.tabId);
  }

  private generateTabId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeChannel(): void {
    try {
      this.channel = new BroadcastChannel('lessgo-tab-coordination');
      
      // Listen for messages
      this.channel.onmessage = (event: MessageEvent<TabMessage>) => {
        this.handleMessage(event.data);
      };

      // Register this tab
      this.sendMessage({
        type: 'register',
        tabInfo: this.tabInfo
      });

      // Start ping interval to keep tabs aware of each other
      this.pingInterval = setInterval(() => {
        this.sendMessage({
          type: 'ping',
          tabInfo: this.tabInfo
        });
      }, 5000);

      // Cleanup stale tabs
      this.cleanupInterval = setInterval(() => {
        this.cleanupStaleTabs();
      }, 10000);

      // Handle tab close
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });

    } catch (error) {
      console.warn('BroadcastChannel not supported:', error);
    }
  }

  private handleMessage(message: TabMessage): void {
    switch (message.type) {
      case 'register':
      case 'ping':
        // Update tab info
        this.activeTabs.set(message.tabInfo.id, {
          ...message.tabInfo,
          timestamp: Date.now()
        });
        // Respond with pong
        if (message.type === 'ping') {
          this.sendMessage({
            type: 'pong',
            tabInfo: this.tabInfo,
            targetId: message.tabInfo.id
          });
        }
        break;

      case 'pong':
        // Update timestamp for responding tab
        if (message.targetId === this.tabId) {
          this.activeTabs.set(message.tabInfo.id, {
            ...message.tabInfo,
            timestamp: Date.now()
          });
        }
        break;

      case 'unregister':
        // Remove tab from active list
        this.activeTabs.delete(message.tabInfo.id);
        break;

      case 'focus':
        // Handle focus request
        if (message.targetId === this.tabId) {
          window.focus();
        }
        break;

      case 'check':
        // Respond to check request
        if (message.tabInfo.tokenId === this.tabInfo.tokenId) {
          this.sendMessage({
            type: 'pong',
            tabInfo: this.tabInfo,
            targetId: message.tabInfo.id
          });
        }
        break;
    }
  }

  private sendMessage(message: TabMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  private cleanupStaleTabs(): void {
    const now = Date.now();
    const staleThreshold = 15000; // 15 seconds

    for (const [id, info] of this.activeTabs.entries()) {
      if (now - info.timestamp > staleThreshold) {
        this.activeTabs.delete(id);
      }
    }
  }

  // Find existing edit tab for the same token
  public findExistingEditTab(): TabInfo | null {
    for (const [id, info] of this.activeTabs.entries()) {
      if (info.type === 'edit' && info.tokenId === this.tabInfo.tokenId && id !== this.tabId) {
        return info;
      }
    }
    return null;
  }

  // Try to focus an existing tab
  public async focusTab(tabId: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Send focus message
      this.sendMessage({
        type: 'focus',
        tabInfo: this.tabInfo,
        targetId: tabId
      });

      // Check if tab responds
      setTimeout(() => {
        const tab = this.activeTabs.get(tabId);
        if (tab && Date.now() - tab.timestamp < 5000) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 100);
    });
  }

  // Get all active tabs for the token
  public getActiveTabs(): TabInfo[] {
    return Array.from(this.activeTabs.values()).filter(
      tab => tab.tokenId === this.tabInfo.tokenId
    );
  }

  // Cleanup on destroy
  public destroy(): void {
    if (this.channel) {
      this.sendMessage({
        type: 'unregister',
        tabInfo: this.tabInfo
      });
      this.channel.close();
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    sessionStorage.removeItem('tabId');
  }
}

// Export singleton factory
let instances: Map<string, TabManager> = new Map();

export function getTabManager(type: 'edit' | 'preview', tokenId: string): TabManager {
  const key = `${type}-${tokenId}`;
  
  if (!instances.has(key)) {
    instances.set(key, new TabManager(type, tokenId));
  }
  
  return instances.get(key)!;
}

export function cleanupTabManager(type: 'edit' | 'preview', tokenId: string): void {
  const key = `${type}-${tokenId}`;
  const instance = instances.get(key);
  
  if (instance) {
    instance.destroy();
    instances.delete(key);
  }
}
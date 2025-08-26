import { getHeaders } from '@/utils/api';

export interface RetryConfig {
  maxRetries: number;
  timeoutMs: number;
  backoffMultiplier: number;
  autoRefreshOnFailure: boolean;
}

export interface APIResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
  fromCache?: boolean;
  retryAttempt?: number;
}

export class ResilientAPIClient {
  private static instance: ResilientAPIClient;
  private failureCount = 0;
  private maxAutoRefresh = 2;
  private autoRefreshCount = 0;

  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    timeoutMs: 8000, // 8 seconds
    backoffMultiplier: 1.5,
    autoRefreshOnFailure: true
  };

  static getInstance(): ResilientAPIClient {
    if (!ResilientAPIClient.instance) {
      ResilientAPIClient.instance = new ResilientAPIClient();
    }
    return ResilientAPIClient.instance;
  }

  async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    config: Partial<RetryConfig> = {}
  ): Promise<APIResponse<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, finalConfig.timeoutMs);
        
        if (response.ok) {
          this.resetFailureCount();
          const data = await response.json();
          return {
            data,
            success: true,
            retryAttempt: attempt > 1 ? attempt : undefined
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error as Error;
        this.failureCount++;

        console.warn(`API attempt ${attempt} failed for ${url}:`, error);

        // Don't retry on last attempt
        if (attempt === finalConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.pow(finalConfig.backoffMultiplier, attempt - 1) * 1000;
        await this.sleep(delay);
      }
    }

    // All retries failed - check if we should auto-refresh
    if (finalConfig.autoRefreshOnFailure && this.shouldAutoRefresh(lastError)) {
      this.performAutoRefresh();
      return {
        data: null,
        success: false,
        error: 'Auto-refreshing page...'
      };
    }

    return {
      data: null,
      success: false,
      error: lastError?.message || 'Unknown error'
    };
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private shouldAutoRefresh(error: Error | null): boolean {
    if (this.autoRefreshCount >= this.maxAutoRefresh) {
      return false;
    }

    if (!error) return false;

    // Auto-refresh for specific error types
    const autoRefreshErrors = [
      'fetch failed',
      'ENOTFOUND', 
      'CORS',
      'AbortError',
      'NetworkError',
      'TypeError',
      'Failed to fetch',
      'Access-Control-Allow-Origin'
    ];

    return autoRefreshErrors.some(errorType => 
      error.message.includes(errorType) || error.name.includes(errorType)
    );
  }

  private performAutoRefresh(): void {
    this.autoRefreshCount++;
    
    // Show user-friendly message
    this.showAutoRefreshMessage();

    // Auto-refresh after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  private showAutoRefreshMessage(): void {
    // Create a non-intrusive notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    
    const isArabic = localStorage.getItem('language') === 'ar';
    notification.textContent = isArabic 
      ? 'اتصال بطيء، جاري إعادة تحميل الصفحة...'
      : 'Slow connection, refreshing page...';

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Remove after showing
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 1800);
  }

  private resetFailureCount(): void {
    this.failureCount = 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async checkAPIHealth(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        'https://awisapp.com/api/v1/config',
        { method: 'HEAD' },
        3000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get failure statistics
  getStats() {
    return {
      failureCount: this.failureCount,
      autoRefreshCount: this.autoRefreshCount,
      hasReachedMaxRefresh: this.autoRefreshCount >= this.maxAutoRefresh
    };
  }
}

// Singleton instance
export const resilientAPI = ResilientAPIClient.getInstance(); 
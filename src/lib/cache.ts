// Comprehensive caching system for the e-commerce app
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  language: string;
  expiryTime: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxAge: number; // Maximum age before stale
  staleWhileRevalidate: boolean;
}

export class AppCache {
  private static instance: AppCache;
  private cache = new Map<string, CacheItem>();
  private isOnline = true;
  private onlineCallbacks: ((isOnline: boolean) => void)[] = [];
  private isClient = false;

  // Cache configurations for different data types
  private cacheConfigs: Record<string, CacheConfig> = {
    seller: { ttl: 30 * 60 * 1000, maxAge: 60 * 60 * 1000, staleWhileRevalidate: true }, // 30min TTL, 1hr max
    config: { ttl: 30 * 60 * 1000, maxAge: 60 * 60 * 1000, staleWhileRevalidate: true },
    categories: { ttl: 15 * 60 * 1000, maxAge: 30 * 60 * 1000, staleWhileRevalidate: true }, // 15min TTL, 30min max
    products: { ttl: 10 * 60 * 1000, maxAge: 20 * 60 * 1000, staleWhileRevalidate: true }, // 10min TTL, 20min max
    product: { ttl: 10 * 60 * 1000, maxAge: 20 * 60 * 1000, staleWhileRevalidate: true },
    static: { ttl: 24 * 60 * 60 * 1000, maxAge: 48 * 60 * 60 * 1000, staleWhileRevalidate: true }, // 24hr TTL, 48hr max
  };

  private constructor() {
    this.isClient = typeof window !== 'undefined';
    if (this.isClient) {
      this.initializeOnlineDetection();
      this.loadFromLocalStorage();
    }
  }

  static getInstance(): AppCache {
    if (!AppCache.instance) {
      AppCache.instance = new AppCache();
    }
    return AppCache.instance;
  }

  private initializeOnlineDetection() {
    if (!this.isClient) return;
    
    this.isOnline = navigator.onLine;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyOnlineCallbacks(true);
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyOnlineCallbacks(false);
    });
  }

  private notifyOnlineCallbacks(isOnline: boolean) {
    this.onlineCallbacks.forEach(callback => callback(isOnline));
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    this.onlineCallbacks.push(callback);
    return () => {
      const index = this.onlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1);
      }
    };
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  private generateKey(key: string, language: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${key}_${language}_${paramString}`;
  }

  private loadFromLocalStorage() {
    if (!this.isClient) return;
    
    try {
      const stored = localStorage.getItem('app_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(parsed);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    if (!this.isClient) return;
    
    try {
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem('app_cache', serialized);
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private isExpired(item: CacheItem, config: CacheConfig): boolean {
    const now = Date.now();
    return now - item.timestamp > config.maxAge;
  }

  private isStale(item: CacheItem, config: CacheConfig): boolean {
    const now = Date.now();
    return now - item.timestamp > config.ttl;
  }

  set<T>(key: string, data: T, type: keyof typeof this.cacheConfigs, language: string, params?: Record<string, any>): void {
    const cacheKey = this.generateKey(key, language, params);
    const config = this.cacheConfigs[type];
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      language,
      expiryTime: Date.now() + config.maxAge,
    };

    this.cache.set(cacheKey, item);
    this.saveToLocalStorage();
  }

  get<T>(key: string, type: keyof typeof this.cacheConfigs, language: string, params?: Record<string, any>): { data: T | null; isStale: boolean; isExpired: boolean } {
    const cacheKey = this.generateKey(key, language, params);
    const item = this.cache.get(cacheKey) as CacheItem<T> | undefined;
    const config = this.cacheConfigs[type];

    if (!item) {
      return { data: null, isStale: true, isExpired: true };
    }

    const isExpired = this.isExpired(item, config);
    const isStale = this.isStale(item, config);

    if (isExpired) {
      this.cache.delete(cacheKey);
      this.saveToLocalStorage();
      return { data: null, isStale: true, isExpired: true };
    }

    return { data: item.data, isStale, isExpired };
  }

  // Get fresh cached data immediately without stale checks for instant loading
  getImmediate<T>(key: string, type: keyof typeof this.cacheConfigs, language: string, params?: Record<string, any>): T | null {
    const cacheKey = this.generateKey(key, language, params);
    const item = this.cache.get(cacheKey) as CacheItem<T> | undefined;
    const config = this.cacheConfigs[type];

    if (!item) {
      return null;
    }

    const isExpired = this.isExpired(item, config);
    if (isExpired) {
      this.cache.delete(cacheKey);
      this.saveToLocalStorage();
      return null;
    }

    return item.data;
  }

  invalidate(pattern?: string, language?: string): void {
    if (!pattern) {
      this.cache.clear();
    } else {
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(pattern) && (!language || key.includes(language))) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    }
    this.saveToLocalStorage();
  }

  // Clean up expired items
  cleanup(): void {
    if (!this.isClient) return;
    
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiryTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.saveToLocalStorage();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      isOnline: this.isOnline,
      entries: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        language: item.language,
        age: Date.now() - item.timestamp,
        expiresIn: item.expiryTime - Date.now(),
      })),
    };
  }
}

// Singleton instance
export const cache = AppCache.getInstance();

// Utility function for cache-aware API calls with instant cached data return
export async function cachedApiCall<T>(
  key: string,
  type: keyof AppCache['cacheConfigs'],
  language: string,
  fetcher: () => Promise<T>,
  params?: Record<string, any>
): Promise<T> {
  const cacheInstance = AppCache.getInstance();
  
  // First try to get immediate cached data (even if stale)
  const immediateData = cacheInstance.getImmediate<T>(key, type, language, params);
  
  // If we have cached data and we're offline, return it immediately
  if (immediateData && cacheInstance.isOffline()) {
    return immediateData;
  }

  // Check if we have fresh cached data
  const cached = cacheInstance.get<T>(key, type, language, params);
  if (cached.data && !cached.isStale) {
    return cached.data;
  }

  try {
    // Fetch fresh data
    const freshData = await fetcher();
    cacheInstance.set(key, freshData, type, language, params);
    return freshData;
  } catch (error) {
    // If fetch fails and we have any cached data (including stale), return it
    if (immediateData) {
      console.warn(`API call failed, returning cached data for ${key}:`, error);
      return immediateData;
    }
    throw error;
  }
}

// New function for instant cache-first loading with background refresh
export function getCachedDataInstant<T>(
  key: string,
  type: keyof AppCache['cacheConfigs'],
  language: string,
  params?: Record<string, any>
): T | null {
  const cacheInstance = AppCache.getInstance();
  return cacheInstance.getImmediate<T>(key, type, language, params);
} 
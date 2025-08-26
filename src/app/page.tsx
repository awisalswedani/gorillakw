"use client";
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSellerProducts, getSellerInfo, getSellerBanners, getConfig, formatPrice, getSellerCategories } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import CartIcon from '@/components/CartIcon';
import Header from '@/components/Header';
import clsx from 'clsx';
import Copyright from '@/components/Copyright';
import { WEB_CONSTANTS } from './web_constantsthe';
import ContactInfoBlock from '@/components/ContactInfoBlock';
import { useLanguage } from '../context/LanguageContext';
import i18n from '../i18n';
import Spinner from '../components/Spinner';
import { cache, getCachedDataInstant } from '@/lib/cache';
import { resilientAPI } from '@/lib/resilient-api';
import { getFallbackContent } from '@/lib/fallback-content';
import { HomepageSkeleton } from '@/components/SkeletonLoaders';
import OfflineErrorPage from '@/components/OfflineErrorPage';

export default function Home() {
  const { language } = useLanguage();
  const [productList, setProductList] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all');
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({});
  const [showInitialLoading, setShowInitialLoading] = useState(false);
  const [languageChangeLoading, setLanguageChangeLoading] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [hasInstantData, setHasInstantData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Check for instant cached data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedSeller = getCachedDataInstant('seller', 'seller', language);
      const cachedConfig = getCachedDataInstant('config', 'config', language);
      const cachedCategories = getCachedDataInstant('categories', 'categories', language);
      const cachedProducts = getCachedDataInstant('products', 'products', language, { limit: '1000', offset: '1' });

      if (cachedSeller && cachedConfig && cachedCategories && cachedProducts) {
        // We have cached data, show it immediately
        setSeller(cachedSeller);
        setConfig(cachedConfig);
        const categoriesData = Array.isArray(cachedCategories) ? cachedCategories : [];
        const productsData = (cachedProducts && typeof cachedProducts === 'object' && 'products' in cachedProducts) 
          ? cachedProducts.products as any[] : [];
        setCategories(categoriesData);
        setProductList(Array.isArray(productsData) ? productsData : []);
        
        // Group products by category
        const byCat: Record<string, any[]> = {};
        categoriesData.forEach((cat: any) => {
          byCat[cat.id] = [];
        });
        (Array.isArray(productsData) ? productsData : []).forEach((product: any) => {
          const catId = product.category_id || product.categoryId || (product.category && product.category.id);
          if (catId && byCat[catId]) {
            byCat[catId].push(product);
          }
        });
        setProductsByCategory(byCat);
        setLoading(false);
        setHasInstantData(true);
        
        // Start background refresh
        setIsBackgroundRefreshing(true);
      } else {
        // No cached data, show loading only if first visit
        const hasVisited = sessionStorage.getItem('hasVisitedHome');
        if (!hasVisited) {
          setShowInitialLoading(true);
          sessionStorage.setItem('hasVisitedHome', 'true');
        }
      }
    }
  }, [language]);

  // Enhanced data fetching with cache-first approach
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh && !hasInstantData) {
      setLoading(true);
    } else if (isRefresh) {
      setIsBackgroundRefreshing(true);
    }

    try {
      // Always fetch fresh data (will use cache if available or offline)
      const [configRes, productsRes, sellerRes, categoriesRes] = await Promise.all([
        getConfig(),
        getSellerProducts({ limit: '1000', offset: '1' }),
        getSellerInfo(),
        getSellerCategories()
      ]);

      setConfig(configRes);
      setSeller(sellerRes);
      setCategories(categoriesRes || []);
      setProductList(productsRes?.products || []);

      // Group products by category
      const byCat: Record<string, any[]> = {};
      (categoriesRes || []).forEach((cat: any) => {
        byCat[cat.id] = [];
      });
      (productsRes?.products || []).forEach((product: any) => {
        const catId = product.category_id || product.categoryId || (product.category && product.category.id);
        if (catId && byCat[catId]) {
          byCat[catId].push(product);
        }
      });
      setProductsByCategory(byCat);
      setLastRefresh(Date.now());

    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      
      // Check if this is a network error that warrants fallback content
      const isNetworkError = error.message?.includes('fetch failed') || 
                           error.message?.includes('ENOTFOUND') ||
                           error.message?.includes('NetworkError') ||
                           error.name === 'TypeError';

      // If we have any cached data, continue showing it
      if (seller || config || categories.length > 0) {
        setError(error.message);
        return; // Continue with cached data
      }

      // No cached data - show appropriate fallback
      if (isNetworkError) {
        // Auto-refresh for CORS/network errors (up to 2 times)
        const apiStats = resilientAPI.getStats();
        if (apiStats.autoRefreshCount < 2) {
          console.log(`Auto-refreshing page due to ${error.name}: ${error.message}`);
          // Show brief message before refresh
          const isArabic = language === 'ar';
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #3b82f6; color: white; padding: 20px 30px;
            border-radius: 12px; font-size: 16px; z-index: 9999;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3); text-align: center;
            min-width: 300px;
          `;
          notification.innerHTML = `
            <div style="margin-bottom: 10px;">
              <svg style="animation: spin 1s linear infinite; width: 24px; height: 24px; margin: 0 auto; display: block;" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="31.416" stroke-dashoffset="31.416" opacity="0.25"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.75"/>
              </svg>
            </div>
            ${isArabic ? 'اتصال بطيء، جاري إعادة تحميل الصفحة...' : 'Slow connection, refreshing page...'}
          `;
          
          // Add CSS animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
          document.body.appendChild(notification);
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        } else {
          // Show fallback content after max auto-refreshes
          setShowFallback(true);
          const fallbackContent = getFallbackContent(language);
          setSeller(fallbackContent.store);
          setConfig(fallbackContent.config);
          setCategories(fallbackContent.categories);
          setProductList(fallbackContent.products);
          
          // Group fallback products by category
          const byCat: Record<string, any[]> = {};
          fallbackContent.categories.forEach((cat: any) => {
            byCat[cat.id] = [];
          });
          fallbackContent.products.forEach((product: any) => {
            const matchingCat = fallbackContent.categories.find(c => c.name === product.category);
            if (matchingCat) {
              byCat[matchingCat.id].push(product);
            }
          });
          setProductsByCategory(byCat);
        }
      }
      
      setError(error.message);
    } finally {
      setLoading(false);
      setIsBackgroundRefreshing(false);
    }
  }, [hasInstantData, seller, config, categories.length]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Background refresh when language changes
  useEffect(() => {
    const refreshData = async () => {
      // Only refresh if we already have data (not on initial load)
      if (categories.length > 0) {
        setLanguageChangeLoading(true);
        try {
          await fetchData(true);
        } catch (error) {
          console.error('Failed to refresh data:', error);
        } finally {
          setLanguageChangeLoading(false);
        }
      }
    };
    
    refreshData();
  }, [language]);

  // Periodic background refresh (every 5 minutes when online)
  useEffect(() => {
    if (!cache.isOffline() && categories.length > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        // Only refresh if last refresh was more than 5 minutes ago
        if (now - lastRefresh > 5 * 60 * 1000) {
          fetchData(true);
        }
      }, 60 * 1000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [fetchData, lastRefresh, categories.length]);

  // Online status change handler
  useEffect(() => {
    const unsubscribe = cache.onOnlineStatusChange((isOnline) => {
      if (isOnline && categories.length > 0) {
        // Refresh data when coming back online
        setTimeout(() => fetchData(true), 1000);
      }
    });

    return unsubscribe;
  }, [fetchData, categories.length]);

  useEffect(() => {
    if (!loading && showInitialLoading) {
      // Hide spinner after data is loaded
      setTimeout(() => setShowInitialLoading(false), 600); // short delay for smoothness
    }
  }, [loading, showInitialLoading]);

  // Show skeleton loading for better UX
  if ((loading && !hasInstantData && !showFallback) || languageChangeLoading) {
    return <HomepageSkeleton />;
  }

  // Show fallback error page if needed
  if (showFallback && error) {
    return (
      <OfflineErrorPage 
        errorType="apiError" 
        onRetry={() => {
          setShowFallback(false);
          setError(null);
          fetchData();
        }}
        showFallbackProducts={true}
      />
    );
  }

  // Helper to render products grid
  function ProductsGrid({ products }: { products: any[] }) {
    if (!products || products.length === 0) {
      return <div className="text-center text-gray-400 py-8">لا يوجد منتجات في هذا القسم</div>;
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10 justify-items-center max-w-6xl mx-auto">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} config={config} />
        ))}
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background refresh indicator */}
      {isBackgroundRefreshing && (
        <div className="fixed top-16 right-4 z-40 bg-blue-500 text-white px-3 py-1 rounded-md text-xs">
          {language === 'ar' ? 'تحديث...' : 'Updating...'}
        </div>
      )}

      {/* Hero Section with Shop Banner */}
      <section className="relative bg-white py-6 sm:py-8 lg:py-12">
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              {seller?.seller?.shop?.banner_full_url?.path ? (
                <div className="relative w-full">
                  <Image
                    src={seller.seller.shop.banner_full_url.path}
                    alt={`${seller.seller.shop.name} - Shop Banner`}
                    width={1200}
                    height={400}
                    className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1200px"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                  <div className="text-center text-white px-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                      {seller?.seller?.shop?.name || 'Welcome to Our Store'}
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg opacity-90">
                      Discover amazing products at great prices
                    </p>
                  </div>
                </div>
              )}
              
              {/* Subtle overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - horizontal scrollable list */}
      {categories.length > 0 && (
        <section className="py-6 bg-white">
          <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 flex justify-center">
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
              <div className="flex gap-2 md:gap-3 w-max px-2">
                {/* Custom 'All Products' category as pill */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border shadow-sm',
                    selectedCategory === 'all'
                      ? 'text-white border-[#991b1b] shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-[#991b1b] hover:text-[#991b1b]'
                  )}
                  style={selectedCategory === 'all' ? { minWidth: '80px', background: WEB_CONSTANTS.primaryColor, borderColor: WEB_CONSTANTS.primaryColor } : { minWidth: '80px' }}
                >
                  {seller?.seller?.image_full_url?.path && (
                    <Image
                      src={seller.seller.image_full_url.path}
                      alt="الكل"
                      width={28}
                      height={28}
                      className="rounded-full border border-gray-200 bg-white"
                    />
                  )}
                  <span>{language === 'ar' ? 'الكل' : i18n.t('all')}</span>
                </button>
              {categories.map((category: any) => {
                const categoryName = category.name || category.title || category.category_name || 'Category';
                  const categoryImage = category.icon_full_url?.path || category.icon || category.image?.path || category.image_full_url?.path;
                return (
                    <button
                      type="button"
                    key={category.id} 
                      onClick={() => setSelectedCategory(category.id)}
                      className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border shadow-sm',
                        selectedCategory === category.id
                          ? 'text-white border-[#991b1b] shadow-lg scale-105'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-[#991b1b] hover:text-[#991b1b]'
                      )}
                      style={selectedCategory === category.id ? { minWidth: '80px', background: WEB_CONSTANTS.primaryColor, borderColor: WEB_CONSTANTS.primaryColor } : { minWidth: '80px' }}
                    >
                      {categoryImage && (
            <Image
                            src={categoryImage}
                            alt={categoryName}
                          width={28}
                          height={28}
                          className="rounded-full border border-gray-200 bg-white"
                        />
                        )}
                      <span>{categoryName}</span>
                    </button>
                );
              })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Category/Product Display */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {selectedCategory === 'all' ? (
            categories.map((category: any) => (
              <div key={category.id} className="mb-10">
                <div className="flex flex-col items-center my-2">
                  <h2 className="text-3xl font-extrabold text-gray-900 text-center tracking-wide mb-2" style={{letterSpacing: '0.02em'}}>
                    {category.name || category.title || category.category_name || 'Category'}
            </h2>
                  <div className="w-16 h-1 rounded-full opacity-70 mb-2" style={{ background: WEB_CONSTANTS.primaryColor }}></div>
          </div>
                <ProductsGrid products={productsByCategory[category.id] || []} />
            </div>
            ))
          ) : (
            <div>
              <div className="flex flex-col items-center my-2">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center tracking-wide mb-2" style={{letterSpacing: '0.02em'}}>
                  {categories.find((cat: any) => cat.id === selectedCategory)?.name || 'Category'}
                </h2>
                <div className="w-16 h-1 rounded-full opacity-70 mb-2" style={{ background: WEB_CONSTANTS.primaryColor }}></div>
              </div>
              <ProductsGrid products={productsByCategory[selectedCategory] || []} />
              </div>
          )}
        </div>
      </section>

      {/* Footer */}
      {/* Desktop Footer */}
      <footer className="hidden lg:block bg-gray-900 text-white py-10">
        <div className="max-w-xl mx-auto flex flex-col items-center space-y-6 px-4">
          {/* Seller Logo */}
          {seller?.seller?.image_full_url?.path && (
            <Image
              src={seller.seller.image_full_url.path}
              alt="Seller Logo"
              width={80}
              height={80}
              className="rounded-full border border-gray-200 bg-white p-2 shadow mb-2"
            />
          )}
          <ContactInfoBlock textColor="white" />
          {/* Copyright */}
          <Copyright className="mt-6" whiteText={true} />
        </div>
      </footer>
      {/* Mobile/Tablet Copyright Only */}
      <div className="block lg:hidden w-full flex justify-center py-6">
        <Copyright />
      </div>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:hidden flex justify-around items-center h-16">
        <a href="/" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group text-[#991b1b] border-t-2 border-[#991b1b] pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'القائمة' : i18n.t('menu')}
        </a>
        <a href="/orders" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group text-gray-700 hover:text-[#991b1b] pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor"/>
            <path d="M8 10h8M8 14h5" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'حالة الطلب' : i18n.t('order_status')}
        </a>
        <a href="/cart" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group text-gray-700 hover:text-[#991b1b] pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M7 6v14a2 2 0 002 2h6a2 2 0 002-2V6" stroke="currentColor"/>
            <circle cx="9" cy="21" r="1" stroke="currentColor"/>
            <circle cx="15" cy="21" r="1" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'السلة' : i18n.t('cart')}
        </a>
        <a href="/login" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group text-gray-700 hover:text-[#991b1b] pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" stroke="currentColor"/>
            <path d="M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'تسجيل دخول' : i18n.t('login')}
        </a>
        <a href="/more" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group text-gray-700 hover:text-[#991b1b] pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor"/>
            <path d="M8 8h8M8 12h8M8 16h8" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'المزيد' : i18n.t('more')}
        </a>
      </nav>
      <div className="h-20 lg:hidden" />
    </div>
  );
}

/* Add this to the bottom of the file if using CSS-in-JS, or add to global CSS if not: */
/*
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
*/

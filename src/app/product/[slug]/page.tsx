"use client";

import { getConfig, formatPrice, getOrCreateGuestId, getHeaders, getSellerProducts, getProductDetails } from '@/utils/api';
import { cache, getCachedDataInstant } from '@/lib/cache';
import { resilientAPI } from '@/lib/resilient-api';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from './AddToCartButton';
import CartIcon from '@/components/CartIcon';
import ProductCard from '@/components/ProductCard';
import { useState, useMemo, useEffect } from 'react';
import VariantSelectionWrapper from './VariantSelectionWrapper';
import ProductImageGallery from './ProductImageGallery';
import { useLanguage } from '@/context/LanguageContext';
import i18n from '@/i18n';
import ContactInfoBlock from '@/components/ContactInfoBlock';
import Copyright from '@/components/Copyright';
import Spinner from '../../../components/Spinner';
import { WEB_CONSTANTS } from '../../../app/web_constantsthe';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { language } = useLanguage();
  const [product, setProduct] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  const [isSlidingDown, setIsSlidingDown] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [hasInstantData, setHasInstantData] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

  // Check for instant cached data on mount
  useEffect(() => {
    const checkCachedData = async () => {
      if (typeof window !== 'undefined') {
        const { slug } = await params;
        const cachedConfig = getCachedDataInstant('config', 'config', language);
        const cachedProduct = getCachedDataInstant(`product_${slug}`, 'product', language);

        if (cachedConfig && cachedProduct) {
          // We have cached data, show it immediately
          setConfig(cachedConfig);
          setProduct(cachedProduct);
          setLoading(false);
          setHasInstantData(true);
          // Start background refresh
          setIsBackgroundRefreshing(true);
        }
      }
    };
    checkCachedData();
  }, [params, language]);

  useEffect(() => {
    if (!hasInstantData) {
      setLoading(true); // Show spinner only if no cached data
    }
    
    async function fetchData() {
      try {
        const { slug } = await params;

        // Fetch fresh data using the cached API function
        const [configData, productData] = await Promise.all([
          getConfig(),
          getProductDetails(slug)
        ]);

        setConfig(configData);
        if (!productData || Object.keys(productData).length === 0) {
          notFound();
        }
        setProduct(productData);
        setIsBackgroundRefreshing(false);
      } catch (err: any) {
        
        // Check if this is a network error that warrants auto-refresh
        const isNetworkError = err.message?.includes('fetch failed') || 
                             err.message?.includes('ENOTFOUND') ||
                             err.message?.includes('NetworkError') ||
                             err.name === 'TypeError';
        
        // Try to use cached data as fallback
        const { slug } = await params;
        const cachedConfig = cache.get('config', 'config', language);
        const cachedProduct = cache.get(`product_${slug}`, 'product', language);
        
        if (cachedConfig.data && cachedProduct.data) {
          setConfig(cachedConfig.data);
          setProduct(cachedProduct.data);
          setError(null); // Clear any previous errors
        } else if (isNetworkError) {
          // Auto-refresh for CORS/network errors (up to 2 times)
          const apiStats = resilientAPI.getStats();
          if (apiStats.autoRefreshCount < 2) {
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
            setError(err.message);
          }
        } else {
          setError(err.message);
        }
        setIsBackgroundRefreshing(false);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params, language, hasInstantData]);

  // Online status change handler
  useEffect(() => {
    const unsubscribe = cache.onOnlineStatusChange((isOnline) => {
      if (isOnline && product) {
        // Refresh data when coming back online
        setTimeout(() => {
          setIsBackgroundRefreshing(true);
          const refreshData = async () => {
            try {
              const { slug } = await params;
              const [configData, productData] = await Promise.all([
                getConfig(),
                getProductDetails(slug)
              ]);
              setConfig(configData);
              setProduct(productData);
            } catch (error) {
              // Failed to refresh product data
            } finally {
              setIsBackgroundRefreshing(false);
            }
          };
          refreshData();
        }, 1000);
      }
    });

    return unsubscribe;
  }, [params, product]);

  function getAverageRating(product: any): number {
    if (product.reviews && product.reviews.length > 0) {
      const totalRating = product.reviews.reduce((sum: number, r: any) => {
        let rating = 0;
        if (typeof r.rating === 'number') {
          rating = r.rating;
        } else if (typeof r.rating === 'string') {
          rating = parseFloat(r.rating) || 0;
        }
        return sum + rating;
      }, 0);
      return totalRating / product.reviews.length;
    }
    return 0;
  }

  function getLocalizedProductValue(product: any, key: string, language: string) {
    if (product.translations && Array.isArray(product.translations)) {
      if (language === 'ar') {
        const t = product.translations.find(
          (tr: any) => tr.locale === 'kw' && tr.key === key
        );
        if (t && t.value) return t.value;
      } else {
        // For English, prefer translation with locale 'en', else fallback to product[key]
        const t = product.translations.find(
          (tr: any) => tr.locale === 'en' && tr.key === key
        );
        if (t && t.value) return t.value;
      }
    }
    return product[key];
  }


  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Fetch suggested products when product data is available
  useEffect(() => {
    if (product) {
      async function fetchSuggestedProducts() {
        try {
          // Use the same logic as home page for consistent localization
          const productsRes = await getSellerProducts({ limit: '1000', offset: '1' });
          let products = (productsRes.products || []).filter((p: any) => p.slug !== product.slug);
          // Shuffle and pick 4 random products
          const shuffled = products.sort(() => 0.5 - Math.random()).slice(0, 4);
          setSuggestedProducts(shuffled);
        } catch (e) {
          setSuggestedProducts([]);
        }
      }
      fetchSuggestedProducts();
    }
  }, [product]);

  if (loading && !hasInstantData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Spinner size={56} />
        {cache.isOffline() && (
          <p className="mt-4 text-sm text-gray-500">
            {language === 'ar' ? 'تحميل البيانات المحفوظة...' : 'Loading cached data...'}
          </p>
        )}
      </div>
    );
  }

  // --- VARIANT SELECTION LOGIC (Client Component) ---
  // This block will be rendered above AddToCartButton
  // We'll use a client-side wrapper for the variant selection UI

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background refresh indicator */}
      {isBackgroundRefreshing && (
        <div className="fixed top-16 right-4 z-40 bg-blue-500 text-white px-3 py-1 rounded-md text-xs">
          {language === 'ar' ? 'تحديث...' : 'Updating...'}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center py-2 border-b border-gray-100 min-h-[48px]">
            <Link href="/" aria-label="Back to home" className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm focus:outline-none" style={{ boxShadow: 'none' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: WEB_CONSTANTS.secondaryColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="mx-auto text-xl font-bold truncate max-w-xs md:max-w-lg text-center w-full" style={{ color: '#222' }}>{getLocalizedProductValue(product, 'name', language)}</h1>
          </div>

        </div>
      </header>

      {/* Product Details */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <ProductImageGallery product={product} />

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {getLocalizedProductValue(product, 'name', language)}
                </h1>

                {/* Rating Block (matches Flutter app and image) */}
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < (parseFloat(product.average_review) || getAverageRating(product)) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-800 font-semibold mr-2">
                    {(parseFloat(product.average_review) || getAverageRating(product)).toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({product.reviews_count || (product.reviews ? product.reviews.length : 0)})
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4">
                {(() => {
                  const unitPrice = parseFloat(product.unit_price) || 0;
                  const discount = parseFloat(product.discount) || 0;
                  let finalPrice = unitPrice;
                  
                  if (product.discount_type === 'percentage' && discount > 0) {
                    finalPrice = unitPrice - (unitPrice * discount / 100);
                  } else if (discount > 0) {
                    finalPrice = unitPrice - discount;
                  }
                  
                  return (
                    <>
                      <span className="text-3xl font-bold text-green-600">
                        {formatPrice(finalPrice, config, language)}
                      </span>
                      {discount > 0 && (
                        <span className="text-xl text-gray-400 line-through">
                          {formatPrice(unitPrice, config, language)}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Variant and Quantity Block (moved below price) */}
              <VariantSelectionWrapper product={product} config={config}
                onAddToCartSuccess={() => {
                  setShowSuccess(true);
                  setIsSlidingUp(true);
                  setIsSlidingDown(false);
                  setTimeout(() => {
                    setIsSlidingUp(false);
                    setIsSlidingDown(true);
                    setTimeout(() => {
                      setShowSuccess(false);
                      setIsSlidingDown(false);
                    }, 350);
                  }, 2000);
                }}
              />

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.current_stock > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.current_stock > 0 ? (language === 'ar' ? 'متوفر' : i18n.t('in_stock')) : (language === 'ar' ? 'غير متوفر' : i18n.t('out_of_stock'))}
                </span>
                {product.current_stock > 0 && (
                  <span className="text-sm text-gray-600">
                    {product.current_stock} {language === 'ar' ? 'متوفر' : i18n.t('available')}
                  </span>
                )}
              </div>

              {/* Description */}
              {(getLocalizedProductValue(product, 'details', language) || product.details) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{language === 'ar' ? 'الوصف' : i18n.t('description')}</h3>
                  <div 
                    className="text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: getLocalizedProductValue(product, 'details', language) || product.details }}
                  />
                </div>
              )}

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{language === 'ar' ? 'المواصفات' : i18n.t('specifications')}</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="space-y-2">
                      {product.specifications.map((spec: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <dt className="text-gray-600 font-medium">{spec.name}:</dt>
                          <dd className="text-gray-900">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Suggested Products Section */}
      {suggestedProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'المنتجات المقترحة' : i18n.t('suggested_products')}
              </h2>
            </div>
            {/* Enhanced horizontal layout with better sizing for desktop/tablet */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-10 w-max px-4 justify-center">
                {suggestedProducts.slice(0, 3).map((product: any) => (
                  <div key={product.id} className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 flex-shrink-0">
                    <ProductCard product={product} config={config} language={language} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:hidden flex justify-around items-center h-16">
        <Link href="/" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'القائمة' : i18n.t('menu')}
        </Link>
        <Link href="/orders" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor"/>
            <path d="M8 10h8M8 14h5" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'حالة الطلب' : i18n.t('order_status')}
        </Link>
        <Link href="/cart" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M7 6v14a2 2 0 002 2h6a2 2 0 002-2V6" stroke="currentColor"/>
            <circle cx="9" cy="21" r="1" stroke="currentColor"/>
            <circle cx="15" cy="21" r="1" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'السلة' : i18n.t('cart')}
        </Link>
        <Link href="/more" className="flex flex-col items-center justify-center text-xs font-semibold transition-colors group pt-1 w-full">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor"/>
            <path d="M8 8h8M8 12h8M8 16h8" stroke="currentColor"/>
          </svg>
          {language === 'ar' ? 'المزيد' : i18n.t('more')}
        </Link>
      </nav>
      {/* Bottom spacing for mobile & tablet navigation */}
      <div className="h-20 lg:hidden" />

      {showSuccess && (
        <>
          {/* Mobile & Tablet: Toast overlays nav bar, full width, no border radius, slides up then down */}
          <div
            className={`fixed bottom-0 left-0 w-full h-16 flex items-center justify-center bg-green-600 text-white text-lg font-bold z-[100] shadow-lg transition-transform duration-300 lg:hidden
              ${isSlidingUp ? 'animate-slideUpMobile' : ''}
              ${isSlidingDown ? 'animate-slideDownMobile' : ''}`}
            style={{ borderRadius: 0, boxShadow: '0 -4px 24px 0 rgba(0,0,0,0.12)' }}
          >
            تمت الاضافة بنجاح
          </div>
          {/* Desktop: previous style */}
          <div
            className={`hidden lg:flex fixed right-6 bottom-6 px-4 py-3 bg-green-600 text-white rounded-2xl shadow-lg z-[100] text-lg font-bold animate-slideUp`}
            style={{ borderRadius: '1.5rem', boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)' }}
          >
            تمت الاضافة بنجاح
          </div>
        </>
      )}
    </div>
  );
} 
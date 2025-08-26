"use client";
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getErrorMessage, getFallbackContent } from '@/lib/fallback-content';
import { WEB_CONSTANTS } from '@/app/web_constantsthe';
import ProductCard from './ProductCard';

interface OfflineErrorPageProps {
  errorType: 'offline' | 'apiError' | 'timeout';
  onRetry?: () => void;
  showFallbackProducts?: boolean;
}

export default function OfflineErrorPage({ 
  errorType, 
  onRetry, 
  showFallbackProducts = false 
}: OfflineErrorPageProps) {
  const { language } = useLanguage();
  const [isRetrying, setIsRetrying] = useState(false);
  const errorMessage = getErrorMessage(errorType, language);
  const fallbackContent = getFallbackContent(language);

  const handleRetry = async () => {
    if (!onRetry) {
      window.location.reload();
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  const handleContact = () => {
    window.open(`https://wa.me/96592272809`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Message Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              {errorType === 'offline' ? (
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                </svg>
              ) : errorType === 'timeout' ? (
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {errorMessage.title}
            </h1>

            {/* Error Description */}
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {errorMessage.message}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                style={{ backgroundColor: WEB_CONSTANTS.primaryColor }}
              >
                {isRetrying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    {language === 'ar' ? 'جاري المحاولة...' : 'Retrying...'}
                  </>
                ) : (
                  errorMessage.action
                )}
              </button>

              {errorType !== 'timeout' && (
                <button
                  onClick={handleRefreshPage}
                  className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
                >
                  {language === 'ar' ? 'تحديث الصفحة' : 'Refresh Page'}
                </button>
              )}

              {errorType === 'apiError' && 'contact' in errorMessage && (
                <button
                  onClick={handleContact}
                  className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
                >
                  {(errorMessage as any).contact}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fallback Products Section */}
      {showFallbackProducts && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === 'ar' ? 'منتجات عينة' : 'Sample Products'}
            </h2>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'تصفح هذه المنتجات العينة حتى نستعيد الاتصال'
                : 'Browse these sample products while we restore connection'
              }
            </p>
          </div>

          {/* Sample Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10 justify-items-center max-w-6xl mx-auto">
            {fallbackContent.products.slice(0, 6).map((product: any) => (
              <div key={product.id} className="relative">
                {/* Overlay to indicate this is sample data */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {language === 'ar' ? 'عينة' : 'Sample'}
                  </span>
                </div>
                
                <ProductCard
                  product={{
                    ...product,
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: '/awis.png', // Use local fallback image
                    slug: `sample-${product.id}`,
                    thumbnails: ['/awis.png']
                  }}
                  config={fallbackContent.config}
                />
              </div>
            ))}
          </div>

          {/* Store Contact Info */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {fallbackContent.store.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {fallbackContent.store.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href={fallbackContent.store.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`tel:${fallbackContent.store.phone}`}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {fallbackContent.store.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
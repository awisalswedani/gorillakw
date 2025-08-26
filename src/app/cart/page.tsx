'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import { formatPrice, getConfig } from '@/utils/api';
import CartIcon from '@/components/CartIcon';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../i18n';
import { WEB_CONSTANTS } from '../web_constantsthe';
import Spinner from '../../components/Spinner';
import { cache } from '@/lib/cache';

export default function CartPage() {
  const { state, updateQuantity, removeFromCart, loadCart } = useCart();
  const { language } = useLanguage();
  const [config, setConfig] = useState<any>(null);
  const router = useRouter();

  // Force re-render on language change
  const [langRerender, setLangRerender] = useState(0);
  useEffect(() => { setLangRerender(l => l + 1); }, [language]);

  // Load config for price formatting with caching
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Try to get cached config first
        const cached = cache.get('config', 'config', language);
        
        if (cached.data && !cached.isStale) {
          setConfig(cached.data);
          return;
        }

        // If offline and have cached data (even stale), use it
        if (cache.isOffline() && cached.data) {
          setConfig(cached.data);
          return;
        }

        // Fetch fresh data using the cached API function
        const data = await getConfig();
        setConfig(data);
      } catch (error) {
        console.error('Failed to load config:', error);
        // Try to use any cached data as fallback
        const cached = cache.get('config', 'config', language);
        if (cached.data) {
          setConfig(cached.data);
        }
      }
    };
    loadConfig();
  }, [language]);

  // Reload cart when language changes to update product names
  useEffect(() => {
    loadCart();
  }, [language]);

  // Scroll lock for empty cart
  useEffect(() => {
    if (state.items.length === 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [state.items]);

  const handleQuantityChange = async (cartId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(cartId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (cartId: number) => {
    try {
      await removeFromCart(cartId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const getImageUrl = (item: any) => {
    // Try to get image from product info first, then fallback to thumbnail
    if (item.product?.thumbnail_full_url?.path) {
      return item.product.thumbnail_full_url.path;
    }
    if (item.thumbnail) {
      return `https://awisapp.com/storage/app/public/product/thumbnail/${item.thumbnail}`;
    }
    return '/placeholder-product.jpg';
  };

  // Helper to get localized product name from translations array
  function getLocalizedProductName(item: any, language: string) {
    const product = item.product || {};
    if (product.translations && Array.isArray(product.translations)) {
      if (language === 'ar') {
        const t = product.translations.find((tr: any) => (tr.locale === 'kw' || tr.locale === 'ar') && tr.key === 'name');
        if (t && t.value) return t.value;
      } else {
        const t = product.translations.find((tr: any) => tr.locale === 'en' && tr.key === 'name');
        if (t && t.value) return t.value;
      }
    }
    // Fallbacks
    if (language === 'ar') return product.name_ar || product.name || item.name;
    return product.name || item.name;
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center py-2 border-b border-gray-100 min-h-[48px]">
              <Link href="/" aria-label="Back to home" className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm focus:outline-none" style={{ boxShadow: 'none' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: WEB_CONSTANTS.secondaryColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="mx-auto flex flex-col items-center w-full">
                <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs md:max-w-lg text-center w-full mt-1">{language === 'ar' ? 'قم بمراجعة طلبك' : i18n.t('review_order')}</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center flex-col">
            <Spinner size={56} className="mb-4" />
            {cache.isOffline() && (
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'تحميل البيانات المحفوظة...' : 'Loading cached data...'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{language === 'ar' ? 'خطأ:' : 'Error:'} {state.error}</p>
            {cache.isOffline() && (
              <p className="text-orange-600 mt-2">
                {language === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection'}
              </p>
            )}
            <button 
              onClick={loadCart}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {language === 'ar' ? 'إعادة المحاولة' : i18n.t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Bar: only show on mobile */}
        <header className="bg-white shadow-sm block md:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center py-2 border-b border-gray-100 min-h-[48px]">
              <Link href="/" aria-label="Back to home" className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm focus:outline-none" style={{ boxShadow: 'none' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: WEB_CONSTANTS.secondaryColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="mx-auto flex flex-col items-center w-full">
                <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs text-center w-full mt-1">{language === 'ar' ? 'سلة التسوق' : i18n.t('cart')}</h1>
              </div>
            </div>
          </div>
        </header>
        {/* Body: below bar on mobile, centered on desktop */}
        <div
          className="flex-1 w-full px-4 py-8 md:py-12 flex flex-col items-center md:justify-center"
          dir="rtl"
        >
          <div className="w-full max-w-md mx-auto flex flex-col items-center">
            <Image
              src="/bag-dark.png"
              alt="سلة التسوق فارغة"
              width={96}
              height={96}
              className="mx-auto mb-6 w-24 h-24 md:w-32 md:h-32 object-contain"
              priority
            />
            <div className="text-2xl md:text-3xl font-bold mb-3 text-center" style={{ color: '#222' }}>{language === 'ar' ? 'سلة التسوق الخاصة بك فارغة' : i18n.t('cart_empty')}</div>
            <div className="text-base md:text-lg mb-8 text-center" style={{ color: '#666' }}>{language === 'ar' ? 'ابدأ التسوق واختر المنتج المناسب' : i18n.t('start_shopping_message')}</div>
            <Link
              href="/"
              className="inline-block font-bold rounded-lg px-8 py-3 text-lg transition-colors shadow-md focus:outline-none"
              style={{ background: WEB_CONSTANTS.primaryColor, color: 'white' }}
            >
              {language === 'ar' ? 'ابدأ التسوق' : i18n.t('start_shopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  } else {
    // Restore scrolling when cart is not empty
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center py-2 border-b border-gray-100 min-h-[48px]">
            <Link href="/" aria-label="Back to home" className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm focus:outline-none" style={{ boxShadow: 'none' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: WEB_CONSTANTS.secondaryColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="mx-auto flex flex-col items-center w-full">
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs md:max-w-lg text-center w-full mt-1">{language === 'ar' ? 'قم بمراجعة طلبك' : i18n.t('review_order')}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? 'عناصر السلة' : i18n.t('cart_items')} ({state.totalItems})
                </h2>
                
                <div className="space-y-4" key={langRerender}>
                  {state.items.map((item) => {
                    const isRTL = language === 'ar';
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg bg-white shadow-sm ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                        dir="ltr"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border bg-gray-50 flex items-center justify-center">
                          <Image
                            src={getImageUrl(item)}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        {/* Product Info */}
                        <div className="flex flex-col flex-1 min-w-0">
                          {/* Product Name */}
                          <div className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}> 
                            <span className="font-semibold text-base mb-2 truncate inline-block max-w-full" style={{ color: '#222' }}>
                              {getLocalizedProductName(item, language)}
                            </span>
                          </div>
                          {/* Quantity Controls, Delete, Price */}
                          <div className={`flex items-center gap-2 mt-auto w-full ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-red-400 flex items-center justify-center text-red-700 text-lg font-bold disabled:text-gray-300 disabled:bg-gray-50"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-base font-medium" style={{ color: '#222' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-red-400 flex items-center justify-center text-red-700 text-lg font-bold"
                            >
                              +
                            </button>
                            {/* Delete Icon */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50 text-red-600"
                              title={isRTL ? 'حذف' : i18n.t('delete')}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            {/* Price */}
                            <span className="text-base font-bold" style={{ color: '#222' }}>
                              {formatPrice((item.price - item.discount) * item.quantity, config, language)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#222' }}>{language === 'ar' ? 'ملخص الطلب' : i18n.t('order_summary')}</h2>
              
              <div className="space-y-3">
                <ul className={`divide-y ${language === 'ar' ? 'divide-[#333]' : 'divide-gray-200'} mb-4`}>
                  {state.items.map((item) => (
                    <li key={item.id} className="py-2 flex justify-between items-center">
                      <span className="text-sm" style={{ color: '#222' }}>{getLocalizedProductName(item, language)} × {item.quantity}</span>
                      <span className="text-sm font-medium" style={{ color: '#222' }}>{formatPrice((item.price - item.discount) * item.quantity, config, language)}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span style={{ color: '#222' }}>{language === 'ar' ? 'المجموع' : i18n.t('total')}</span>
                    <span style={{ color: '#222' }}>{formatPrice(state.total, config, language)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                className="w-full py-3 px-4 rounded-md transition-colors mt-6"
                style={{ background: WEB_CONSTANTS.primaryColor, color: 'white' }}
                onClick={() => router.push('/checkout')}
              >
                {language === 'ar' ? 'إتمام الطلب' : i18n.t('proceed_to_checkout')}
              </button>
              
              <Link 
                href="/products"
                className="block w-full text-center mt-4"
                style={{ color: WEB_CONSTANTS.primaryColor }}
              >
                {language === 'ar' ? 'مواصلة التسوق' : i18n.t('continue_shopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
} 
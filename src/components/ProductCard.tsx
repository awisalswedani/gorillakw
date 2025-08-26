'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useCart } from './CartContext';
import { formatPrice } from '@/utils/api';
import { useRouter } from 'next/navigation';
import i18n from '../i18n';
import { useLanguage } from '../context/LanguageContext';
import { WEB_CONSTANTS } from '../app/web_constantsthe';

interface ProductCardProps {
  product: any;
  config: any;
  language?: string;
}

export default function ProductCard({ product, config, language: propLanguage }: ProductCardProps) {
  const { addToCart } = useCart();
  const { direction, language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage;
  const [isAddingAdd, setIsAddingAdd] = useState(false);
  const [isAddingBuy, setIsAddingBuy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  const [isSlidingDown, setIsSlidingDown] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();
  const isOutOfStock = product.current_stock <= 0;



  // Add to cart only (no redirect)
  const handleAddToCartOnly = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setIsAddingAdd(true);
    try {
      await addToCart(product.id, 1);
      setShowSuccess(true);
      setIsSlidingUp(true);
      setIsSlidingDown(false);
      setTimeout(() => {
        setIsSlidingUp(false);
        setIsSlidingDown(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsSlidingDown(false);
        }, 350); // slide down duration
      }, 2000); // visible duration
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingAdd(false);
    }
  };

  // Add to cart and go to cart
  const handleBuyNow = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setIsAddingBuy(true);
    try {
      await addToCart(product.id, 1);
      router.push('/cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingBuy(false);
    }
  };

  // Get the correct image URL
  const imageUrl = product.thumbnail_full_url?.path || 
                  (product.images_full_url && product.images_full_url.length > 0 ? product.images_full_url[0].path : null);

  // Calculate the final price based on discount type
  const calculateFinalPrice = () => {
    const unitPrice = parseFloat(product.unit_price) || 0;
    const discount = parseFloat(product.discount) || 0;
    
    if (!discount || discount <= 0) return unitPrice;
    
    // Check if discount is percentage or flat
    if (product.discount_type === 'percentage') {
      return unitPrice - (unitPrice * discount / 100);
    } else {
      // Flat discount
      return unitPrice - discount;
    }
  };

  const finalPrice = calculateFinalPrice();
  const formattedPrice = formatPrice(finalPrice, config, language);

  // Determine if the product has variants
  const hasVariants = (product.colors_formatted && product.colors_formatted.length > 0) || (product.choice_options && product.choice_options.length > 0);

  function getLocalizedProductName(product: any, language: string) {
    if (language === 'ar' && product.translations) {
      const t = product.translations.find(
        (tr: any) => tr.locale === 'kw' && tr.key === 'name'
      );
      if (t && t.value) return t.value;
    } else if (language === 'en' && product.translations) {
      const t = product.translations.find(
        (tr: any) => tr.locale === 'en' && tr.key === 'name'
      );
      if (t && t.value) return t.value;
    }
    return product.name;
  }

  return (
    <div
      className={`bg-white border-none shadow-none rounded-md p-0 flex flex-col items-center w-full ${direction}`}
      style={{ minWidth: 150, maxWidth: '100%' }}
      dir={direction}
    >
      <Link href={`/product/${product.slug}`} className="w-full block">
        <div className={`relative w-full aspect-square bg-white rounded-md border border-gray-200 overflow-hidden flex items-center ${direction === 'rtl' ? 'justify-end' : 'justify-start'} hover:shadow-lg transition-shadow duration-200`}> 
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-contain rounded-md"
              style={{ border: '1px solid #eee' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Discount Badge */}
          {product.discount && Number(product.discount) > 0 && (
            <span
              className={`absolute top-2 ${direction === 'rtl' ? 'right-2' : 'left-2'} bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md z-10 shadow border border-white opacity-95 select-none pointer-events-none flex items-center gap-1`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" clipRule="evenodd" />
              </svg>
              <span>{language === 'ar' ? 'مخفض' : 'SALE'}</span>
            </span>
          )}
          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <span
              className={`absolute ${product.discount && Number(product.discount) > 0 ? 'top-12' : 'top-2'} ${direction === 'rtl' ? 'right-2' : 'left-2'} bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full z-10 shadow border border-white opacity-95 select-none pointer-events-none`}
              style={{ letterSpacing: '0.03em' }}
            >
              {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
            </span>
          )}
        </div>
      </Link>
      <div className="w-full flex-1 flex flex-col items-center px-2 pt-2 pb-3">
        <Link href={`/product/${product.slug}`} className="w-full block">
          <h3 className={`text-sm sm:text-base lg:text-lg font-medium text-black mb-1 truncate w-full ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>{getLocalizedProductName(product, language)}</h3>
        </Link>
        <div className={`flex items-center gap-2 mb-3 w-full ${direction === 'rtl' ? 'justify-end flex-row-reverse' : 'justify-start'}`}> 
          <span className="text-base sm:text-lg lg:text-xl font-bold text-black">
            {formattedPrice}
          </span>
          {product.discount && Number(product.discount) > 0 ? (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.unit_price, config, language)}
            </span>
          ) : null}
        </div>
        <div className={`flex w-full gap-2 mt-auto ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          {hasVariants ? (
            <Link href={`/product/${product.slug}`} className="flex-1">
              <button
                className="w-full border rounded-md py-1.5 text-sm font-medium transition-colors bg-transparent"
                style={{ borderColor: WEB_CONSTANTS.primaryColor, color: WEB_CONSTANTS.primaryColor }}
                type="button"
              >
                {language === 'ar' ? 'أضف' : 'Add'}
              </button>
            </Link>
          ) : (
            <button
              onClick={handleAddToCartOnly}
              disabled={isAddingAdd || isAddingBuy || isOutOfStock}
              className="flex-1 border rounded-md py-1.5 text-sm font-medium transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ borderColor: WEB_CONSTANTS.primaryColor, color: WEB_CONSTANTS.primaryColor }}
              type="button"
            >
              {isAddingAdd ? (
                <svg className="animate-spin h-5 w-5" style={{ color: WEB_CONSTANTS.primaryColor }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                language === 'ar' ? 'أضف' : 'Add'
              )}
            </button>
          )}
          {hasVariants ? (
            <Link href={`/product/${product.slug}`} className="flex-1">
              <button
                className="w-full text-white rounded-md py-1.5 text-sm font-medium transition-colors"
                style={{ background: WEB_CONSTANTS.primaryColor }}
                type="button"
              >
                {language === 'ar' ? 'اشتري' : 'Buy'}
              </button>
            </Link>
          ) : (
            <button
              onClick={handleBuyNow}
              disabled={isAddingAdd || isAddingBuy || isOutOfStock}
              className="flex-1 text-white rounded-md py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ background: WEB_CONSTANTS.primaryColor }}
              type="button"
            >
              {isAddingBuy ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                language === 'ar' ? 'اشتري' : 'Buy'
              )}
            </button>
          )}
        </div>
      </div>
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
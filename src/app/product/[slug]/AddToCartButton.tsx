'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartContext';
import { formatPrice } from '@/utils/api';
import { useLanguage } from '@/context/LanguageContext';
import i18n from '@/i18n';
import { WEB_CONSTANTS } from '../../web_constantsthe';

interface AddToCartButtonProps {
  product: any;
  config: any;
  selectedColor?: string;
  selectedOptions?: { [key: string]: string };
  selectedVariant?: any;
  allSelected?: boolean;
  onSelectionError?: () => void;
  onAddToCartSuccess?: () => void;
}

export default function AddToCartButton({ product, config, selectedColor, selectedOptions, selectedVariant, allSelected = true, onSelectionError, onAddToCartSuccess }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { language } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [shake, setShake] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product.current_stock || 999)) {
      setQuantity(newQuantity);
    }
  };

  const variantPrice = selectedVariant ? selectedVariant.price : product.unit_price;
  const variantStock = selectedVariant ? selectedVariant.qty : product.current_stock;

  const handleAddToCart = async () => {
    if (variantStock <= 0) return;
    if (!allSelected) {
      if (onSelectionError) onSelectionError();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setIsAdding(true);
    try {
      await addToCart(product.id, quantity, selectedColor, selectedOptions, selectedVariant);
      if (onAddToCartSuccess) onAddToCartSuccess();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = variantStock <= 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quantity Selector */}
      <div className="flex items-center space-x-3">
        <label className="text-sm sm:text-base font-medium text-gray-700">{language === 'ar' ? 'الكمية' : i18n.t('quantity')}:</label>
        <div className="flex items-center border border-gray-300 rounded-md w-fit">
          <button
            type="button"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="px-3 py-2 sm:px-4 sm:py-2.5 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={variantStock || 999}
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-16 sm:w-20 text-center border-0 focus:ring-0 text-sm sm:text-base py-2 sm:py-2.5"
            disabled={isOutOfStock}
          />
          <button
            type="button"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= (product.current_stock || 999) || isOutOfStock}
            className="px-3 py-2 sm:px-4 sm:py-2.5 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAdding}
        className={`w-full transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2`}
        style={{
          background: WEB_CONSTANTS.primaryColor,
          color: 'white',
          borderRadius: '0.5rem',
          padding: '0.75rem 1.5rem',
          fontWeight: '600',
          fontSize: '1rem',
          transition: 'all 0.2s ease-in-out',
          opacity: isOutOfStock || isAdding ? 0.6 : 1,
          cursor: isOutOfStock || isAdding ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: !allSelected ? '2px solid #dc2626' : 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          minHeight: '3rem',
        }}
        title={!allSelected ? (language === 'ar' ? 'يرجى اختيار جميع الخيارات المطلوبة' : 'Please select all required options') : ''}
      >
        {isAdding ? (
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" style={{ color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-sm sm:text-base">{language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}</span>
          </div>
        ) : isOutOfStock ? (
          <span className="text-sm sm:text-base font-medium">{language === 'ar' ? 'غير متوفر' : i18n.t('out_of_stock')}</span>
        ) : (
          <span className="text-sm sm:text-base font-bold">{language === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}</span>
        )}
      </button>


      <style jsx>{`
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
} 
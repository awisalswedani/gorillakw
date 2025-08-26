'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from './CartContext';
import { formatPrice } from '@/utils/api';
import { useLanguage } from '../context/LanguageContext';
import React from 'react';

interface ProductCardProductsProps {
  product: any;
  config: any;
}

export default function ProductCardProducts({ product, config }: ProductCardProductsProps) {
  const { addToCart } = useCart();
  const { direction, language } = useLanguage();
  const isOutOfStock = product.current_stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addToCart(product.id, 1);
      // Show success feedback (you could add a toast notification here)
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative group bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      <div className="relative">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {isOutOfStock && (
          <span
            className={`absolute top-2 ${direction === 'rtl' ? 'right-2' : 'left-2'} bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full z-10 shadow border border-white opacity-95 select-none pointer-events-none`}
            style={{ letterSpacing: '0.03em' }}
          >
            {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.details ? product.details.replace(/<[^>]*>/g, '') : product.description || 'No description available'}
          </p>
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-green-600">
                {formatPrice(product.unit_price, config, language)}
              </span>
              {product.discount && product.discount > 0 ? (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(parseFloat(product.unit_price) + parseFloat(product.discount), config, language)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < (product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {(product.reviews_count && product.reviews_count > 0) && (
                <span className="ml-1 text-sm text-gray-600">({product.reviews_count})</span>
              )}
            </div>
          </div>
        <button
          className={`w-full py-2 rounded transition font-semibold text-sm mt-2 ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? (language === 'ar' ? 'غير متوفر' : 'Out of Stock') : (language === 'ar' ? 'أضف' : 'Add')}
        </button>
      </div>
    </div>
  );
} 
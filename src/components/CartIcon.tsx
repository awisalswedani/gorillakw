'use client';

import Link from 'next/link';
import { useCart } from './CartContext';
import { useLanguage } from '../context/LanguageContext';
import i18n from '../i18n';
import { useState } from 'react';

interface CartIconProps {
  variant?: 'light' | 'dark';
  noLink?: boolean;
}

export default function CartIcon({ variant = 'light', noLink = false }: CartIconProps) {
  const { state } = useCart();
  const { language } = useLanguage();
  const iconSrc = variant === 'dark' ? '/bag-dark.png' : '/bag-light.png';

  // Format price for tooltip
  const formatTooltipPrice = (price: number) => {
    if (price <= 0) return 'Free';
    const isRTL = language === 'ar';
    const symbol = isRTL ? 'دك' : 'KD';
    const formattedPrice = price.toFixed(2);
    return isRTL ? `${formattedPrice} ${symbol}` : `${symbol} ${formattedPrice}`;
  };

  const cartContent = (
    <div className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-blue-600 transition-colors relative group cursor-pointer">
      <img src={iconSrc} alt="Cart" className="w-9 h-9" />
      {/* Cart Count Badge */}
      {state.totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {state.totalItems > 99 ? '99+' : state.totalItems}
        </span>
      )}
      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-3">
          <div className="text-sm font-medium text-gray-900">
            {i18n.t('cart_tooltip')} ({state.totalItems} {state.totalItems === 1 ? i18n.t('item') : i18n.t('items')})
          </div>
          {state.items.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="font-medium">
                {i18n.t('total')}: {formatTooltipPrice(state.total)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (noLink) {
    return cartContent;
  }

  return (
    <Link href="/cart">
      {cartContent}
    </Link>
  );
} 
"use client";
import Link from 'next/link';
import Image from 'next/image';
import CartIcon from './CartIcon';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateGuestId, SELLER_ID } from '@/utils/api';
import i18n from '../i18n';
import { useLanguage } from '../context/LanguageContext';
import { WEB_CONSTANTS } from '../app/web_constantsthe';

export default function Header({ seller }: { seller: any }) {
  const { language, setLanguage, direction } = useLanguage();
  const shopName = seller?.seller?.shop?.name || `${seller?.seller?.f_name || ''} ${seller?.seller?.l_name || ''}` || 'Seller Store';
  const logo = seller?.seller?.image_full_url?.path;
  
  // Get the correct seller ID from the seller prop or fallback to environment variable
  const currentSellerId = seller?.seller?.id || SELLER_ID;
  const [search, setSearch] = useState('');
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Professional debounced search with proper loading states
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }
    
    setSearching(true);
    setShowDropdown(true);
    const handler = setTimeout(async () => {
      try {
        const guestId = await getOrCreateGuestId();
        const searchUrl = `https://awisapp.com/api/v1/seller/${currentSellerId}/products?q=${encodeURIComponent(search.trim())}&limit=100&guest_id=${guestId}`;
        
        const res = await fetch(searchUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': language,
            'X-Language': language,
            'lang': language === 'ar' ? 'kw' : 'en', // Add the lang header that backend expects
          },
        });
        
        const data = await res.json();
        
        // If no results, try alternative search approaches
        if (!data.products || data.products.length === 0) {
          console.log('No results found, trying alternative search...');
          
          // Try without guest_id parameter
          try {
            const altRes = await fetch(`https://awisapp.com/api/v1/seller/${currentSellerId}/products?search=${encodeURIComponent(search.trim())}&limit=8`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept-Language': language,
                'X-Language': language,
                'lang': language === 'ar' ? 'kw' : 'en',
              },
            });
            const altData = await altRes.json();
            console.log('Alternative search response:', altData);
            if (altData.products && altData.products.length > 0) {
              setSuggestions(altData.products);
              return;
            }
          } catch (error) {
            console.log('Alternative search failed:', error);
          }
          
          // Try with different search parameter format
          try {
            const altRes2 = await fetch(`https://awisapp.com/api/v1/seller/${currentSellerId}/products?q=${encodeURIComponent(search.trim())}&limit=8&guest_id=${guestId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept-Language': language,
                'X-Language': language,
                'lang': language === 'ar' ? 'kw' : 'en',
              },
            });
            const altData2 = await altRes2.json();
            console.log('Alternative search with q parameter:', altData2);
            console.log('Q parameter search returned:', altData2.products?.length || 0, 'products');
            if (altData2.products && altData2.products.length > 0) {
              setSuggestions(altData2.products);
              return;
            }
          } catch (error) {
            console.log('Alternative search with q parameter failed:', error);
          }
          
          // Try with 'query' parameter
          try {
            const queryRes = await fetch(`https://awisapp.com/api/v1/seller/${currentSellerId}/products?query=${encodeURIComponent(search.trim())}&limit=8&guest_id=${guestId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept-Language': language,
                'X-Language': language,
                'lang': language === 'ar' ? 'kw' : 'en',
              },
            });
            const queryData = await queryRes.json();
            console.log('Query parameter search response:', queryData);
            console.log('Query parameter search returned:', queryData.products?.length || 0, 'products');
            if (queryData.products && queryData.products.length > 0) {
              setSuggestions(queryData.products);
              return;
            }
          } catch (error) {
            console.log('Query parameter search failed:', error);
          }
          
          // Try the shopView endpoint format
          try {
            const shopViewRes = await fetch(`https://awisapp.com/api/v1/shopView/${currentSellerId}/products?search=${encodeURIComponent(search.trim())}&limit=8`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept-Language': language,
                'X-Language': language,
                'lang': language === 'ar' ? 'kw' : 'en',
              },
            });
            const shopViewData = await shopViewRes.json();
            console.log('ShopView search response:', shopViewData);
            if (shopViewData.products && shopViewData.products.length > 0) {
              setSuggestions(shopViewData.products);
              return;
            }
          } catch (error) {
            console.log('ShopView search failed:', error);
          }
        }
        
        // Implement client-side filtering since the API doesn't filter by search term
        if (data.products && data.products.length > 0) {
          const searchTerm = search.trim().toLowerCase();
          const filteredProducts = data.products.filter((product: any) => {
            const productName = getLocalizedProductName(product, language).toLowerCase();
            const productDescription = (product.details || '').toLowerCase();
            const productCategory = (product.category?.name || '').toLowerCase();
            
            return productName.includes(searchTerm) || 
                   productDescription.includes(searchTerm) || 
                   productCategory.includes(searchTerm);
          });
          
          // Only show results if we have matching products
          if (filteredProducts.length > 0) {
            setSuggestions(filteredProducts.slice(0, 8));
          } else {
            setSuggestions([]);
          }
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500); // Increased debounce time for better UX
    return () => clearTimeout(handler);
  }, [search, currentSellerId, language]);

  // Hide dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  // Handle product selection from dropdown
  const handleProductSelect = (product: any) => {
    console.log('Product selected:', product);
    setShowDropdown(false);
    setSearch('');
    router.push(`/product/${product.slug || product.id}`);
  };

  // Function to get localized product name
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

  // Language switcher logic
  const langChar = language === 'ar' ? 'E' : 'ع';
  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  return (
    <header className="w-full z-50 fixed top-0 left-0 right-0 border-b shadow-lg" style={{ background: WEB_CONSTANTS.primaryColor }}>
      {/* Top bar below header */}
      <div style={{ background: WEB_CONSTANTS.primaryColor, height: '4px', width: '100%' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between py-3" dir={direction}>
          <div className="flex items-center gap-x-6 min-w-0">
            <Link href="/" className="flex items-center group min-w-0" aria-label="Go to home page">
              {logo && (
                <Image
                  src={logo}
                  alt={shopName + ' - Store Logo'}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full bg-white border border-gray-200 group-hover:opacity-80 transition-opacity"
                  priority
                />
              )}
              <span className="mr-3 text-xl font-bold text-white truncate max-w-xs group-hover:text-gray-200 transition-colors">
                {shopName}
              </span>
            </Link>
          </div>
          <form onSubmit={e => e.preventDefault()} className="flex-1 mx-8 max-w-2xl relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                className={`w-full rounded-md py-2 ${direction === 'rtl' ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'} text-black placeholder:text-black/60 bg-white focus:ring-2 focus:ring-black focus:outline-none text-lg shadow`}
                placeholder={i18n.t('search_placeholder')}
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                dir={direction}
                autoComplete="off"
              />
              <button type="submit" className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-black hover:text-black`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-2-2" strokeLinecap="round" />
                </svg>
              </button>
              {/* Dropdown */}
              {showDropdown && (searching || suggestions.length > 0) && (
                <div ref={dropdownRef} className="absolute right-0 left-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-80 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center justify-center py-4 text-gray-500">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" style={{ stroke: WEB_CONSTANTS.primaryColor }}></circle>
                        <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" style={{ fill: WEB_CONSTANTS.primaryColor }}></path>
                      </svg>
                      {i18n.t('searching')}
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="py-4 text-center text-gray-400">{i18n.t('no_results')}</div>
                  ) : (
                    suggestions.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-right cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                      >
                        {product.thumbnail_full_url?.path && (
                          <Image src={product.thumbnail_full_url.path} alt={getLocalizedProductName(product, language)} width={40} height={40} className="rounded" />
                        )}
                        <span className="flex-1 truncate">{getLocalizedProductName(product, language)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </form>
          <nav className="hidden lg:flex items-center gap-x-6">
            <Link href="/about" className="text-white hover:text-gray-200 text-base font-medium transition-colors">{language === 'ar' ? 'من نحن' : i18n.t('about')}</Link>
            <Link href="/privacy" className="text-white hover:text-gray-200 text-base font-medium transition-colors">{language === 'ar' ? 'سياسة الخصوصية' : i18n.t('privacy_policy')}</Link>
          </nav>
          <button onClick={toggleLanguage} className="ml-6 text-white text-lg font-bold focus:outline-none hover:text-gray-200 transition-colors" style={{background: 'none', border: 'none', boxShadow: 'none'}}>{langChar}</button>
          <div className="ml-4">
            <CartIcon />
          </div>
        </div>
        {/* Mobile Header: single row with logo, search, lang, cart */}
        <div className="flex md:hidden items-center justify-between py-3 gap-x-2" dir={direction}>
          {/* Seller logo only on the right */}
          <Link href="/" className="flex items-center group min-w-0 flex-shrink-0" aria-label="Go to home page">
            {logo && (
              <Image
                src={logo}
                alt={shopName + ' - Store Logo'}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full bg-white border border-gray-200 group-hover:opacity-80 transition-opacity"
                priority
              />
            )}
          </Link>
          {/* Search field */}
          <form onSubmit={e => e.preventDefault()} className="flex-1 mx-2 relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                className={`w-full rounded-md py-2 ${direction === 'rtl' ? 'pl-4 pr-10 text-right' : 'pl-10 pr-4 text-left'} text-black placeholder:text-black/60 bg-white focus:ring-2 focus:ring-black focus:outline-none text-base shadow`}
                placeholder={i18n.t('search_placeholder')}
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                dir={direction}
                autoComplete="off"
              />
              <button type="submit" className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-black hover:text-black`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-2-2" strokeLinecap="round" />
                </svg>
              </button>
              {/* Dropdown */}
              {showDropdown && (searching || suggestions.length > 0) && (
                <div ref={dropdownRef} className="absolute right-0 left-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-80 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center justify-center py-4 text-gray-500">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" style={{ stroke: WEB_CONSTANTS.primaryColor }}></circle>
                        <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" style={{ fill: WEB_CONSTANTS.primaryColor }}></path>
                      </svg>
                      {i18n.t('searching')}
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="py-4 text-center text-gray-400">{i18n.t('no_results')}</div>
                  ) : (
                    suggestions.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-right cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                      >
                        {product.thumbnail_full_url?.path && (
                          <Image src={product.thumbnail_full_url.path} alt={getLocalizedProductName(product, language)} width={32} height={32} className="rounded" />
                        )}
                        <span className="flex-1 truncate">{getLocalizedProductName(product, language)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </form>
          {/* Language button */}
          <button onClick={toggleLanguage} className="text-white text-lg font-bold focus:outline-none hover:text-gray-200 transition-colors flex-shrink-0" style={{background: 'none', border: 'none', boxShadow: 'none'}}>{langChar}</button>
          {/* Cart icon */}
          <div className="flex-shrink-0">
            <CartIcon variant="light" />
          </div>
        </div>
      </div>
    </header>
  );
} 
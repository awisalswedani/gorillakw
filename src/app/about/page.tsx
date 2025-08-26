"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { WEB_CONSTANTS } from "../web_constantsthe";
import { getSellerInfo } from "../../utils/api";
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../i18n';
import Spinner from '../../components/Spinner';
import { cache } from '@/lib/cache';

export default function AboutPage() {
  const { language } = useLanguage();
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get cached seller info first
        const cached = cache.get('seller', 'seller', language);
        
        if (cached.data && !cached.isStale) {
          const sellerData = cached.data as any;
          const logoUrl = sellerData?.seller?.image_full_url?.path || sellerData?.seller?.shop?.logo_full_url?.path || null;
          setLogo(logoUrl);
          setLoading(false);
          return;
        }

        // If offline and have cached data (even stale), use it
        if (cache.isOffline() && cached.data) {
          const sellerData = cached.data as any;
          const logoUrl = sellerData?.seller?.image_full_url?.path || sellerData?.seller?.shop?.logo_full_url?.path || null;
          setLogo(logoUrl);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const seller = await getSellerInfo();
        const logoUrl = seller?.seller?.image_full_url?.path || seller?.seller?.shop?.logo_full_url?.path || null;
        setLogo(logoUrl);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch seller info:', error);
        // Try to use any cached data as fallback
        const cached = cache.get('seller', 'seller', language);
        if (cached.data) {
          const sellerData = cached.data as any;
          const logoUrl = sellerData?.seller?.image_full_url?.path || sellerData?.seller?.shop?.logo_full_url?.path || null;
          setLogo(logoUrl);
        }
        setLoading(false);
      }
    };

    fetchData();
    
    // Prevent scrolling
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    
    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [language]);

  // Helper to detect dark mode
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-[#181818]' : 'bg-gray-50'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Bar: only on mobile and tablet */}
      <header className={`${isDark ? 'bg-[#222]' : 'bg-white'} shadow-sm sticky top-0 z-40 w-full block lg:hidden`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`relative flex items-center py-2 border-b ${isDark ? 'border-[#333]' : 'border-gray-100'} min-h-[48px]`}>
            <Link href="/" aria-label="Back to home" className={`absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full ${isDark ? 'bg-[#222] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'} transition-colors shadow-sm focus:outline-none`} style={{ boxShadow: 'none' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: WEB_CONSTANTS.secondaryColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="mx-auto text-xl font-bold truncate max-w-xs text-center w-full" style={{ color: isDark ? '#fff' : '#222' }}>{language === 'ar' ? 'من نحن' : 'About'}</h1>
          </div>
        </div>
      </header>
      
      {/* Body: logo at top, then text block, responsive */}
      <main className="flex flex-col items-center w-full flex-1 justify-start px-4 pt-8 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center w-full h-[300px]">
            <Spinner size={48} className="mb-4" />
            {cache.isOffline() && (
              <p className="text-sm text-gray-500 mt-2">
                {language === 'ar' ? 'تحميل البيانات المحفوظة...' : 'Loading cached data...'}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center gap-6">
            {/* Seller Logo: always at top */}
            <div className="flex justify-center mb-4">
              <div className={`rounded-full border-4 shadow-lg flex items-center justify-center ${isDark ? 'border-[#222] bg-[#222]' : 'border-white bg-white'}`} style={{ width: 110, height: 110 }}>
                {logo && (
                  <Image
                    src={logo}
                    alt={language === 'ar' ? 'شعار المتجر' : 'Store Logo'}
                    width={100}
                    height={100}
                    className="rounded-full object-cover"
                    priority
                  />
                )}
              </div>
            </div>
            {/* About Block */}
            <div className={`w-full max-w-md rounded-lg shadow p-6 flex flex-col gap-6 ${isDark ? 'bg-[#222]' : 'bg-white'}`}>
              <div className={`text-lg leading-relaxed text-center font-medium whitespace-pre-line ${isDark ? 'text-white' : 'text-[#222]'}`}>{i18n.t('about_us_content')}</div>
            </div>
          </div>
        )}
      </main>
      <div className="h-20 lg:hidden" />
    </div>
  );
} 
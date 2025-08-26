"use client";
import { useEffect, useState } from 'react';
import { cache } from '@/lib/cache';
import { useLanguage } from '@/context/LanguageContext';
import i18n from '@/i18n';

export default function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRetryMessage, setShowRetryMessage] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Initial state
    setIsOffline(cache.isOffline());

    // Subscribe to online/offline status changes
    const unsubscribe = cache.onOnlineStatusChange((online) => {
      setIsOffline(!online);
      if (online) {
        // Show brief "back online" message
        setShowRetryMessage(true);
        setTimeout(() => setShowRetryMessage(false), 3000);
      }
    });

    return unsubscribe;
  }, []);

  if (!isOffline && !showRetryMessage) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {isOffline ? (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {language === 'ar' 
                ? 'لا يوجد اتصال بالإنترنت. يتم عرض المحتوى المحفوظ.' 
                : 'No internet connection. Showing cached content.'}
            </span>
          </div>
        </div>
      ) : showRetryMessage ? (
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {language === 'ar' 
                ? 'عاد الاتصال بالإنترنت. يتم تحديث المحتوى...' 
                : 'Back online. Refreshing content...'}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
} 
"use client";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import Header from '@/components/Header';
import { getSellerInfo } from '@/utils/api';
import MobileNavBar from "./MobileNavBar";
import { LanguageProvider } from '../context/LanguageContext';
import OfflineNotification from '@/components/OfflineNotification';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cache } from '@/lib/cache';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ClientLayout({ seller, children }: { seller: any, children: ReactNode }) {
  const pathname = usePathname();

  // Scroll to top when pathname changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Periodic cache cleanup and service worker registration
  useEffect(() => {
    // Clean cache on app start
    cache.cleanup();

    // Set up periodic cleanup every 30 minutes
    const cleanupInterval = setInterval(() => {
      cache.cleanup();
    }, 30 * 60 * 1000);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <LanguageProvider>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CartProvider>
          <OfflineNotification />
          <Header seller={seller} />
          {children}
          <MobileNavBar />
        </CartProvider>
      </body>
    </LanguageProvider>
  );
} 
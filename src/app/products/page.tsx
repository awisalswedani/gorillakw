"use client";
import { useEffect, useState } from 'react';
import { getSellerProducts, getConfig, getSellerCategories } from '@/utils/api';
import Image from 'next/image';
import Link from 'next/link';
import ProductCardProducts from '@/components/ProductCardProducts';
import CartIcon from '@/components/CartIcon';
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../i18n';

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { language } = useLanguage();
  const [params, setParams] = useState<any>({});
  const [config, setConfig] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [languageChangeLoading, setLanguageChangeLoading] = useState(false);

  // Parse search params
  useEffect(() => {
    const parseParams = async () => {
      const resolvedParams = await searchParams;
      const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : Array.isArray(resolvedParams.search) ? resolvedParams.search[0] : '';
      const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : Array.isArray(resolvedParams.category) ? resolvedParams.category[0] : '';
      const page = typeof resolvedParams.page === 'string' ? resolvedParams.page : Array.isArray(resolvedParams.page) ? resolvedParams.page[0] : '1';
      const limit = typeof resolvedParams.limit === 'string' ? resolvedParams.limit : Array.isArray(resolvedParams.limit) ? resolvedParams.limit[0] : '12';
      
      setParams({
        search,
        category,
        page,
        limit
      });
    };
    parseParams();
  }, [searchParams]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!params.limit) return; // Wait for params to be set
      
      setLoading(true);
      try {
        const apiParams = {
          limit: params.limit,
          offset: ((parseInt(params.page) - 1) * parseInt(params.limit)).toString(),
          ...(params.search ? { search: params.search } : {}),
          ...(params.category ? { category: params.category } : {}),
        };

        const [configRes, categoriesRes, productsRes] = await Promise.all([
          getConfig(),
          getSellerCategories(),
          getSellerProducts(apiParams)
        ]);

        setConfig(configRes);
        setCategories(categoriesRes || []);
        setProducts(productsRes.products || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  // Refresh data when language changes
  useEffect(() => {
    const refreshData = async () => {
      // Only refresh if we already have data (not on initial load)
      if (categories.length > 0) {
        setLanguageChangeLoading(true);
        try {
          const apiParams = {
            limit: params.limit,
            offset: ((parseInt(params.page) - 1) * parseInt(params.limit)).toString(),
            ...(params.search ? { search: params.search } : {}),
            ...(params.category ? { category: params.category } : {}),
          };

          const [configRes, categoriesRes, productsRes] = await Promise.all([
            getConfig(),
            getSellerCategories(),
            getSellerProducts(apiParams)
          ]);

          setConfig(configRes);
          setCategories(categoriesRes || []);
          setProducts(productsRes.products || []);
        } catch (error) {
          console.error('Failed to refresh data:', error);
        } finally {
          setLanguageChangeLoading(false);
        }
      }
    };
    
    refreshData();
  }, [language, params]);

  if (loading || languageChangeLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <svg className="animate-spin h-14 w-14 text-[#991b1b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'المنتجات' : 'Products'}
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/" className="text-gray-900 hover:text-gray-600">
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              <Link href="/products" className="text-blue-600 font-medium">
                {language === 'ar' ? 'المنتجات' : 'Products'}
              </Link>
              <Link href="/about" className="text-gray-900 hover:text-gray-600">
                {language === 'ar' ? 'من نحن' : 'About'}
              </Link>
              <Link href="/contact" className="text-gray-900 hover:text-gray-600">
                {language === 'ar' ? 'اتصل بنا' : 'Contact'}
              </Link>
              <CartIcon />
            </nav>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {language === 'ar' 
                  ? 'حاول تعديل البحث أو الفلتر للعثور على ما تبحث عنه.'
                  : 'Try adjusting your search or filter to find what you\'re looking for.'
                }
              </p>
            </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <ProductCardProducts key={product.id} product={product} config={config} />
                ))}
              </div>
          )}
        </div>
      </section>
      <div className="h-20 lg:hidden" />
    </div>
  );
} 
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../i18n';
import { trackOrder, formatPrice } from '../../utils/api';
import { WEB_CONSTANTS } from '../../app/web_constantsthe';

export default function OrderStatusPage() {
  const { language, direction } = useLanguage();
  const [orderCode, setOrderCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  // Load config for price formatting
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('https://awisapp.com/api/v1/config', {
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': language,
            'X-Language': language,
          },
        });
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();
  }, []);

  const handleTrackOrder = async () => {
    if (!orderCode.trim() || !phoneNumber.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال رمز الطلب ورقم الهاتف' : 'Please enter order code and phone number');
      return;
    }

    setLoading(true);
    setError(null);
    setOrderDetails(null);

    try {
      const result = await trackOrder(orderCode.trim(), phoneNumber.trim());
      if (result && result.length > 0) {
        setOrderDetails(result[0]); // Take the first order if multiple
      } else {
        setError(i18n.t('invalid_order_or_phone'));
      }
    } catch (error: any) {
      console.error('Track order error:', error);
      // Friendly error for 403 or invalid phone/order
      if (error?.message?.includes('Invalid Phone Number') || error?.message?.includes('403')) {
        setError(i18n.t('invalid_order_or_phone'));
      } else {
        setError(language === 'ar' ? 'حدث خطأ أثناء تتبع الطلب' : 'Error tracking order');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: { ar: string; en: string } } = {
      'pending': { ar: 'في الانتظار', en: 'Pending' },
      'confirmed': { ar: 'مؤكد', en: 'Confirmed' },
      'processing': { ar: 'قيد المعالجة', en: 'Processing' },
      'shipped': { ar: 'تم الشحن', en: 'Shipped' },
      'delivered': { ar: 'تم التوصيل', en: 'Delivered' },
      'cancelled': { ar: 'ملغي', en: 'Cancelled' },
    };
    const statusInfo = statusMap[status?.toLowerCase()] || { ar: status, en: status };
    return language === 'ar' ? statusInfo.ar : statusInfo.en;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      {/* Top Bar (same as product details) */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center py-2 border-b border-gray-100 min-h-[48px]">
            <Link href="/" aria-label="Back to home" className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm focus:outline-none" style={{ boxShadow: 'none' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: WEB_CONSTANTS.secondaryColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="mx-auto text-xl font-bold truncate max-w-xs md:max-w-lg text-center w-full" style={{ color: '#222' }}>
              {language === 'ar' ? 'حالة الطلب' : 'Order Status'}
            </h1>
          </div>
        </div>
      </header>
      {/* Body */}
      <main className="flex flex-col items-center px-4 pt-8 pb-12 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 flex flex-col gap-6">
          {!orderDetails ? (
            <>
              <p className="text-gray-700 text-center text-base md:text-lg font-medium">
                {language === 'ar' 
                  ? 'أدخل رمز الطلب المرفق بالأيميل، ورقم الهاتف لتتبع طلبك'
                  : 'Enter the order code attached to your email and phone number to track your order'
                }
              </p>
              
              {/* Order Code Input */}
              <div>
                <label className="block text-center text-gray-900 font-semibold text-base md:text-lg mb-1">
                  {i18n.t('order_code')}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md px-4 py-3 text-lg text-center focus:outline-none focus:ring-2"
                  style={{ border: `1.5px solid ${WEB_CONSTANTS.primaryColor}`, color: '#222', background: '#fff' }}
                  placeholder={language === 'ar' ? '------' : '------'}
                  value={orderCode}
                  onChange={e => setOrderCode(e.target.value)}
                  dir="ltr"
                  inputMode="text"
                  autoComplete="off"
                />
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-center text-gray-900 font-semibold text-base md:text-lg mb-1">
                  {i18n.t('phone_number')}
                </label>
                <input
                  type="tel"
                  className="w-full rounded-md px-4 py-3 text-lg text-center focus:outline-none focus:ring-2"
                  style={{ border: `1.5px solid ${WEB_CONSTANTS.primaryColor}`, color: '#222', background: '#fff' }}
                  placeholder={language === 'ar' ? '9xxxxxxx' : '9xxxxxxx'}
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-center text-sm">{error}</p>
                </div>
              )}

              <button
                className="w-full bg-[#991b1b] text-white py-3 px-4 rounded-md hover:bg-[#b24545] transition-colors text-lg font-bold mt-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: WEB_CONSTANTS.primaryColor }}
                type="button"
                onClick={handleTrackOrder}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                  </div>
                ) : (
                  i18n.t('tracking_order')
                )}
              </button>
            </>
          ) : (
            /* Order Details Display */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{i18n.t('order_details')}</h2>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(orderDetails.order?.order_status)}`}>
                  {getStatusText(orderDetails.order?.order_status)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">{i18n.t('order_code')}:</span>
                  <span className="font-bold text-gray-900">{orderDetails.order?.id}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">{i18n.t('order_date')}:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(orderDetails.order?.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">{i18n.t('payment_method')}:</span>
                  <span className={`font-medium px-2 py-1 rounded text-sm ${
                    orderDetails.order?.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {orderDetails.order?.payment_status === 'paid' 
                      ? i18n.t('paid')
                      : i18n.t('unpaid')
                    }
                  </span>
                </div>

                {orderDetails.order?.shipping_address_data && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{i18n.t('delivery_address')}:</h3>
                    <div className="text-gray-600 text-sm space-y-1">
                      <p>{orderDetails.order.shipping_address_data.contact_person_name}</p>
                      <p>{orderDetails.order.shipping_address_data.address}</p>
                      <p>{orderDetails.order.shipping_address_data.city}, {orderDetails.order.shipping_address_data.country}</p>
                      <p>{orderDetails.order.shipping_address_data.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                className="w-full bg-[#991b1b] text-white py-3 px-4 rounded-md hover:bg-[#b24545] transition-colors text-lg font-bold shadow"
                style={{ background: WEB_CONSTANTS.primaryColor }}
                onClick={() => {
                  setOrderDetails(null);
                  setError(null);
                  setOrderCode("");
                  setPhoneNumber("");
                }}
              >
                {i18n.t('track_another_order')}
              </button>
            </div>
          )}
        </div>
      </main>
      <div className="h-20 lg:hidden" />
    </div>
  );
} 
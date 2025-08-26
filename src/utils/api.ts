import { cachedApiCall } from '@/lib/cache';
import { resilientAPI } from '@/lib/resilient-api';

const BASE_URL = 'https://awisapp.com/api/v1';

// ⭐ CENTRALIZED SELLER CONFIGURATION ⭐
// To use this project for a different seller, only change the SELLER_ID here
// This single change will update all seller-related API calls throughout the project
export const SELLER_ID = process.env.NEXT_PUBLIC_SELLER_ID || process.env.SELLER_ID || '3';

// Helper function to get current language
function getCurrentLanguage(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'ar';
  }
  return 'ar';
}

export function getHeaders(): HeadersInit {
  const language = getCurrentLanguage();
  // Map frontend language to backend language code
  const backendLang = language === 'ar' ? 'kw' : 'en';
  return {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    'X-Language': language,
    'lang': backendLang, // Add the lang header that backend expects
  };
}

// Fetch guest_id from backend and store in localStorage if not present
export async function getOrCreateGuestId(forceNew = false): Promise<string> {
  if (typeof window !== 'undefined') {
    if (!forceNew) {
      let guestId = localStorage.getItem('guest_id');
      if (guestId) return guestId;
    }
    // Always get a new guest_id if forceNew or missing
    const res = await fetch('https://awisapp.com/api/v1/get-guest-id', {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (data.guest_id) {
      localStorage.setItem('guest_id', data.guest_id.toString());
      return data.guest_id.toString();
    }
    throw new Error('No guest_id in backend response');
  }
  throw new Error('Not running in browser');
}

export async function getSellerInfo() {
  const language = getCurrentLanguage();
  return cachedApiCall(
    'seller',
    'seller',
    language,
    async () => {
      const res = await fetch(`${BASE_URL}/seller?seller_id=${SELLER_ID}`, {
        headers: getHeaders(),
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error('Failed to fetch seller info');
      return res.json();
    }
  );
}

export async function getSellerCategories() {
  const language = getCurrentLanguage();
  return cachedApiCall(
    'categories',
    'categories',
    language,
    async () => {
      const guestId = await getOrCreateGuestId();
      const res = await fetch(`${BASE_URL}/categories?seller_id=${SELLER_ID}&guest_id=${guestId}`, {
        headers: getHeaders(),
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error('Failed to fetch seller categories');
      return res.json();
    }
  );
}

export async function getSellerProducts(params: Record<string, string> = {}) {
  const language = getCurrentLanguage();
  return cachedApiCall(
    'products',
    'products',
    language,
    async () => {
      const guestId = await getOrCreateGuestId();
      const query = new URLSearchParams({ 
        guest_id: guestId, 
        limit: params.limit || '20', 
        offset: params.offset || '1',
        ...params 
      }).toString();
      // Use the correct seller-specific endpoint
      const res = await fetch(`${BASE_URL}/seller/${SELLER_ID}/products?${query}`, {
        headers: getHeaders(),
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return data;
    },
    params
  );
}

export async function getSellerBanners() {
  const language = getCurrentLanguage();
  return cachedApiCall(
    'banners',
    'static',
    language,
    async () => {
      const res = await fetch(`${BASE_URL}/banners`, {
        headers: getHeaders(),
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error('Failed to fetch banners');
      return res.json();
    }
  );
}

// Fetch configuration data (currency, settings, etc.)
export async function getConfig() {
  const language = getCurrentLanguage();
  return cachedApiCall(
    'config',
    'config',
    language,
    async () => {
      const res = await fetch(`${BASE_URL}/config`, {
        headers: getHeaders(),
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    }
  );
}

// Cache individual product details
export async function getProductDetails(slug: string, guestId?: string) {
  const language = getCurrentLanguage();
  return cachedApiCall(
    `product_${slug}`,
    'product',
    language,
    async () => {
      const actualGuestId = guestId || await getOrCreateGuestId();
      const apiUrl = `https://awisapp.com/api/v1/products/details/${slug}?guest_id=${actualGuestId}`;
      const res = await fetch(apiUrl, {
        headers: getHeaders(),
      });
      let raw = await res.text();
      let parsed: any = {};
      try { parsed = JSON.parse(raw); } catch (e) { parsed = { error: 'Invalid JSON', raw }; }
      return parsed;
    }
  );
}

// Cart API functions - Fixed to match Flutter app exactly
export async function addToCart(productId: number, quantity: number = 1, selectedColor?: string, selectedOptions?: { [key: string]: string }, selectedVariant?: any) {
  const guestId = await getOrCreateGuestId();
  const data: any = {
    id: productId,
    guest_id: guestId,
    quantity: quantity,
    buy_now: 0,
  };
  if (selectedVariant) {
    data.variant = selectedVariant.type;
    data.price = selectedVariant.price;
    data.sku = selectedVariant.sku;
    data.qty = selectedVariant.qty;
  }
  // Send color as color code if available
  if (selectedColor) {
    // If selectedColor is a color name, try to find the code from selectedVariant or selectedOptions
    if (selectedVariant && selectedVariant.color_code) {
      data.color = selectedVariant.color_code;
    } else {
      data.color = selectedColor;
    }
  }
  // Flatten choices: send each as choice_1, choice_2, etc.
  if (selectedOptions) {
    let idx = 1;
    for (const [key, value] of Object.entries(selectedOptions)) {
      data[`choice_${idx}`] = value;
      idx++;
    }
  }

  const res = await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to add to cart: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  return result;
}

export async function getCart() {
  const guestId = await getOrCreateGuestId();
  const res = await fetch(`${BASE_URL}/cart?guest_id=${guestId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch cart: ${res.status} ${errorText}`);
  }
  const result = await res.json();
  return result;
}

export async function updateCartQuantity(cartId: number, quantity: number) {
  const guestId = await getOrCreateGuestId();
  
  const data = {
    _method: 'put',
    key: cartId,
    quantity: quantity,
    guest_id: guestId,
  };

  const res = await fetch(`${BASE_URL}/cart/update`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update cart: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  return result;
}

export async function removeFromCart(cartId: number) {
  const guestId = await getOrCreateGuestId();
  const data = {
    _method: 'delete',
    guest_id: guestId,
    key: cartId,
  };

  const res = await fetch(`${BASE_URL}/cart/remove`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to remove from cart: ${res.status} ${errorText}`);
  }

  const result = await res.json();
  return result;
}

// Format price according to Flutter app logic with language-aware currency symbols
export function formatPrice(price: number, config: any, language: string = 'ar'): string {
  if (!price || price <= 0) return '';
  // If config or currency_list is missing, don't try to convert or show a price
  if (!config || !config.currency_list) {
    return '';
  }
  try {
    // Get currency symbol from config, default to KD
    let currencySymbol = 'KD';
    let decimalPoints = 2;
    let convertedPrice = price;
    
    if (config) {
      // Find the active currency (status: true)
      const activeCurrency = config.currency_list?.find((curr: any) => curr.status === true);
      // Find the USD currency (status: false, code: USD)
      const usdCurrency = config.currency_list?.find((curr: any) => curr.status === false && curr.code === 'USD');
      
      if (activeCurrency) {
        currencySymbol = activeCurrency.symbol || 'KD';
        const activeRate = parseFloat(activeCurrency.exchange_rate) || 1;
        const usdRate = parseFloat(usdCurrency?.exchange_rate) || 1;
        
        // Apply currency conversion: price * activeRate * (1 / usdRate)
        // This matches the Flutter app's conversion logic
        convertedPrice = price * activeRate * (1 / usdRate);
      }
      
      // Get decimal point settings
      decimalPoints = config.decimal_point_settings || 2;
    }
    
    // Format price with proper decimal places and commas
    const formattedPrice = convertedPrice.toFixed(decimalPoints);
    const priceWithCommas = formattedPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Display currency symbol based on language direction
    // For Arabic (RTL): "دك" after price, for English (LTR): "KD" before price
    const isRTL = language === 'ar';
    const displaySymbol = isRTL ? 'دك' : 'KD';
    
    // Format based on language direction
    if (isRTL) {
      // Arabic: price دك (symbol after price)
      return `${priceWithCommas} ${displaySymbol}`;
    } else {
      // English: KD price (symbol before price)
      return `${displaySymbol} ${priceWithCommas}`;
    }
  } catch (error) {
    console.error('Error formatting price:', error);
    const isRTL = language === 'ar';
    const displaySymbol = isRTL ? 'دك' : 'KD';
    
    if (isRTL) {
      return `${price.toFixed(2)} ${displaySymbol}`;
    } else {
      return `${displaySymbol} ${price.toFixed(2)}`;
    }
  }
}

// Add more API helpers as needed (categories, reviews, etc.)

export interface PlaceOrderCartItem {
  product_id: number;
  quantity: number;
  variant?: string;
  color?: string;
}

export interface PlaceOrderParams {
  address_id: number | string;
  delivery: string;
  payment: string;
  order_note: string;
  cartItems: any[];
  guest_id: number | string;
  country: string;
  city: string;
  postal: string;
  phone: string;
  name: string;
  address?: string;
  email?: string;
  shipping_cost?: number;
}

export async function placeOrder(params: PlaceOrderParams) {
  let { guest_id, cartItems, shipping_cost, ...rest } = params;
  // Fallback for guest_id
  if (!guest_id || isNaN(Number(guest_id))) {
    guest_id = typeof window !== 'undefined' ? (localStorage.getItem('guest_id') || '1') : '1';
  }
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v?.toString() ?? ''])),
    cartItems: JSON.stringify(cartItems),
    guest_id: guest_id.toString(),
    is_guest: '1',
    ...(shipping_cost !== undefined ? { shipping_cost: shipping_cost.toString() } : {}),
  }).toString();
  const res = await fetch(`https://awisapp.com/api/v1/customer/order/place?${query}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to place order');
  return await res.json();
}

export interface AddAddressParams {
  name: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  postal: string;
  address: string;
  address_type: string;
  guest_id: number | string;
  contact_person_name?: string;
  zip?: string;
  latitude?: string;
  longitude?: string;
  is_billing?: number;
}

export async function addAddress(params: any) {
  let guestId = params.guest_id;
  if (!guestId) {
    guestId = await getOrCreateGuestId();
  }
  // Ensure latitude and longitude are always present and numbers
  let latitude = params.latitude;
  let longitude = params.longitude;
  if (latitude === undefined || latitude === null || latitude === "") latitude = 0;
  if (longitude === undefined || longitude === null || longitude === "") longitude = 0;
  let body = {
    contact_person_name: params.name,
    address_type: params.address_type || 'home',
    address: params.address,
    city: params.city,
    zip: params.postal || params.zip,
    phone: params.phone,
    state: params.state || '',
    country: params.country,
    latitude: latitude,
    longitude: longitude,
    is_billing: false,
    guest_id: guestId.toString(),
    email: params.email || '',
    is_guest: 1,
  };
  let res = await fetch('https://awisapp.com/api/v1/customer/address/add', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to add address');
  return await res.json();
}

export async function getAddressList(guest_id: number | string) {
  const res = await fetch(`https://awisapp.com/api/v1/customer/address/list?guest_id=${encodeURIComponent(guest_id.toString())}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch address list');
  const data = await res.json();
  // Flutter expects a plain array, not wrapped in addresses/data
  return Array.isArray(data) ? data : (data.addresses || data.data || []);
}

export function getSellerInfoFromCart(cartItems: any[]) {
  if (!cartItems || cartItems.length === 0) return { sellerId: SELLER_ID, sellerType: 'admin' };
  const first = cartItems[0];
  return {
    sellerId: first.seller_id || first.sellerId || SELLER_ID,
    sellerType: first.seller_is || first.sellerIs || 'admin',
  };
}

export async function getShippingMethods(_sellerId: string | number, _sellerType: string, guestId: string | number) {
  // Always fetch admin/global shipping methods only
  const res = await fetch(`https://awisapp.com/api/v1/shipping-method/by-seller/${SELLER_ID}/admin?guest_id=${guestId}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  const options = Array.isArray(data) ? data : (data.shipping_methods || data.data || []);
  return options;
}

export async function chooseShippingMethod(shippingMethodId: number | string, guestId: number | string, cartGroupId: string = 'default') {
  const body = {
    id: shippingMethodId,
    guest_id: guestId,
    cart_group_id: cartGroupId,
  };
  const res = await fetch('https://awisapp.com/api/v1/shipping-method/choose-for-order', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to choose shipping method');
  return await res.json();
}

export interface DigitalPaymentOrderParams {
  order_note?: string;
  customer_id?: string | number;
  address_id?: string | number;
  billing_address_id?: string | number;
  coupon_code?: string;
  coupon_discount?: string | number;
  payment_method?: string;
  is_check_create_account?: boolean;
  password?: string;
  payment_platform?: string;
  payment_request_from?: string;
}

export interface DigitalPaymentOrderResponse {
  redirect_link?: string;
  [key: string]: any;
}

export async function digitalPaymentPlaceOrder(params: DigitalPaymentOrderParams): Promise<DigitalPaymentOrderResponse> {
  const guest_id = await getOrCreateGuestId();
  const is_guest = 1;
  const is_check_create_account = params.is_check_create_account ? 1 : 0;
  const body = {
    order_note: params.order_note || '',
    customer_id: params.customer_id || guest_id,
    address_id: params.address_id,
    billing_address_id: params.billing_address_id,
    coupon_code: params.coupon_code || '',
    coupon_discount: params.coupon_discount || '',
    payment_platform: params.payment_platform || 'web',
    payment_method: params.payment_method,
    callback: null,
    payment_request_from: params.payment_request_from || 'web',
    guest_id: guest_id,
    is_guest: is_guest,
    is_check_create_account: is_check_create_account,
    password: params.password || '',
  };
  // POST to the correct API endpoint for digital payment
  const res = await fetch('https://awisapp.com/api/v1/digital-payment', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to place digital payment order');
  return await res.json();
}

export async function setCheckoutSession(address_id: number | string, billing_address_id: number | string) {
  const res = await fetch('https://awisapp.com/api/v1/set-checkout-session', {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: JSON.stringify({ address_id, billing_address_id }),
  });
  if (!res.ok) throw new Error('Failed to set checkout session');
  return await res.json();
}

// Order tracking API function
export async function trackOrder(orderId: string, phoneNumber: string) {
  const data = {
    order_id: orderId,
    phone_number: phoneNumber,
  };

  const res = await fetch(`${BASE_URL}/order/track-order`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to track order: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  return result;
}
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { addToCart, getCart, updateCartQuantity, removeFromCart, getOrCreateGuestId } from '@/utils/api';

// Cart item interface - Updated to match actual API response
export interface CartItem {
  id: number;
  customer_id: number;
  cart_group_id: string;
  product_id: number;
  product_type: string;
  digital_product_type: string | null;
  color: string | null;
  choices: any[];
  variations: any[];
  variant: string;
  quantity: number;
  price: number;
  tax: number;
  discount: number;
  tax_model: string;
  is_checked: number;
  slug: string;
  name: string;
  thumbnail: string;
  seller_id: number;
  seller_is: string;
  created_at: string;
  updated_at: string;
  shop_info: string;
  shipping_cost: number;
  shipping_type: string;
  is_guest: number;
  is_product_available: number;
  minimum_order_amount_info: number;
  free_delivery_order_amount: {
    amount: number;
    percentage: number;
    amount_need: number;
    shipping_cost_saved: number;
    cart_id: string;
    status: number;
    responsibility: string;
  };
  shop?: any;
  product?: any;
}

// Cart state interface
interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  subtotal: number;
  total: number;
}

// Cart action types
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'UPDATE_TOTALS' };

// Initial state
const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  totalItems: 0,
  subtotal: 0,
  total: 0,
};

// Cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CART':
      return {
        ...state,
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: action.payload.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
        total: action.payload.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
      };
    
    case 'ADD_ITEM':
      // Check for existing item with same product_id, variant, and color
      const existingItem = state.items.find(item => {
        const itemVariant = item.variant || '';
        const payloadVariant = action.payload.variant || '';
        const itemColor = item.color || '';
        const payloadColor = action.payload.color || '';
        
        const matches = item.product_id === action.payload.product_id && 
                       itemVariant === payloadVariant && 
                       itemColor === payloadColor;
        

        
        return matches;
      });
      

      
      if (existingItem) {
        // Update quantity of existing item
        const updatedItems = state.items.map(item =>
          item.product_id === action.payload.product_id &&
          item.variant === action.payload.variant &&
          item.color === action.payload.color
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: updatedItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
          total: updatedItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
        };
      } else {
        // Add new item
        const newItems = [...state.items, action.payload];
        return {
          ...state,
          items: newItems,
          totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: newItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
          total: newItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
        };
      }
    
    case 'UPDATE_ITEM':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: updatedItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
        total: updatedItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
      };
    
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        totalItems: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: filteredItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
        total: filteredItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        subtotal: 0,
        total: 0,
      };
    
    case 'UPDATE_TOTALS':
      return {
        ...state,
        totalItems: state.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: state.items.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
        total: state.items.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0),
      };
    
    default:
      return state;
  }
}

// Cart context
interface CartContextType {
  state: CartState;
  addToCart: (productId: number, quantity?: number, selectedColor?: string, selectedOptions?: { [key: string]: string }, selectedVariant?: any) => Promise<void>;
  updateQuantity: (cartId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartId: number) => Promise<void>;
  clearCart: () => void;
  loadCart: () => Promise<void>;
  clearCartAndGuestId: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [errorToast, setErrorToast] = React.useState<string | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clear cart and guest_id if no guest_id is found (new session/private window)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const guestId = localStorage.getItem('guest_id');
      if (!guestId) {
        localStorage.removeItem('guest_id');
        dispatch({ type: 'CLEAR_CART' });
      }
    }
  }, [isMounted]);

  // Load cart on mount
  useEffect(() => {
    if (isMounted) {
      loadCart();
    }
  }, [isMounted]);

  // Check for payment success and clear cart
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('flag') === 'success';
      const paymentToken = urlParams.get('token');
      const paymentStatus = urlParams.get('status');
      const paymentId = urlParams.get('payment_id');
      
      // Check for various payment success indicators
      const isPaymentSuccess = (
        (paymentSuccess && paymentToken) ||
        (paymentStatus === 'success') ||
        (paymentStatus === 'paid') ||
        (paymentId && paymentSuccess)
      );
      
              if (isPaymentSuccess) {
        dispatch({ type: 'CLEAR_CART' });
        
        // Remove all payment-related parameters from URL without reloading
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('flag');
        newUrl.searchParams.delete('token');
        newUrl.searchParams.delete('status');
        newUrl.searchParams.delete('payment_id');
        window.history.replaceState({}, '', newUrl.toString());
        
        // Show success message
        setSuccessToast('تم الدفع بنجاح! تم مسح السلة.');
        
        // Auto-hide success toast after 5 seconds
        setTimeout(() => {
          setSuccessToast(null);
        }, 5000);
      }
    }
  }, [isMounted]);

  // Additional check: Clear cart when user returns to home page after payment
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      const hasRecentPayment = sessionStorage.getItem('recent_payment_attempt');
      
      if (isHomePage && hasRecentPayment) {
        dispatch({ type: 'CLEAR_CART' });
        sessionStorage.removeItem('recent_payment_attempt');
        
        // Show success message
        setSuccessToast('تم الدفع بنجاح! تم مسح السلة.');
        setTimeout(() => {
          setSuccessToast(null);
        }, 5000);
      }
    }
  }, [isMounted]);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await getCart();
      
      // Handle different possible response structures
      let cartItems: CartItem[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response (actual API structure)
        cartItems = response;
      } else if (response.cart && Array.isArray(response.cart)) {
        cartItems = response.cart;
      } else if (response.items && Array.isArray(response.items)) {
        cartItems = response.items;
      } else if (response.data && Array.isArray(response.data)) {
        cartItems = response.data;
      } else {
        cartItems = [];
      }
      
      dispatch({ type: 'SET_CART', payload: cartItems });
    } catch (error) {
      console.error('Failed to load cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCartHandler = async (productId: number, quantity: number = 1, selectedColor?: string, selectedOptions?: { [key: string]: string }, selectedVariant?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      

      
      const guest_id = await getOrCreateGuestId();
      
      // Check if product already exists in cart with same variant and color
      const existingItem = state.items.find(item => {
        const itemVariant = item.variant || '';
        const requestVariant = selectedVariant?.type || '';
        const itemColor = item.color || '';
        const requestColor = selectedColor || '';
        

        
        return item.product_id === productId && itemVariant === requestVariant && itemColor === requestColor;
      });
      
      if (existingItem) {
        // Update existing item quantity on server first
        const newQuantity = existingItem.quantity + quantity;
        await updateCartQuantity(existingItem.id, newQuantity);
        
        // Only update local state after successful API call
        dispatch({ type: 'UPDATE_ITEM', payload: { id: existingItem.id, quantity: newQuantity } });
      } else {
        // Add new item to server first
        const result = await addToCart(productId, quantity, selectedColor, selectedOptions, selectedVariant);
        
        // Reload cart from server to get the complete item data and update local state
        await loadCart();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add to cart' });
      setErrorToast('Failed to add to cart');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantityHandler = async (cartId: number, quantity: number) => {
    // Find the item and store previous quantity
    const prevItem = state.items.find((item) => item.id === cartId);
    if (!prevItem) return;
    const prevQuantity = prevItem.quantity;
    
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const guest_id = await getOrCreateGuestId();
      await updateCartQuantity(cartId, quantity);
      
      // Only update local state after successful API call
      dispatch({ type: 'UPDATE_ITEM', payload: { id: cartId, quantity } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
      setErrorToast('Failed to update quantity');
      throw error;
    }
  };

  const removeFromCartHandler = async (cartId: number) => {
    // Find the item and store previous state
    const prevItem = state.items.find((item) => item.id === cartId);
    if (!prevItem) return;
    
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const guest_id = await getOrCreateGuestId();
      await removeFromCart(cartId);
      
      // Only update local state after successful API call
      dispatch({ type: 'REMOVE_ITEM', payload: cartId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove from cart' });
      setErrorToast('Failed to remove from cart');
      throw error;
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Add a function to clear cart and guest_id (for logout or new session)
  const clearCartAndGuestId = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guest_id');
    }
    dispatch({ type: 'CLEAR_CART' });
  };

  const value: CartContextType = {
    state,
    addToCart: addToCartHandler,
    updateQuantity: updateQuantityHandler,
    removeFromCart: removeFromCartHandler,
    clearCart,
    loadCart,
    // Expose clearCartAndGuestId for use in logout/session reset
    clearCartAndGuestId,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {errorToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          {errorToast}
          <button className="ml-2" onClick={() => setErrorToast(null)}>&times;</button>
        </div>
      )}
      {successToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {successToast}
          <button className="ml-2" onClick={() => setSuccessToast(null)}>&times;</button>
        </div>
      )}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 
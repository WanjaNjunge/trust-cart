'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  User,
  CreditCard,
  ShoppingBag,
  Loader2,
  Check,
  AlertCircle,
  ArrowLeft,
  Smartphone,
  Mail,
  Building,
  Edit2,
} from 'lucide-react';
import {
  getCart,
  getAddresses,
  checkout,
  initiatePayment,
  getPaymentStatus,
  type Cart,
  type Address,
  type CheckoutRequest,
  type CheckoutResponse,
} from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

// Inline address form data
interface AddressFormData {
  recipientName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
}

const KENYA_COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Kiambu',
  'Machakos',
  'Kajiado',
  'Uasin Gishu',
  'Nyeri',
  'Kilifi',
  'Kwale',
  'Taita Taveta',
  // Add more as needed
];

export default function CheckoutPage() {
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<CheckoutResponse | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'MPESA_STK' | 'POD_CASH'>('MPESA_STK');
  const [paymentResult, setPaymentResult] = useState<{ status: string; message: string; transactionId?: string } | null>(null);

  // For guest/new address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    recipientName: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    county: 'Nairobi',
  });
  const [addressFormErrors, setAddressFormErrors] = useState<Partial<AddressFormData>>({});

  // Load cart and addresses
  useEffect(() => {
    async function loadData() {
      try {
        const loggedIn = isAuthenticated();
        setIsLoggedIn(loggedIn);

        // Load cart (works for both guest and authenticated users via session)
        const cartData = await getCart();
        setCart(cartData);

        // Load saved addresses for logged-in users
        if (loggedIn) {
          try {
            const addressData = await getAddresses();
            setAddresses(addressData);

            // Auto-select default address
            const defaultAddr = addressData.find((a) => a.isDefault);
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
            } else if (addressData.length > 0 && addressData[0]) {
              setSelectedAddressId(addressData[0].id);
            } else {
              // No addresses, show form
              setShowAddressForm(true);
            }
          } catch {
            // If addresses fail to load, show form
            setShowAddressForm(true);
          }
        } else {
          // Guest user - always show address form
          setShowAddressForm(true);
        }
      } catch (err) {
        setError('Failed to load checkout data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Format price in KES
  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString('en-KE')}`;
  };

  // Validate address form
  const validateAddressForm = (): boolean => {
    const errors: Partial<AddressFormData> = {};

    if (!addressForm.recipientName.trim()) {
      errors.recipientName = 'Recipient name is required';
    }
    if (!isLoggedIn && !addressForm.email.trim()) {
      errors.email = 'Email is required for guest checkout';
    } else if (!isLoggedIn && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.email)) {
      errors.email = 'Invalid email format';
    }
    if (!addressForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^(\+254|0)\d{9}$/.test(addressForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Enter a valid Kenyan phone number';
    }
    if (!addressForm.line1.trim()) {
      errors.line1 = 'Address line 1 is required';
    }
    if (!addressForm.city.trim()) {
      errors.city = 'City/Town is required';
    }
    if (!addressForm.county) {
      errors.county = 'County is required';
    }

    setAddressFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle checkout submission
  const handleCheckout = async () => {
    // Validate based on mode
    if (showAddressForm) {
      if (!validateAddressForm()) {
        return;
      }
    } else if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    if (!cart || cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build checkout request
      const request: CheckoutRequest & {
        guestEmail?: string;
        guestAddress?: Omit<AddressFormData, 'email'>;
      } = {
        addressId: selectedAddressId || 'GUEST_ADDRESS',
        paymentMethod: 'MPESA_STK',
        notes: notes.trim() || undefined,
      };

      // For guest or new address, include address data
      if (showAddressForm) {
        // Destructure to separate email from the rest of the address properties
        const { email, ...addressData } = addressForm;
        request.guestEmail = email;
        request.guestAddress = addressData;
      }

      // Update payment method in request
      request.paymentMethod = paymentMethod;

      // 1. Create Order
      const result = await checkout(request);

      // 2. Initiate Payment (Stub / PoD)
      // Determining phone number: use form phone or selected address phone
      let phoneToUse = addressForm.phone;
      if (!showAddressForm && selectedAddressId) {
        const addr = addresses.find(a => a.id === selectedAddressId);
        if (addr) phoneToUse = addr.phone;
      }

      try {
        const payResult = await initiatePayment(result.id, phoneToUse);
        setPaymentResult(payResult);
        setOrderResult(result);

        if (payResult.status === 'CONFIRMED') {
          // POD or already-confirmed — go straight to confirmation page
          router.push(`/order-confirmation/${result.id}`);
        } else if (payResult.status === 'INITIATED' && payResult.transactionId) {
          // MPesa stub: poll every 3 seconds, up to 12 attempts (36 seconds — outlasts 5 s stub)
          const txId = payResult.transactionId;
          const orderId = result.id;
          let attempts = 0;
          const maxAttempts = 12;

          pollRef.current = setInterval(async () => {
            attempts += 1;
            try {
              const tx = await getPaymentStatus(txId);
              if (tx.status === 'CONFIRMED') {
                clearInterval(pollRef.current!);
                router.push(`/order-confirmation/${orderId}`);
              } else if (tx.status === 'FAILED' || tx.status === 'CANCELLED') {
                clearInterval(pollRef.current!);
                setError('Payment failed. Please try again from Order History.');
                setSubmitting(false);
              } else if (attempts >= maxAttempts) {
                clearInterval(pollRef.current!);
                // Timeout — send to confirmation page anyway; order exists
                router.push(`/order-confirmation/${orderId}`);
              }
            } catch {
              // Network error during poll — keep trying until max attempts
              if (attempts >= maxAttempts) {
                clearInterval(pollRef.current!);
                router.push(`/order-confirmation/${orderId}`);
              }
            }
          }, 3000);
        }
      } catch (payErr) {
        setError('Order created but payment initiation failed. Please try again from Order History.');
        console.error(payErr);
        setOrderResult(result);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Checkout failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Update address form field
  const handleAddressChange = (field: keyof AddressFormData, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (addressFormErrors[field]) {
      setAddressFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Order success state
  if (orderResult) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">{paymentResult ? paymentResult.message : orderResult.message}</p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order Number</p>
                  <p className="font-semibold text-gray-900">{orderResult.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-semibold text-yellow-600">
                    {orderResult.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-semibold text-gray-900">{formatPrice(orderResult.total)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-semibold text-gray-900">
                    {orderResult.paymentMethod === 'POD_CASH' ? 'Pay on Delivery' : 'MPesa STK Push'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-6 mb-6">
              {paymentMethod === 'MPESA_STK' ? (
                <>
                  <Smartphone className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                  <p className="text-indigo-800 font-medium">Check your phone for MPesa payment prompt</p>
                  <p className="text-indigo-600 text-sm mt-1">Enter your MPesa PIN to complete payment</p>
                </>
              ) : (
                <>
                  <Building className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                  <p className="text-indigo-800 font-medium">Pay on Delivery Confirmed</p>
                  <p className="text-indigo-600 text-sm mt-1">Please have KES {formatPrice(orderResult.total)} ready in cash upon delivery.</p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isLoggedIn ? (
                <Link
                  href={`/orders/${orderResult.id}`}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  View Order Details
                </Link>
              ) : (
                <p className="flex-1 text-sm text-gray-600 py-3">
                  Order confirmation sent to your email
                </p>
              )}
              <Link
                href="/"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart redirect
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products before checking out.</p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // Calculate delivery fee (displayed for UI - actual calculated on backend)
  const estimatedDeliveryFee = 20000; // Zone 1 default (KES 200)

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          {!isLoggedIn && (
            <p className="mt-2 text-gray-600">
              Have an account?{' '}
              <Link href="/login?redirect=/checkout" className="text-indigo-600 hover:underline">
                Log in
              </Link>{' '}
              for faster checkout
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Delivery Address
              </h2>

              {/* Saved Addresses (for logged-in users) */}
              {isLoggedIn && addresses.length > 0 && !showAddressForm && (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <button
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedAddressId === address.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {address.recipientName}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {address.phone}
                            </p>
                            <p>
                              {address.line1}, {address.city}, {address.county}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAddressId === address.id
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                            }`}
                        >
                          {selectedAddressId === address.id && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowAddressForm(true);
                      setSelectedAddressId(null);
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Use a different address
                  </button>
                </div>
              )}

              {/* Address Form (for guests or new address) */}
              {(showAddressForm || addresses.length === 0) && (
                <div className="space-y-4">
                  {isLoggedIn && addresses.length > 0 && addresses[0] && (
                    <button
                      onClick={() => {
                        setShowAddressForm(false);
                        if (addresses[0]) setSelectedAddressId(addresses[0].id);
                      }}
                      className="text-sm text-indigo-600 hover:underline mb-2"
                    >
                      ← Back to saved addresses
                    </button>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Recipient Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Full name"
                          value={addressForm.recipientName}
                          onChange={(e) => handleAddressChange('recipientName', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${addressFormErrors.recipientName ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                      </div>
                      {addressFormErrors.recipientName && (
                        <p className="text-red-600 text-sm mt-1">{addressFormErrors.recipientName}</p>
                      )}
                    </div>

                    {/* Email (for guests) */}
                    {!isLoggedIn && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={addressForm.email}
                            onChange={(e) => handleAddressChange('email', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${addressFormErrors.email ? 'border-red-500' : 'border-gray-300'
                              }`}
                          />
                        </div>
                        {addressFormErrors.email && (
                          <p className="text-red-600 text-sm mt-1">{addressFormErrors.email}</p>
                        )}
                      </div>
                    )}

                    {/* Phone */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="+254 7XX XXX XXX"
                          value={addressForm.phone}
                          onChange={(e) => handleAddressChange('phone', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${addressFormErrors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                      </div>
                      {addressFormErrors.phone && (
                        <p className="text-red-600 text-sm mt-1">{addressFormErrors.phone}</p>
                      )}
                    </div>

                    {/* Address Line 1 */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Street address, building name"
                          value={addressForm.line1}
                          onChange={(e) => handleAddressChange('line1', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${addressFormErrors.line1 ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                      </div>
                      {addressFormErrors.line1 && (
                        <p className="text-red-600 text-sm mt-1">{addressFormErrors.line1}</p>
                      )}
                    </div>

                    {/* Address Line 2 */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        placeholder="Apartment, floor, etc. (optional)"
                        value={addressForm.line2}
                        onChange={(e) => handleAddressChange('line2', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City/Town *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="City or town"
                          value={addressForm.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${addressFormErrors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                      </div>
                      {addressFormErrors.city && (
                        <p className="text-red-600 text-sm mt-1">{addressFormErrors.city}</p>
                      )}
                    </div>

                    {/* County */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        County *
                      </label>
                      <select
                        value={addressForm.county}
                        onChange={(e) => handleAddressChange('county', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${addressFormErrors.county ? 'border-red-500' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Select county</option>
                        {KENYA_COUNTIES.map((county) => (
                          <option key={county} value={county}>
                            {county}
                          </option>
                        ))}
                      </select>
                      {addressFormErrors.county && (
                        <p className="text-red-600 text-sm mt-1">{addressFormErrors.county}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Payment Method
              </h2>

              <div className="space-y-3">
                {/* MPesa Option */}
                <button
                  onClick={() => setPaymentMethod('MPESA_STK')}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'MPESA_STK'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">M-PESA</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">MPesa STK Push</p>
                    <p className="text-sm text-gray-600">Fast & automatic payment to your phone</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'MPESA_STK'
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-gray-300'
                    }`}>
                    {paymentMethod === 'MPESA_STK' && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>

                {/* PoD Option */}
                <button
                  onClick={() => setPaymentMethod('POD_CASH')}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'POD_CASH'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Pay on Delivery</p>
                    <p className="text-sm text-gray-600">Pay cash when you receive your order</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'POD_CASH'
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-gray-300'
                    }`}>
                    {paymentMethod === 'POD_CASH' && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                {paymentMethod === 'MPESA_STK'
                  ? 'A payment prompt will be sent to the phone number provided above.'
                  : `Pay on Delivery is available for orders under KES 30,000 in Nairobi & Environs.`}
              </p>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Notes (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                maxLength={500}
              />
              <p className="mt-2 text-sm text-gray-500">{notes.length}/500 characters</p>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product.primaryImage ? (
                        <img
                          src={item.product.primaryImage.url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                      <p className="text-gray-900 text-sm font-medium">{formatPrice(item.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              {cart.promoCode && (
                <div className="p-3 bg-green-50 rounded-lg mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700 font-medium">{cart.promoCode.code}</span>
                    <span className="text-green-600">
                      -
                      {cart.promoCode.discountType === 'PERCENT'
                        ? `${cart.promoCode.discountValue}%`
                        : formatPrice(cart.promoCode.discountValue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(estimatedDeliveryFee)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(cart.total + estimatedDeliveryFee)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full mt-6 px-6 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Place Order</>
                )}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                By placing your order, you agree to our{' '}
                <Link href="/terms" className="text-indigo-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

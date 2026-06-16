"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ShoppingBag, Minus, Plus, Trash2, Tag, Ticket, ArrowRight, Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { initiateRazorpayOrderAction, verifyPaymentAction, markOrderAsFailedAction, createOrderAction, applyCouponAction } from "@/app/actions";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CartPage() {
  const { cart, cartTotal, updateCartItem, removeFromCart, clearCart, user, loading } = useStore();
  const [coupon, setCoupon] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");

  // Checkout Form States
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || "");
  const [house, setHouse] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [pin, setPin] = useState("");
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Razorpay Simulated Fallback States
  const [simulatedModalOpen, setSimulatedModalOpen] = useState(false);
  const [simulatedOrder, setSimulatedOrder] = useState<any>(null);
  const [pendingOrderDetails, setPendingOrderDetails] = useState<any>(null);

  // Sync user details when modal opens
  const openCheckoutModal = () => {
    if (!user) {
      window.location.href = "/auth/login?redirect=/cart";
      return;
    }
    setEmail(user.email);
    setName(user.name);
    setCheckoutOpen(true);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setDiscountAmount(0);
    setActiveCoupon(null);

    const code = coupon.trim();
    if (!code) return;

    try {
      const res = await applyCouponAction(code, cartTotal);
      if (res.success && res.discount !== undefined) {
        setActiveCoupon(res.coupon?.code || code);
        setDiscountAmount(res.discount);
      } else {
        setCouponError(res.error || "Invalid coupon.");
      }
    } catch (err) {
      setCouponError("An error occurred during validation.");
    }
  };

  const handleSimulateSuccess = async () => {
    if (!pendingOrderDetails) return;
    setSimulatedModalOpen(false);
    setIsSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.variantPrice ?? item.product.price,
        productName: item.product.name,
        productImage: item.product.images?.[0] || "",
        variantId: item.variantId || null,
        variantWeight: item.variantWeight || null,
        variantFlavour: item.variantFlavour || null,
      }));
      const res = await createOrderAction({
        email: pendingOrderDetails.email,
        name: pendingOrderDetails.name,
        address: pendingOrderDetails.address,
        couponCode: activeCoupon || undefined,
        discount: discountAmount,
        tax: 0,
        shippingFee: shipping,
        total: grandTotal,
        paymentStatus: "PAID",
        razorpayOrderId: simulatedOrder.id,
        items: orderItems,
      });

      if (res.success) {
        setCheckoutSuccess(true);
        setActiveCoupon(null);
        setDiscountAmount(0);
        setCoupon("");
        clearCart();
      } else {
        alert("Failed to place simulated order.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during simulated checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateFailure = async () => {
    if (!pendingOrderDetails) return;
    setSimulatedModalOpen(false);
    setIsSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.variantPrice ?? item.product.price,
        productName: item.product.name,
        productImage: item.product.images?.[0] || "",
        variantId: item.variantId || null,
        variantWeight: item.variantWeight || null,
        variantFlavour: item.variantFlavour || null,
      }));
      await createOrderAction({
        email: pendingOrderDetails.email,
        name: pendingOrderDetails.name,
        address: pendingOrderDetails.address,
        couponCode: activeCoupon || undefined,
        discount: discountAmount,
        tax: 0,
        shippingFee: shipping,
        total: grandTotal,
        paymentStatus: "FAILED",
        razorpayOrderId: simulatedOrder.id,
        items: orderItems,
      });
      alert("Payment simulation failed. Order marked as FAILED.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !mobile || !house || !postOffice || !city || !district || !pin) return;

    setIsSubmitting(true);
    try {
      const initRes = await initiateRazorpayOrderAction(grandTotal);
      if (!initRes.success || !initRes.order) {
        alert(initRes.error || "Failed to initiate payment.");
        setIsSubmitting(false);
        return;
      }

      const order = initRes.order;

      if (order.simulated) {
        setSimulatedOrder(order);
        const detailedAddress = JSON.stringify({
          house,
          postOffice,
          city,
          district,
          state: "Kerala",
          pin,
          mobile
        });

        setPendingOrderDetails({ name, email, address: detailedAddress });
        setCheckoutOpen(false);
        setSimulatedModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay checkout failed to load. Please check your network.");
        setIsSubmitting(false);
        return;
      }

      const orderItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.variantPrice ?? item.product.price,
        productName: item.product.name,
        productImage: item.product.images?.[0] || "",
        variantId: item.variantId || null,
        variantWeight: item.variantWeight || null,
        variantFlavour: item.variantFlavour || null,
      }));
      const dbOrderRes = await createOrderAction({
        email,
        name,
        address: JSON.stringify({ house, postOffice, city, district, state: "Kerala", pin, mobile }),
        couponCode: activeCoupon || undefined,
        discount: discountAmount,
        tax: 0,
        shippingFee: shipping,
        total: grandTotal,
        paymentStatus: "PENDING",
        razorpayOrderId: order.id,
        items: orderItems,
      });

      if (!dbOrderRes.success || !dbOrderRes.order) {
        alert("Failed to register order.");
        setIsSubmitting(false);
        return;
      }

      const orderDbId = dbOrderRes.order.id;

      const options = {
        key: initRes.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Stack Shack Nutrition",
        description: "Supplement Purchase",
        order_id: order.id,
        handler: async function (response: any) {
          setIsSubmitting(true);
          const verifyRes = await verifyPaymentAction({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: orderDbId,
          });

          if (verifyRes.success) {
            setCheckoutSuccess(true);
            setActiveCoupon(null);
            setDiscountAmount(0);
            setCoupon("");
            clearCart();
            setCheckoutOpen(false);
          } else {
            alert("Payment verification failed.");
          }
          setIsSubmitting(false);
        },
        prefill: {
          name,
          email,
        },
        theme: {
          color: "#4285F4",
        },
        modal: {
          ondismiss: async function () {
            await markOrderAsFailedAction(orderDbId);
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (e: any) {
      console.error(e);
      alert(e.message || "An error occurred.");
      setIsSubmitting(false);
    }
  };

  const shipping = cartTotal > 500 || cartTotal === 0 ? 0 : 50;
  const grandTotal = Math.max(0, cartTotal - discountAmount + shipping);

  if (checkoutSuccess) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
          Thank you for shopping at Stack Shack Nutrition. We are preparing your sports supplements package.
        </p>
        <div className="mt-4 bg-gray-50 rounded-xl p-4 w-full border border-gray-100 text-left text-xs space-y-1">
          <p className="font-semibold text-gray-700">Order details simulated:</p>
          <p className="text-gray-500"><span className="font-medium">Customer:</span> {name}</p>
          <p className="text-gray-500"><span className="font-medium">Ship to:</span> {city}, Kerala</p>
          <p className="text-gray-500"><span className="font-medium">Total Charged:</span> ${grandTotal.toFixed(2)}</p>
        </div>
        <Link href="/shop" className="mt-6 w-full">
          <Button
            onClick={() => setCheckoutSuccess(false)}
            className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white py-5"
          >
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FFFFFF] min-h-screen py-8 mb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="border-b border-gray-100 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-[#4285F4]" />
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your supplement stack before proceeding to checkout.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-24 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mt-8">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 stroke-[1]" />
            <p className="mt-4 text-sm font-semibold text-gray-500">Your shopping cart is empty.</p>
            <p className="text-xs text-gray-400 mt-1">Add protein blends, creatine, or snacks to start your order.</p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold px-5">
                Go to Shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              {cart.map((item) => {
                const p = item.product;

                const linePrice = p.price;

                // Helper to draw graphics
                const drawIcon = (name: string) => {
                  let grad = "from-blue-500 to-indigo-600";
                  if (name.includes("Pre-Workout")) grad = "from-red-500 to-orange-500";
                  else if (name.includes("Vitamin")) grad = "from-teal-400 to-emerald-500";
                  else if (name.includes("Bars")) grad = "from-amber-500 to-yellow-600";
                  else if (name.includes("Creatine")) grad = "from-purple-600 to-pink-500";

                  return (
                    <div className={`h-full w-full bg-gradient-to-br ${grad} flex items-center justify-center relative`}>
                      <svg className="w-8 h-8 text-white/95" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {name.includes("Protein") && <rect x="6" y="3" width="12" height="18" rx="2" />}
                        {name.includes("Pre-Workout") && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />}
                        {name.includes("Vitamin") && <path d="M12 2C6.4 2 2 6.4 2 12s4.4 10 10 10 10-4.4 10-10S17.6 2 12 2zm0 6v8M8 12h8" />}
                        {name.includes("Bars") && <rect x="3" y="6" width="18" height="12" rx="2" />}
                        {name.includes("Creatine") && <circle cx="12" cy="12" r="10" />}
                      </svg>
                    </div>
                  );
                };

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Product Visual */}
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                        <img
                          src={item.productImage || p.images?.[0] || "/placeholder.png"}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <Link href={`/shop/${p.slug}`}>
                          <h3 className="text-sm font-bold text-gray-800 hover:text-[#4285F4] transition-colors truncate max-w-[150px] sm:max-w-xs leading-snug">
                            {p.name}
                          </h3>
                        </Link>

                        {/* Variant info */}
                        {(item.variantWeight || item.variantFlavour) && (
                          <p className="text-[11px] text-[#4285F4] font-semibold mt-0.5">
                            {[item.variantWeight, item.variantFlavour].filter(Boolean).join(" · ")}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-0.5">Price: {formatINR(item.variantPrice ?? linePrice)}</p>
                      </div>
                    </div>

                    {/* Quantity Stepper & Price & Delete */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-100 bg-[#F8F9FA] rounded-full px-1.5 py-0.5">
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity - 1)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-bold text-gray-800 px-2.5">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Total Line price */}
                      <span className="text-sm font-extrabold text-gray-950 min-w-[55px] text-right">
                        {formatINR((item.variantPrice ?? linePrice) * item.quantity)}
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary & Checkout Card */}
            <div className="lg:col-span-5 space-y-6">

              {/* Coupon Form */}
              <div className="rounded-2xl border border-gray-100 p-5 bg-white shadow-xs">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-[#4285F4]" />
                  Promo / Coupon Code
                </h3>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (SHACK10)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 rounded-xl bg-[#F8F9FA] px-4 py-2 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all uppercase"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="rounded-xl border-gray-200 text-xs font-bold px-4 py-5 hover:bg-gray-50 cursor-pointer"
                  >
                    Apply
                  </Button>
                </form>
                {couponError && <p className="text-[11px] text-red-500 mt-2 font-medium">{couponError}</p>}
                {activeCoupon && (
                  <p className="text-[11px] text-emerald-500 mt-2 font-medium flex items-center gap-1">
                    <Ticket className="h-3 w-3" />
                    Coupon &ldquo;{activeCoupon}&rdquo; active ({activeCoupon.includes("") ? "" : ""} discount applied!)
                  </p>
                )}
              </div>

              {/* Summary calculations */}
              <div className="rounded-2xl border border-gray-100 p-6 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Order Summary</h3>

                <div className="mt-4 space-y-3.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-800">{formatINR(cartTotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-500 font-medium">
                      <span>Discount</span>
                      <span>-{formatINR(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className="font-semibold text-gray-800">
                      {shipping === 0 ? "FREE" : formatINR(shipping)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-extrabold text-gray-950">
                    <span>Total</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                </div>

                {/* Checkout Trigger Dialog */}
                <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                  <Button
                    onClick={openCheckoutModal}
                    className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-6 mt-6 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Button>

                  <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-gray-900">Checkout Delivery</DialogTitle>
                      <DialogDescription className="text-xs text-gray-500 mt-1">
                        Please provide shipping details to place your simulated supplement order.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCheckoutSubmit} className="space-y-4 mt-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Full Name</label>
                        <input
                          type="text"
                          required
                          readOnly
                          value={name}
                          className="w-full rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5 text-sm text-gray-400 outline-none cursor-not-allowed opacity-80"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email Address</label>
                        <input
                          type="email"
                          required
                          readOnly
                          value={email}
                          className="w-full rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5 text-sm text-gray-400 outline-none cursor-not-allowed opacity-80"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mobile Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 9876543210"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
                        />
                      </div>

                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">Complete Shipping Address</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">House/Building Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Flat 4B, XYZ Apartments"
                              value={house}
                              onChange={(e) => setHouse(e.target.value)}
                              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Post Office</label>
                            <input
                              type="text"
                              required
                              placeholder="Central PO"
                              value={postOffice}
                              onChange={(e) => setPostOffice(e.target.value)}
                              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">City</label>
                            <input
                              type="text"
                              required
                              placeholder="Mumbai"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">District</label>
                            <input
                              type="text"
                              required
                              placeholder="Mumbai Suburban"
                              value={district}
                              onChange={(e) => setDistrict(e.target.value)}
                              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">State</label>
                            <input
                              type="text"
                              readOnly
                              value="Kerala"
                              className="w-full rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5 text-sm text-gray-400 outline-none cursor-not-allowed opacity-80"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">PIN Code</label>
                            <input
                              type="text"
                              required
                              placeholder="670001"
                              value={pin}
                              onChange={(e) => setPin(e.target.value)}
                              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 rounded-xl p-3 text-xs text-[#4285F4] border border-blue-100/30 font-medium">
                        Order total charges will be <strong>{formatINR(grandTotal)}</strong>. This is a secure simulated transaction.
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-6 mt-4 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            <span>Processing Payment...</span>
                          </>
                        ) : (
                          <span>Place Order Now</span>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={simulatedModalOpen} onOpenChange={setSimulatedModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-center">
              <CreditCard className="h-6 w-6 text-[#4285F4]" />
              Razorpay Sandbox Simulator
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              Test mode processing for demonstration.
            </DialogDescription>
          </DialogHeader>
          <div className="my-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-left space-y-1.5 text-xs text-gray-600">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
              <p className="font-bold flex items-center gap-1.5">Simulation Mode</p>
              <p className="mt-1">Razorpay credentials missing or order creation failed. Running in simulation mode.</p>
            </div>
            <p><span className="font-semibold">Order ID:</span> {simulatedOrder?.id}</p>
            <p><span className="font-semibold">Receipt:</span> {simulatedOrder?.receipt}</p>
            <p><span className="font-semibold">Total Amount:</span> {simulatedOrder?.currency} {((simulatedOrder?.amount || 0) / 100).toFixed(2)}</p>
            <p><span className="font-semibold">Customer:</span> {name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleSimulateSuccess}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 text-xs cursor-pointer animate-pulse"
            >
              Simulate Success
            </Button>
            <Button
              onClick={handleSimulateFailure}
              variant="outline"
              className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 font-bold py-3 text-xs cursor-pointer"
            >
              Simulate Failure
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

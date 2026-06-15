"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { User, Lock, HelpCircle, LogOut, Key, Loader2, CheckCircle2, AlertCircle, ShoppingBag, Truck, Package, Clock } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { sendVerificationEmailAction, getOrdersAction } from "@/app/actions";

export default function AccountPage() {
  const { user, updateProfile, updatePassword, logout, loading } = useStore();
  const router = useRouter();

  // Active section tracking
  const [activeTab, setActiveTab] = useState<"info" | "orders" | "password" | "support">("info");

  // Profile Form State
  const [profileName, setProfileName] = useState("");
  const [profileStatus, setProfileStatus] = useState<{ success?: boolean; error?: string }>({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Email Verification State
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ success?: boolean; error?: string }>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Redirect to login if user session is empty
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  // Sync profile display name when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
    }
  }, [user]);

  // Fetch orders when orders tab becomes active
  useEffect(() => {
    async function fetchOrders() {
      if (activeTab === "orders") {
        setOrdersLoading(true);
        try {
          const list = await getOrdersAction();
          setOrders(list);
        } catch (e) {
          console.error("Failed to load user orders:", e);
        } finally {
          setOrdersLoading(false);
        }
      }
    }
    fetchOrders();
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    setProfileLoading(true);
    setProfileStatus({});

    const res = await updateProfile(profileName.trim());
    if (res.success) {
      setProfileStatus({ success: true });
    } else {
      setProfileStatus({ error: res.error || "Failed to update profile." });
    }
    setProfileLoading(false);
  };

  const handleSendVerification = async () => {
    if (!user?.email) return;
    setVerificationLoading(true);
    try {
      const res = await sendVerificationEmailAction(user.email);
      if (res.success) {
        setVerificationSent(true);
      } else {
        alert(res.error || "Failed to send verification email.");
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({});

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ error: "Password must be at least 6 characters." });
      return;
    }

    setPasswordLoading(true);
    const res = await updatePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordStatus({ success: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordStatus({ error: res.error || "Failed to update password." });
    }
    setPasswordLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">
          {loading ? "Loading account details..." : "Redirecting to login..."}
        </span>
      </div>
    );
  }

  const menuItems = [
    { id: "info", name: "Personal Information", icon: User },
    { id: "orders", name: "Order History & Tracking", icon: ShoppingBag },
    { id: "password", name: "Change Password", icon: Lock },
    { id: "support", name: "Help & Support", icon: HelpCircle },
  ];

  return (
    <div className="w-full bg-[#FFFFFF] min-h-screen py-8 mb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="border-b border-gray-100 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <User className="h-7 w-7 text-[#4285F4]" />
            My Account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal profile, track orders, credentials, and reach out for assistance.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Navigation Options list */}
          <div className="md:col-span-4 space-y-2">
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden p-2.5 space-y-1.5 shadow-xs">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setProfileStatus({});
                      setPasswordStatus({});
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-[#4285F4]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-transparent"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Configuration Form Display */}
          <div className="md:col-span-8 rounded-2xl border border-gray-100 p-6 sm:p-8 bg-white shadow-xs">
            
            {/* 1. PERSONAL INFORMATION */}
            {activeTab === "info" && (
              <div>
                <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-[#4285F4]" />
                  Personal Information
                </h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="flex-1 rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-500 border border-gray-100 outline-none cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={verificationSent || verificationLoading}
                        className="px-4 py-2 text-xs font-bold text-[#4285F4] hover:bg-blue-50 border border-blue-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {verificationLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : verificationSent ? (
                          "Sent!"
                        ) : (
                          "Verify Email"
                        )}
                      </button>
                    </div>
                    {verificationSent && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-1">A verification email has been sent to your inbox.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Display Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full rounded-xl bg-white px-4 py-2.5 text-sm text-gray-800 border border-gray-200 focus:border-[#4285F4] outline-none transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={profileLoading}
                    className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white px-6 font-bold py-5 cursor-pointer shadow-xs"
                  >
                    {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </form>

                {profileStatus.success && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100/50">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Profile display name updated successfully.</span>
                  </div>
                )}
                {profileStatus.error && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50/50 p-3 rounded-xl border border-red-100/30">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{profileStatus.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. ORDER HISTORY & TRACKING */}
            {activeTab === "orders" && (
              <div>
                <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2 mb-4">
                  <ShoppingBag className="h-5 w-5 text-[#4285F4]" />
                  Order History & Tracking
                </h3>
                
                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin text-[#4285F4]" />
                    <span className="mt-2 text-xs font-semibold">Loading orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <ShoppingBag className="mx-auto h-10 w-10 text-gray-300 stroke-[1.2] mb-2" />
                    <p className="text-sm font-semibold text-gray-500">No orders found.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Start shopping to track your supplement shipments here!</p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    {orders.map((order) => {
                      const isPaid = order.paymentStatus === "PAID";
                      const isShipped = order.status === "SHIPPED" || order.status === "DELIVERED";
                      const isDelivered = order.status === "DELIVERED";
                      
                      let progressPercent = "w-1/4";
                      if (isPaid) progressPercent = "w-2/4";
                      if (isShipped) progressPercent = "w-3/4";
                      if (isDelivered) progressPercent = "w-full";

                      return (
                        <div key={order.id} className="border border-gray-100 rounded-2xl p-5 bg-white space-y-4 hover:shadow-xs transition-shadow">
                          {/* Top Header */}
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-3">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Order Invoice</p>
                              <p className="text-xs font-extrabold text-gray-950">{order.invoiceNumber || `#${order.id.substring(0, 8)}`}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Date Placed</p>
                              <p className="text-xs font-semibold text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Amount</p>
                              <p className="text-xs font-extrabold text-[#4285F4]">{formatINR(order.total)}</p>
                            </div>
                          </div>

                          {/* Tracking & Timeline */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                              <span className={order.status === "PENDING" ? "text-amber-500" : "text-gray-500"}>Status: {order.status}</span>
                              <span className={isPaid ? "text-emerald-600" : "text-amber-500"}>Payment: {order.paymentStatus}</span>
                            </div>

                            {/* Shipment Status & Tracking Number */}
                            {order.trackingNumber && (
                              <div className="bg-[#F8F9FA] rounded-xl p-3 border border-gray-100/50 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-gray-700 flex items-center gap-1.5">
                                    <Truck className="h-4 w-4 text-[#4285F4]" />
                                    Shipped via Standard Carrier
                                  </p>
                                  <p className="text-gray-400 mt-0.5">Tracking ID: <span className="font-semibold text-gray-600 select-all">{order.trackingNumber}</span></p>
                                </div>
                                <a 
                                  href={`https://t.17track.net/en#nums=${order.trackingNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#4285F4] font-bold hover:underline"
                                >
                                  Track Package
                                </a>
                              </div>
                            )}

                            {/* Timeline Graphical Bar */}
                            <div className="relative pt-2 pb-6">
                              {/* Background Line */}
                              <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full -translate-y-1/2 z-0"></div>
                              {/* Active Line */}
                              <div className={`absolute top-5 left-0 h-1 bg-[#4285F4] rounded-full -translate-y-1/2 z-0 transition-all duration-500 ${progressPercent}`}></div>
                              
                              <div className="relative flex justify-between z-10 text-center text-[9px] font-bold text-gray-400">
                                {/* Step 1: Placed */}
                                <div className="flex flex-col items-center w-16">
                                  <div className="h-6 w-6 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-xs shadow-xs mb-1">
                                    1
                                  </div>
                                  <span className="text-[#4285F4]">Placed</span>
                                </div>

                                {/* Step 2: Paid */}
                                <div className="flex flex-col items-center w-16">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-1 transition-colors duration-300 ${
                                    isPaid ? "bg-[#4285F4] text-white" : "bg-white border-2 border-gray-200 text-gray-400"
                                  }`}>
                                    2
                                  </div>
                                  <span className={isPaid ? "text-[#4285F4]" : ""}>Paid</span>
                                </div>

                                {/* Step 3: Shipped */}
                                <div className="flex flex-col items-center w-16">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-1 transition-colors duration-300 ${
                                    isShipped ? "bg-[#4285F4] text-white" : "bg-white border-2 border-gray-200 text-gray-400"
                                  }`}>
                                    3
                                  </div>
                                  <span className={isShipped ? "text-[#4285F4]" : ""}>Shipped</span>
                                </div>

                                {/* Step 4: Delivered */}
                                <div className="flex flex-col items-center w-16">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-1 transition-colors duration-300 ${
                                    isDelivered ? "bg-[#4285F4] text-white" : "bg-white border-2 border-gray-200 text-gray-400"
                                  }`}>
                                    4
                                  </div>
                                  <span className={isDelivered ? "text-[#4285F4]" : ""}>Delivered</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. CHANGE PASSWORD */}
            {activeTab === "password" && (
              <div>
                <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5 text-[#4285F4]" />
                  Change Account Password
                </h3>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Current Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl bg-white px-4 py-2.5 text-sm text-gray-800 border border-gray-200 focus:border-[#4285F4] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl bg-white px-4 py-2.5 text-sm text-gray-800 border border-gray-200 focus:border-[#4285F4] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl bg-white px-4 py-2.5 text-sm text-gray-800 border border-gray-200 focus:border-[#4285F4] outline-none transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white px-6 font-bold py-5 cursor-pointer shadow-xs"
                  >
                    {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                  </Button>
                </form>

                {passwordStatus.success && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100/50">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Your account password has been updated.</span>
                  </div>
                )}
                {passwordStatus.error && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50/50 p-3 rounded-xl border border-red-100/30">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{passwordStatus.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. HELP & SUPPORT */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                  <HelpCircle className="h-5 w-5 text-[#4285F4]" />
                  Help & Support Center
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      q: "How can I track my shipment?",
                      a: "Once your package is ready, we send a tracking link to your registered email address. Standard shipping takes 3-5 business days."
                    },
                    {
                      q: "What is your return policy?",
                      a: "We offer a 30-day money-back guarantee on all unopened supplement jars. If you are unsatisfied, please contact our support team."
                    },
                    {
                      q: "Are these formulas lab tested?",
                      a: "Yes! Every single product batch at Stack Shack Nutrition is certified for purity, ingredient levels, and compliance."
                    }
                  ].map((faq, i) => (
                    <div key={i} className="border-b border-gray-100/80 pb-4">
                      <h4 className="text-sm font-bold text-gray-800">{faq.q}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#F8F9FA] rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-bold text-gray-900">Need direct human help?</p>
                    <p className="text-xs text-gray-400 mt-0.5">Our support desk is open 24/7.</p>
                  </div>
                  <a href="mailto:support@stackshack.com">
                    <Button variant="outline" className="rounded-xl border-gray-200 text-xs font-bold px-4 hover:bg-white cursor-pointer">
                      Email Support
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

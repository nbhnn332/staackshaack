"use client";

import { useEffect, useState } from "react";
import { adminGetSettingsAction, adminUpdateSettingsAction, adminSendTestEmailAction } from "@/app/actions";
import { 
  Save, 
  Loader2, 
  Settings as SettingsIcon, 
  Globe, 
  DollarSign, 
  Key, 
  Building,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [websiteName, setWebsiteName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [shippingFreeLimit, setShippingFreeLimit] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [taxRate, setTaxRate] = useState("");
  
  // API credentials
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendSenderEmail, setResendSenderEmail] = useState("");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");

  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await adminGetSettingsAction();
        if (data) {
          setSettings(data);
          setWebsiteName(data.websiteName || "");
          setStoreEmail(data.storeEmail || "");
          setStorePhone(data.storePhone || "");
          setStoreAddress(data.storeAddress || "");
          setSeoTitle(data.seoTitle || "");
          setSeoDescription(data.seoDescription || "");
          setShippingFreeLimit(data.shippingFreeLimit.toString());
          setShippingFee(data.shippingFee.toString());
          setTaxRate(data.taxRate.toString());
          setRazorpayKeyId(data.razorpayKeyId || "");
          setRazorpayKeySecret(data.razorpayKeySecret || "");
          setResendApiKey(data.resendApiKey || "");
          setResendSenderEmail(data.resendSenderEmail || "");
          setCloudinaryCloudName(data.cloudinaryCloudName || "");
          setCloudinaryApiKey(data.cloudinaryApiKey || "");
          setCloudinaryApiSecret(data.cloudinaryApiSecret || "");
        }
      } catch (e) {
        console.error(e);
        showToast("error", "Failed to retrieve configurations.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        websiteName,
        storeEmail,
        storePhone,
        storeAddress,
        seoTitle,
        seoDescription,
        shippingFreeLimit: parseFloat(shippingFreeLimit),
        shippingFee: parseFloat(shippingFee),
        taxRate: parseFloat(taxRate),
        razorpayKeyId,
        razorpayKeySecret,
        resendApiKey,
        resendSenderEmail,
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret
      };

      const updated = await adminUpdateSettingsAction(payload);
      if (updated.success) {
        showToast("success", "Configurations successfully saved to store database.");
      } else {
        showToast("error", "Unable to persist store changes.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "An unexpected error occurred during update.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      showToast("error", "Please enter a test email address.");
      return;
    }
    
    try {
      setSendingTest(true);
      const res = await adminSendTestEmailAction(testEmail);
      if (res.success) {
        showToast("success", "Test email dispatched successfully.");
      } else {
        showToast("error", res.error || "Failed to send test email.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "An unexpected error occurred.");
    } finally {
      setSendingTest(false);
      setTestEmail("");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Retrieving configuration settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure global store constants, shipping brackets, and integration API credentials.</p>
        </div>
      </div>

      {/* Custom Alert Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold animate-slide-up ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
            : "bg-red-50 border-red-100 text-red-700"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> : <AlertCircle className="h-4.5 w-4.5 text-red-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Card: Store Details */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
            <Building className="h-5 w-5 text-[#4285F4]" />
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">General Store Profile</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="webname" className="text-xs font-bold text-gray-600">Website Name</Label>
              <Input 
                id="webname"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="e.g. Stack Shack Nutrition"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-600">Store Support Email Address</Label>
              <Input 
                id="email"
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                placeholder="e.g. support@stackshack.com"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-gray-600">Store Contact Phone</Label>
              <Input 
                id="phone"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-gray-600">Physical Location Address</Label>
              <Input 
                id="address"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="e.g. 104 Fit Street, Muscle City, CA 90210"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
            </div>
          </div>
        </div>

        {/* Card: SEO Header Metadata */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
            <Globe className="h-5 w-5 text-[#4285F4]" />
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">SEO & Page Metadata</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="seotitle" className="text-xs font-bold text-gray-600">Global Title Tag</Label>
              <Input 
                id="seotitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="e.g. Stack Shack Nutrition | Premium Sport Supplements Store"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seodesc" className="text-xs font-bold text-gray-600">Global Description Tag</Label>
              <textarea
                id="seodesc"
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description summary shown under search engine indexes..."
                className="w-full text-xs font-semibold border border-gray-200 px-3.5 py-2.5 rounded-xl focus:border-[#4285F4] outline-none text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Card: Cart, Tax and Shipping Bracket */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
            <DollarSign className="h-5 w-5 text-[#4285F4]" />
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Cart Shipping & Tax Brackets</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="shippingFee" className="text-xs font-bold text-gray-600">Flat Shipping Fee ($)</Label>
              <Input 
                id="shippingFee"
                type="number"
                step="0.01"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                placeholder="0.00"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shippingLimit" className="text-xs font-bold text-gray-600">Free Shipping Minimum ($)</Label>
              <Input 
                id="shippingLimit"
                type="number"
                step="0.01"
                value={shippingFreeLimit}
                onChange={(e) => setShippingFreeLimit(e.target.value)}
                placeholder="0.00"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taxRate" className="text-xs font-bold text-gray-600">Sales Tax Rate (%)</Label>
              <Input 
                id="taxRate"
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0.00"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>
          </div>
        </div>

        {/* Card: API Integration Credentials */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
            <Key className="h-5 w-5 text-[#4285F4]" />
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">API Integration Keys</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rzpkey" className="text-xs font-bold text-gray-600">Razorpay Key ID</Label>
                <Input 
                  id="rzpkey"
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  placeholder="rzp_test_..."
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rzpsecret" className="text-xs font-bold text-gray-600">Razorpay Key Secret</Label>
                <Input 
                  id="rzpsecret"
                  type="password"
                  value={razorpayKeySecret}
                  onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="resendkey" className="text-xs font-bold text-gray-600">Resend Mail API Key</Label>
                <Input 
                  id="resendkey"
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_••••••••••••••••••••••••"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resendemail" className="text-xs font-bold text-gray-600">Sender Email (From Email)</Label>
                <Input 
                  id="resendemail"
                  type="email"
                  value={resendSenderEmail}
                  onChange={(e) => setResendSenderEmail(e.target.value)}
                  placeholder="e.g. onboarding@resend.dev"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cloudinaryCloud" className="text-xs font-bold text-gray-600">Cloudinary Cloud Name</Label>
                <Input 
                  id="cloudinaryCloud"
                  value={cloudinaryCloudName}
                  onChange={(e) => setCloudinaryCloudName(e.target.value)}
                  placeholder="e.g. stackshack"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cloudinaryKey" className="text-xs font-bold text-gray-600">Cloudinary API Key</Label>
                <Input 
                  id="cloudinaryKey"
                  value={cloudinaryApiKey}
                  onChange={(e) => setCloudinaryApiKey(e.target.value)}
                  placeholder="e.g. 19238810023"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cloudinarySecret" className="text-xs font-bold text-gray-600">Cloudinary Secret</Label>
                <Input 
                  id="cloudinarySecret"
                  type="password"
                  value={cloudinaryApiSecret}
                  onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold flex items-center gap-1.5 px-5 py-3"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Configurations</span>
              </>
            )}
          </Button>
        </div>

      </form>

      {/* Card: Send Test Email */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
          <Mail className="h-5 w-5 text-[#4285F4]" />
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Test Email Integration</h2>
        </div>
        
        <form onSubmit={handleSendTestEmail} className="flex gap-3 items-end">
          <div className="space-y-1.5 flex-1 max-w-sm">
            <Label htmlFor="testemail" className="text-xs font-bold text-gray-600">Recipient Email</Label>
            <Input 
              id="testemail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="e.g. admin@stackshack.com"
              className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
            />
          </div>
          <Button
            type="submit"
            disabled={sendingTest || !testEmail}
            variant="outline"
            className="rounded-xl border-gray-200 hover:bg-gray-50 font-bold flex items-center gap-1.5 px-4 py-2"
          >
            {sendingTest ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Send className="h-4 w-4 text-[#4285F4]" />
            )}
            <span>Send Test</span>
          </Button>
        </form>
      </div>

    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { 
  adminGetCouponsAction, 
  adminAddCouponAction, 
  adminUpdateCouponAction, 
  adminDeleteCouponAction 
} from "@/app/actions";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Ticket,
  Calendar,
  Check,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"FIXED" | "PERCENTAGE">("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formMinPurchase, setFormMinPurchase] = useState("0");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await adminGetCouponsAction();
      setCoupons(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load coupon codes.");
    } finally {
      setLoading(false);
    }
  }

  const openAddDialog = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue("");
    setFormMinPurchase("0");
    setFormExpiryDate("");
    setFormUsageLimit("");
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue.toString());
    setFormMinPurchase(coupon.minPurchase.toString());
    setFormExpiryDate(
      coupon.expiryDate 
        ? new Date(coupon.expiryDate).toISOString().substring(0, 10) 
        : ""
    );
    setFormUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : "");
    setFormIsActive(coupon.isActive);
    setDialogOpen(true);
  };

  const toggleCouponActive = async (coupon: any) => {
    try {
      await adminUpdateCouponAction(coupon.id, { isActive: !coupon.isActive });
      loadData();
    } catch (e) {
      alert("Failed to toggle coupon status.");
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await adminDeleteCouponAction(id);
      loadData();
    } catch (e) {
      alert("Failed to delete coupon.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formDiscountValue) {
      alert("Coupon Code and Discount Value are required.");
      return;
    }

    try {
      setSaving(true);
      const couponPayload = {
        code: formCode.toUpperCase().replace(/\s+/g, ""),
        discountType: formDiscountType,
        discountValue: parseFloat(formDiscountValue),
        minPurchase: parseFloat(formMinPurchase || "0"),
        expiryDate: formExpiryDate ? formExpiryDate : undefined,
        usageLimit: formUsageLimit ? parseInt(formUsageLimit) : undefined,
        isActive: formIsActive
      };

      if (editingCoupon) {
        await adminUpdateCouponAction(editingCoupon.id, couponPayload);
      } else {
        await adminAddCouponAction(couponPayload);
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save coupon code. Check if coupon code already exists.");
    } finally {
      setSaving(false);
    }
  };

  const filteredCoupons = coupons.filter(c => {
    return c.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && coupons.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Retrieving coupon codes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Manage checkout discount codes, limits, and validation criteria.</p>
        </div>
        <Button 
          onClick={openAddDialog}
          className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold flex items-center gap-1.5 self-start px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Coupon</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupons by code..." 
            className="pl-10 border-gray-200 focus-visible:ring-[#4285F4] rounded-xl"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50 font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Coupon Code</th>
                <th className="px-6 py-4">Discount Value</th>
                <th className="px-6 py-4">Usage Stats</th>
                <th className="px-6 py-4">Min. Purchase</th>
                <th className="px-6 py-4">Expires On</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No discount codes created yet.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/55 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#4285F4] flex items-center justify-center">
                            <Ticket className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-gray-900 tracking-wider text-sm">{c.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 text-sm">
                          {c.discountType === "PERCENTAGE" ? `${c.discountValue}% Off` : `${formatINR(c.discountValue)} Off`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">
                          {c.usageCount} used {c.usageLimit ? `/ ${c.usageLimit} max` : "(Unlimited)"}
                        </div>
                        {c.usageLimit && c.usageCount >= c.usageLimit && (
                          <span className="text-[9px] font-bold text-red-500 uppercase mt-0.5 block">Limit Reached</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-600">
                        {c.minPurchase ? formatINR(c.minPurchase) : "None"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className={isExpired ? "text-red-500 font-bold" : ""}>
                            {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "Never"}
                          </span>
                        </div>
                        {isExpired && (
                          <span className="text-[9px] font-bold text-red-500 uppercase mt-0.5 block">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCouponActive(c)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            c.isActive && !isExpired
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                              : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                          }`}
                          disabled={isExpired}
                          title={c.isActive ? "Deactivate" : "Activate"}
                        >
                          {c.isActive && !isExpired ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditDialog(c)}
                            className="p-1.5 text-gray-500 hover:text-[#4285F4] hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCoupon(c.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white border border-gray-100 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-gray-900">
              {editingCoupon ? "Edit Coupon Code" : "Create Coupon Code"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-bold text-gray-600">Coupon Promo Code *</Label>
              <Input 
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. SUMMER20"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4] font-extrabold tracking-wider uppercase"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="discountType" className="text-xs font-bold text-gray-600">Discount Type *</Label>
                <select
                  id="discountType"
                  value={formDiscountType}
                  onChange={(e) => setFormDiscountType(e.target.value as any)}
                  className="w-full text-sm border border-gray-200 px-3 py-2.5 rounded-xl bg-white text-gray-700 focus:border-[#4285F4] outline-none"
                  required
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discountValue" className="text-xs font-bold text-gray-600">Discount Value *</Label>
                <Input 
                  id="discountValue"
                  type="number"
                  step="0.01"
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(e.target.value)}
                  placeholder={formDiscountType === "PERCENTAGE" ? "20" : "10.00"}
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minPurchase" className="text-xs font-bold text-gray-600">Min Purchase Requirement (₹)</Label>
                <Input 
                  id="minPurchase"
                  type="number"
                  step="0.01"
                  value={formMinPurchase}
                  onChange={(e) => setFormMinPurchase(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usageLimit" className="text-xs font-bold text-gray-600">Max Usage Limit</Label>
                <Input 
                  id="usageLimit"
                  type="number"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiryDate" className="text-xs font-bold text-gray-600">Expiration Date</Label>
              <Input 
                id="expiryDate"
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
            </div>

            {/* Active Switch */}
            <div className="bg-gray-50/60 p-4 rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formIsActive} 
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                />
                <div className="text-xs font-bold text-gray-700">Enabled (Can be applied at checkout)</div>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Coupon"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

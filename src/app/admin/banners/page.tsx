"use client";

import { useEffect, useState } from "react";
import { 
  getBannersAction, 
  adminAddBannerAction, 
  adminUpdateBannerAction, 
  adminDeleteBannerAction,
  adminReorderBannersAction
} from "@/app/actions";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Upload,
  X,
  Check,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formMobileImage, setFormMobileImage] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getBannersAction(false);
      const safeData = Array.isArray(data) ? data : [];
      setBanners(safeData.sort((a, b) => a.order - b.order));
    } catch (err: any) {
      console.error(err);
      setError("Failed to retrieve home banners.");
    } finally {
      setLoading(false);
    }
  }

  const openAddDialog = () => {
    setEditingBanner(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormDescription("");
    setFormImage("");
    setFormMobileImage("");
    setFormLink("");
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (banner: any) => {
    setEditingBanner(banner);
    setFormTitle(banner.title);
    setFormSubtitle(banner.subtitle || "");
    setFormDescription(banner.description || "");
    setFormImage(banner.image || "");
    setFormMobileImage(banner.mobileImage || "");
    setFormLink(banner.link || "");
    setFormIsActive(banner.isActive);
    setDialogOpen(true);
  };


  const toggleBannerActive = async (banner: any) => {
    try {
      await adminUpdateBannerAction(banner.id, { isActive: !banner.isActive });
      loadData();
    } catch (e) {
      alert("Failed to toggle banner status.");
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner slide?")) return;
    try {
      await adminDeleteBannerAction(id);
      loadData();
    } catch (e) {
      alert("Failed to delete banner slide.");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const list = [...banners];
    // Swap elements
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Persist new ordering in DB
    try {
      setBanners(list); // optimistic update
      const orderedIds = list.map(b => b.id);
      await adminReorderBannersAction(orderedIds);
      loadData();
    } catch (e) {
      alert("Failed to reorder banners.");
      loadData();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formImage) {
      alert("Banner Title and Desktop Image are required.");
      return;
    }

    try {
      setSaving(true);
      
      const bannerPayload = {
        title: formTitle,
        subtitle: formSubtitle || undefined,
        description: formDescription || undefined,
        image: formImage,
        mobileImage: formMobileImage || null,
        link: formLink || undefined,
        isActive: formIsActive
      };

      if (editingBanner) {
        await adminUpdateBannerAction(editingBanner.id, bannerPayload);
      } else {
        await adminAddBannerAction(bannerPayload);
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save banner slide.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Loading banner slides...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Home Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the dynamic sliding promotional banners shown on the client homepage.</p>
        </div>
        <Button 
          onClick={openAddDialog}
          className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold flex items-center gap-1.5 self-start px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Banner</span>
        </Button>
      </div>

      {/* Banner Slides List */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
            <span className="text-xs">No banners added yet. Create one above to start sliding promo offers on the store.</span>
          </div>
        ) : (
          banners.map((b, index) => (
            <div 
              key={b.id} 
              className="flex flex-col md:flex-row gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs items-center"
            >
              {/* Preview image */}
              <div className="relative w-full md:w-48 aspect-video shrink-0 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                <img
                  src={b.image}
                  alt={b.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = "flex";
                  }}
                />
                <div className="hidden items-center justify-center w-full h-full text-xs text-gray-400 font-medium">
                  No Preview
                </div>
                <span className="absolute top-2 left-2 text-[9px] font-black text-white bg-black/60 px-2 py-0.5 rounded-full z-10">
                  Index {index + 1}
                </span>
              </div>

              {/* Text metadata */}
              <div className="flex-1 min-w-0 self-start md:self-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{b.title}</h3>
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    b.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                  }`}>
                    {b.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                {b.subtitle && <p className="text-xs text-[#4285F4] font-semibold mt-0.5">{b.subtitle}</p>}
                {b.description && <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{b.description}</p>}
                {b.link && (
                  <a 
                    href={b.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-gray-400 hover:text-[#4285F4] inline-flex items-center gap-1 font-bold mt-2 hover:underline"
                  >
                    <span>Link: {b.link}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Order Controls & Actions */}
              <div className="flex shrink-0 items-center gap-2 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-2 text-gray-500 hover:text-[#4285F4] disabled:opacity-30 disabled:hover:text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 disabled:hover:bg-transparent"
                    title="Move Up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === banners.length - 1}
                    className="p-2 text-gray-500 hover:text-[#4285F4] disabled:opacity-30 disabled:hover:text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 disabled:hover:bg-transparent"
                    title="Move Down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleBannerActive(b)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      b.isActive 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                        : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                    }`}
                    title={b.isActive ? "Deactivate" : "Activate"}
                  >
                    {b.isActive ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEditDialog(b)}
                    className="p-2 text-gray-500 hover:text-[#4285F4] hover:bg-gray-50 border border-gray-100 rounded-xl"
                    title="Edit Banner"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteBanner(b.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl"
                    title="Delete Slide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CRUD dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white border border-gray-100 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-gray-900">
              {editingBanner ? "Edit Banner" : "Add Banner"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-gray-600">Banner Title *</Label>
              <Input 
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Summer Super Sale"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subtitle" className="text-xs font-bold text-gray-600">Subtitle Promo Badge</Label>
              <Input 
                id="subtitle"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="e.g. UP TO 50% OFF"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-gray-600">Tagline Description</Label>
              <Input 
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Fuel your workouts with premium sports supplements"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link" className="text-xs font-bold text-gray-600">Redirection URL Link</Label>
              <Input 
                id="link"
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="e.g. /shop?category=proteins"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
            </div>

            {/* Desktop Banner Image URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600">Desktop Banner Image URL *</Label>
              <div className="text-[10px] text-gray-500 mb-1">Recommended: 1600 × 600 px (8:3) public URL</div>
              <Input 
                type="text"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="e.g. https://example.com/desktop-banner.jpg"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
              {formImage && (
                <div className="relative w-full aspect-[8/3] rounded-xl bg-gray-50 border border-gray-100 overflow-hidden mt-2 flex items-center justify-center">
                  <img
                    src={formImage}
                    alt="Desktop Banner preview"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = "flex";
                    }}
                    onLoad={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "block";
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = "none";
                    }}
                  />
                  <div className="hidden items-center justify-center w-full h-full text-xs text-gray-400 font-medium">
                    Image failed to load
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Banner Image URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600">Mobile Banner Image URL (Optional)</Label>
              <div className="text-[10px] text-gray-500 mb-1">Recommended: 800 × 1000 px (4:5) public URL. Falls back to Desktop if empty.</div>
              <Input 
                type="text"
                value={formMobileImage}
                onChange={(e) => setFormMobileImage(e.target.value)}
                placeholder="e.g. https://example.com/mobile-banner.jpg"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
              {formMobileImage && (
                <div className="relative w-[160px] aspect-[4/5] mx-auto rounded-xl bg-gray-50 border border-gray-100 overflow-hidden mt-2 flex items-center justify-center">
                  <img
                    src={formMobileImage}
                    alt="Mobile Banner preview"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = "flex";
                    }}
                    onLoad={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "block";
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = "none";
                    }}
                  />
                  <div className="hidden items-center justify-center w-full h-full text-xs text-gray-400 font-medium">
                    Image failed to load
                  </div>
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="bg-gray-50/60 p-4 rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formIsActive} 
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                />
                <div className="text-xs font-bold text-gray-700">Enabled (Visible in homepage slider)</div>
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
                  "Save Banner"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

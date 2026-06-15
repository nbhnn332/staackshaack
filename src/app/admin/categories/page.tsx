"use client";

import { useEffect, useState } from "react";
import { 
  getCategoriesAction, 
  adminAddCategoryAction, 
  adminUpdateCategoryAction, 
  adminDeleteCategoryAction,
  getProductsAction
} from "@/app/actions";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Upload,
  X,
  Check,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const cats = await getCategoriesAction(false);
      const prods = await getProductsAction({ onlyActive: false });
      setCategories(cats);
      setProducts(prods);
    } catch (err: any) {
      console.error(err);
      setError("Failed to retrieve categories list.");
    } finally {
      setLoading(false);
    }
  }

  // Handle slug auto-fill
  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingCategory) {
      setFormSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormImage("");
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (category: any) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormImage(category.image || "");
    setFormIsActive(category.isActive);
    setDialogOpen(true);
  };

  // Convert file to base64 string
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setFormImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormImage("");
  };

  const toggleCategoryActive = async (category: any) => {
    try {
      await adminUpdateCategoryAction(category.id, { isActive: !category.isActive });
      loadData();
    } catch (e) {
      alert("Failed to toggle category status.");
    }
  };

  const deleteCategory = async (id: string) => {
    const totalLinkedProds = products.filter(p => p.categoryId === id).length;
    if (totalLinkedProds > 0) {
      alert(`Cannot delete this category. There are ${totalLinkedProds} products assigned to it. Move or delete those products first.`);
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await adminDeleteCategoryAction(id);
      loadData();
    } catch (e) {
      alert("Failed to delete category.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSlug) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const categoryPayload = {
        name: formName,
        slug: formSlug,
        image: formImage,
        isActive: formIsActive
      };

      if (editingCategory) {
        await adminUpdateCategoryAction(editingCategory.id, categoryPayload);
      } else {
        await adminAddCategoryAction(categoryPayload);
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save category. Ensure slug is unique and inputs are correct.");
    } finally {
      setSaving(false);
    }
  };

  // Filters logic
  const filteredCategories = categories.filter((c) => {
    return c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           c.slug.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Retrieving categories list...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage categories, icons, and visibility across store navigation.</p>
        </div>
        <Button 
          onClick={openAddDialog}
          className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold flex items-center gap-1.5 self-start px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or slug..." 
            className="pl-10 border-gray-200 focus-visible:ring-[#4285F4] rounded-xl"
          />
        </div>
      </div>

      {/* Categories Grid Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50 font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Image & Category Name</th>
                <th className="px-6 py-4">Slug Identifier</th>
                <th className="px-6 py-4">Linked Products</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No categories found matching filters.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const linkedProductsCount = products.filter(p => p.categoryId === c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/55 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center p-1 border border-gray-100 overflow-hidden">
                            <img 
                              src={c.image || "/placeholder-category.png"} 
                              alt={c.name} 
                              width="40"
                              height="40"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 truncate max-w-[200px]">{c.name}</h4>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">
                        {c.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800">{linkedProductsCount} items</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCategoryActive(c)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            c.isActive 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                              : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                          }`}
                          title={c.isActive ? "Deactivate" : "Activate"}
                        >
                          {c.isActive ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
                            onClick={() => deleteCategory(c.id)}
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
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="catName" className="text-xs font-bold text-gray-600">Category Name *</Label>
              <Input 
                id="catName"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Proteins"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catSlug" className="text-xs font-bold text-gray-600">Slug Identifier *</Label>
              <Input 
                id="catSlug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. proteins"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
            </div>

            {/* Category Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="categoryImage" className="text-xs font-bold text-gray-600">Category Banner/Icon Image URL</Label>
              <Input 
                id="categoryImage"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/photo-..."
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
              />
              {formImage && (
                <div className="relative h-20 w-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1 overflow-hidden mt-2">
                  <img src={formImage} alt="Category preview" width="80" height="80" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
              )}
            </div>

            {/* Switch / Checkbox */}
            <div className="bg-gray-50/60 p-4 rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formIsActive} 
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                />
                <div className="text-xs font-bold text-gray-700">Enabled (Active in navigation/filters)</div>
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
                  "Save Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

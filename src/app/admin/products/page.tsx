"use client";

import { useEffect, useState } from "react";
import { 
  getProductsAction, 
  getCategoriesAction, 
  adminAddProductAction, 
  adminUpdateProductAction, 
  adminDeleteProductAction 
} from "@/app/actions";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Upload,
  X,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportToCSV } from "@/lib/csv";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleExportCSV = () => {
    const dataToExport = filteredProducts.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      return {
        "Product Name": p.name,
        "Category": cat?.name || "Uncategorized",
        "Price": p.price,
        "Stock": p.stock,
        "Active Status": p.isActive ? "Yes" : "No",
        "Created Date": p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
        "Weight": `${p.weight || 1} ${p.weightUnit || "kg"}`,
      };
    });
    exportToCSV(dataToExport, "stack_shack_products");
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCompareAtPrice, setFormCompareAtPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsNewArrival, setFormIsNewArrival] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formWeight, setFormWeight] = useState("");
  const [formWeightUnit, setFormWeightUnit] = useState("kg");
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleAddImageUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setFormImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const prods = await getProductsAction({ onlyActive: undefined });
      const cats = await getCategoriesAction(false);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      console.error(err);
      setError("Failed to retrieve products or categories list.");
    } finally {
      setLoading(false);
    }
  }

  // Handle slug auto-fill
  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingProduct) {
      setFormSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormPrice("");
    setFormCompareAtPrice("");
    setFormCategoryId(categories[0]?.id || "");
    setFormStock("");
    setFormWeight("1");
    setFormWeightUnit("kg");
    setFormImages([]);
    setNewImageUrl("");
    setFormIsFeatured(false);
    setFormIsBestSeller(false);
    setFormIsNewArrival(false);
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormDescription(product.description || "");
    setFormPrice(product.price.toString());
    setFormCompareAtPrice(product.compareAtPrice ? product.compareAtPrice.toString() : "");
    setFormCategoryId(product.categoryId);
    setFormStock(product.stock.toString());
    setFormWeight(product.weight?.toString() || "1");
    setFormWeightUnit(product.weightUnit || "kg");
    setFormImages(product.images || []);
    setNewImageUrl("");
    setFormIsFeatured(product.isFeatured);
    setFormIsBestSeller(product.isBestSeller);
    setFormIsNewArrival(product.isNewArrival);
    setFormIsActive(product.isActive);
    setDialogOpen(true);
  };

  // Convert files to base64 strings
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleProductActive = async (product: any) => {
    try {
      await adminUpdateProductAction(product.id, { isActive: !product.isActive });
      loadData();
    } catch (e) {
      alert("Failed to toggle product status.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await adminDeleteProductAction(id);
      loadData();
    } catch (e) {
      alert("Failed to delete product.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSlug || !formPrice || !formCategoryId || formStock === "") {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const productPayload = {
        name: formName,
        slug: formSlug,
        description: formDescription,
        price: parseFloat(formPrice),
        compareAtPrice: formCompareAtPrice ? parseFloat(formCompareAtPrice) : undefined,
        categoryId: formCategoryId,
        stock: parseInt(formStock),
        weight: parseFloat(formWeight) || 1,
        weightUnit: formWeightUnit,
        images: formImages,
        isFeatured: formIsFeatured,
        isBestSeller: formIsBestSeller,
        isNewArrival: formIsNewArrival,
        isActive: formIsActive,
      };

      if (editingProduct) {
        await adminUpdateProductAction(editingProduct.id, productPayload);
      } else {
        await adminAddProductAction(productPayload);
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save product. Ensure slug is unique and inputs are correct.");
    } finally {
      setSaving(false);
    }
  };

  // Filters logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
    const matchesStock = !stockFilter || 
                         (stockFilter === "outOfStock" && p.stock === 0) ||
                         (stockFilter === "lowStock" && p.stock > 0 && p.stock < 5);
    return matchesSearch && matchesCategory && matchesStock;
  });

  if (loading && products.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Retrieving products list...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage catalog details, inventory levels, and visibility status.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-xl border-gray-200 text-xs font-bold px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-1.5"
          >
            <span>Export CSV</span>
          </Button>
          <Button 
            onClick={openAddDialog}
            className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold flex items-center gap-1.5 px-4 py-2.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..." 
            className="pl-10 border-gray-200 focus-visible:ring-[#4285F4] rounded-xl"
          />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold border border-gray-200 px-3.5 py-2.5 rounded-xl bg-white text-gray-700 outline-none focus:border-[#4285F4]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="text-xs font-semibold border border-gray-200 px-3.5 py-2.5 rounded-xl bg-white text-gray-700 outline-none focus:border-[#4285F4]"
          >
            <option value="">All Stock Levels</option>
            <option value="lowStock">Low Stock (&lt; 5)</option>
            <option value="outOfStock">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50 font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Image & Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Flags</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/55 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center p-1 border border-gray-100 overflow-hidden">
                            <img 
                              src={p.images?.[0] || "/placeholder-product.png"} 
                              alt={p.name} 
                              width="40"
                              height="40"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate max-w-[180px]">
                              {p.name}
                            </h4>

                            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">
                        {cat?.name || "Uncategorized"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{formatINR(p.price)}</div>
                        {p.compareAtPrice && (
                          <div className="text-[10px] text-gray-400 line-through mt-0.5">{formatINR(p.compareAtPrice)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.stock === 0 
                            ? "bg-red-50 text-red-600" 
                            : p.stock < 5 
                            ? "bg-amber-50 text-amber-600" 
                            : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {p.stock} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.isFeatured && <span className="bg-blue-50 text-[#4285F4] text-[9px] font-extrabold px-1.5 py-0.5 rounded">Featured</span>}
                          {p.isBestSeller && <span className="bg-purple-50 text-purple-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded">Best</span>}
                          {p.isNewArrival && <span className="bg-indigo-50 text-indigo-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded">New</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleProductActive(p)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            p.isActive 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                              : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                          }`}
                          title={p.isActive ? "Deactivate" : "Activate"}
                        >
                          {p.isActive ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditDialog(p)}
                            className="p-1.5 text-gray-500 hover:text-[#4285F4] hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-gray-100 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-gray-900">
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-gray-600">Product Name *</Label>
                <Input 
                  id="name"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Whey Protein Isolate"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-bold text-gray-600">Slug *</Label>
                <Input 
                  id="slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. whey-protein-isolate"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-bold text-gray-600">Price (₹) *</Label>
                <Input 
                  id="price"
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="compareAtPrice" className="text-xs font-bold text-gray-600">Compare At Price (₹)</Label>
                <Input 
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  value={formCompareAtPrice}
                  onChange={(e) => setFormCompareAtPrice(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold text-gray-600">Category *</Label>
                <select
                  id="category"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full text-sm border border-gray-200 px-3 py-2.5 rounded-xl bg-white text-gray-700 focus:border-[#4285F4] outline-none"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock" className="text-xs font-bold text-gray-600">Stock Count *</Label>
                <Input 
                  id="stock"
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="0"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="weight" className="text-xs font-bold text-gray-600">Weight *</Label>
                <Input 
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  placeholder="1"
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weightUnit" className="text-xs font-bold text-gray-600">Weight Unit *</Label>
                <select
                  id="weightUnit"
                  value={formWeightUnit}
                  onChange={(e) => setFormWeightUnit(e.target.value)}
                  className="w-full text-sm border border-gray-200 px-3 py-2.5 rounded-xl bg-white text-gray-700 focus:border-[#4285F4] outline-none"
                  required
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lbs">lbs</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-gray-600">Description</Label>
              <textarea
                id="description"
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Product properties, highlights, usage instructions..."
                className="w-full text-sm border border-gray-200 px-3.5 py-2.5 rounded-xl focus:border-[#4285F4] outline-none"
              />
            </div>

            {/* Images URL List & Text Field */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-gray-600">Product Images</Label>
              <div className="flex gap-2">
                <Input 
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4] flex-1"
                />
                <Button 
                  onClick={handleAddImageUrl}
                  type="button"
                  className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold"
                >
                  Add URL
                </Button>
              </div>

              {formImages.length > 0 && (
                <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 mt-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  {formImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1 group overflow-hidden">
                      <img src={img} alt="Product preview" width="80" height="80" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Switches / Checkboxes */}
            <div className="bg-gray-50/60 p-4 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Product Attributes</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formIsFeatured} 
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                  />
                  <div className="text-xs font-bold text-gray-700">Featured Product</div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formIsBestSeller} 
                    onChange={(e) => setFormIsBestSeller(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                  />
                  <div className="text-xs font-bold text-gray-700">Best Seller</div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formIsNewArrival} 
                    onChange={(e) => setFormIsNewArrival(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                  />
                  <div className="text-xs font-bold text-gray-700">New Arrival</div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formIsActive} 
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                  />
                  <div className="text-xs font-bold text-gray-700">Enabled (Visible in store)</div>
                </label>
              </div>
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
                  "Save Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

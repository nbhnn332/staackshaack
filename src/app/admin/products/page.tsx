"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  getProductsAction, 
  getCategoriesAction, 
  adminAddProductAction, 
  adminUpdateProductAction, 
  adminDeleteProductAction,
  getVariantsByProductAction,
  adminSaveVariantsAction,
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
  EyeOff,
  RefreshCw,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportToCSV } from "@/lib/csv";
import { ProductVariant } from "@/lib/mock-db";

// ── Variant row type used locally in form state ─────────────────
interface VariantRow {
  id?: string;
  weightLabel: string;
  flavourLabel: string;
  price: string;
  mrp: string;
  stock: string;
  sku: string;
  isActive: boolean;
}

function buildCombinations(weights: string[], flavours: string[]): VariantRow[] {
  const rows: VariantRow[] = [];
  const ws = weights.filter(Boolean);
  const fs = flavours.filter(Boolean);

  if (ws.length === 0 && fs.length === 0) return rows;
  if (ws.length === 0) {
    fs.forEach((f) => rows.push({ weightLabel: "", flavourLabel: f, price: "", mrp: "", stock: "0", sku: "", isActive: true }));
  } else if (fs.length === 0) {
    ws.forEach((w) => rows.push({ weightLabel: w, flavourLabel: "", price: "", mrp: "", stock: "0", sku: "", isActive: true }));
  } else {
    ws.forEach((w) => fs.forEach((f) => rows.push({ weightLabel: w, flavourLabel: f, price: "", mrp: "", stock: "0", sku: "", isActive: true })));
  }
  return rows;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "variants">("basic");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Basic Info form states
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
  const [formWeight, setFormWeight] = useState("1");
  const [formWeightUnit, setFormWeightUnit] = useState("kg");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Variants form states
  const [weightOptions, setWeightOptions] = useState<string[]>([]);
  const [flavourOptions, setFlavourOptions] = useState<string[]>([]);
  const [newWeightInput, setNewWeightInput] = useState("");
  const [newFlavourInput, setNewFlavourInput] = useState("");
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Suggested quick-add options
  const SUGGESTED_WEIGHTS = ["100 g", "250 g", "500 g", "750 g", "1 kg", "2 kg", "5 kg"];
  const SUGGESTED_FLAVOURS = ["Chocolate", "Vanilla", "Strawberry", "Mango", "Malai Kulfi", "Coffee", "Unflavoured"];

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
      };
    });
    exportToCSV(dataToExport, "stack_shack_products");
  };

  const handleAddImageUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setFormImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        getProductsAction({ onlyActive: undefined }),
        getCategoriesAction(false),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      setError("Failed to retrieve products or categories list.");
    } finally {
      setLoading(false);
    }
  }

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingProduct) {
      setFormSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const resetForm = () => {
    setFormName(""); setFormSlug(""); setFormDescription("");
    setFormPrice(""); setFormCompareAtPrice(""); setFormCategoryId(categories[0]?.id || "");
    setFormStock(""); setFormWeight("1"); setFormWeightUnit("kg");
    setFormImages([]); setNewImageUrl("");
    setFormIsFeatured(false); setFormIsBestSeller(false); setFormIsNewArrival(false); setFormIsActive(true);
    setWeightOptions([]); setFlavourOptions([]); setVariantRows([]);
    setNewWeightInput(""); setNewFlavourInput("");
    setActiveTab("basic");
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = async (product: any) => {
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
    setNewWeightInput(""); setNewFlavourInput("");
    setActiveTab("basic");
    setDialogOpen(true);

    // Load existing variants
    setVariantsLoading(true);
    try {
      const existingVariants: ProductVariant[] = await getVariantsByProductAction(product.id);
      if (existingVariants.length > 0) {
        const weights = [...new Set(existingVariants.map((v) => v.weightLabel).filter(Boolean))];
        const flavours = [...new Set(existingVariants.map((v) => v.flavourLabel).filter(Boolean))];
        setWeightOptions(weights);
        setFlavourOptions(flavours);
        setVariantRows(existingVariants.map((v) => ({
          id: v.id,
          weightLabel: v.weightLabel,
          flavourLabel: v.flavourLabel,
          price: v.price.toString(),
          mrp: v.mrp?.toString() || "",
          stock: v.stock.toString(),
          sku: v.sku || "",
          isActive: v.isActive,
        })));
      } else {
        setWeightOptions([]); setFlavourOptions([]); setVariantRows([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVariantsLoading(false);
    }
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

  // ── Variant helpers ─────────────────────────────────────
  const addWeightOption = (w: string) => {
    const trimmed = w.trim();
    if (!trimmed || weightOptions.includes(trimmed)) return;
    setWeightOptions((prev) => [...prev, trimmed]);
    setNewWeightInput("");
  };

  const removeWeightOption = (w: string) => {
    setWeightOptions((prev) => prev.filter((x) => x !== w));
    setVariantRows((prev) => prev.filter((r) => r.weightLabel !== w));
  };

  const addFlavourOption = (f: string) => {
    const trimmed = f.trim();
    if (!trimmed || flavourOptions.includes(trimmed)) return;
    setFlavourOptions((prev) => [...prev, trimmed]);
    setNewFlavourInput("");
  };

  const removeFlavourOption = (f: string) => {
    setFlavourOptions((prev) => prev.filter((x) => x !== f));
    setVariantRows((prev) => prev.filter((r) => r.flavourLabel !== f));
  };

  const generateCombinations = () => {
    const existing = variantRows;
    const newRows = buildCombinations(weightOptions, flavourOptions);
    // Preserve existing values where combination already existed
    const merged = newRows.map((nr) => {
      const found = existing.find(
        (er) => er.weightLabel === nr.weightLabel && er.flavourLabel === nr.flavourLabel
      );
      return found || nr;
    });
    setVariantRows(merged);
  };

  const updateVariantRow = (index: number, field: keyof VariantRow, value: string | boolean) => {
    setVariantRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const bulkSetPrice = () => {
    const val = prompt("Set price for all variants:");
    if (!val) return;
    setVariantRows((prev) => prev.map((r) => ({ ...r, price: val })));
  };

  const bulkSetStock = () => {
    const val = prompt("Set stock for all variants:");
    if (!val) return;
    setVariantRows((prev) => prev.map((r) => ({ ...r, stock: val })));
  };

  // ── Form Submit ─────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSlug || !formPrice || !formCategoryId || formStock === "") {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const productPayload = {
        name: formName, slug: formSlug, description: formDescription,
        price: parseFloat(formPrice),
        compareAtPrice: formCompareAtPrice ? parseFloat(formCompareAtPrice) : undefined,
        categoryId: formCategoryId,
        stock: parseInt(formStock),
        weight: parseFloat(formWeight) || 1,
        weightUnit: formWeightUnit,
        images: formImages,
        isFeatured: formIsFeatured, isBestSeller: formIsBestSeller,
        isNewArrival: formIsNewArrival, isActive: formIsActive,
      };

      let savedProductId: string;
      if (editingProduct) {
        const res = await adminUpdateProductAction(editingProduct.id, productPayload);
        savedProductId = editingProduct.id;
      } else {
        const res = await adminAddProductAction(productPayload);
        savedProductId = (res as any).product?.id || "";
      }

      // Save variants if any rows exist
      if (variantRows.length > 0 && savedProductId) {
        const variantPayload = variantRows
          .filter((r) => r.price !== "")
          .map((r) => ({
            id: r.id,
            weightLabel: r.weightLabel,
            flavourLabel: r.flavourLabel,
            price: parseFloat(r.price) || 0,
            mrp: r.mrp ? parseFloat(r.mrp) : null,
            stock: parseInt(r.stock) || 0,
            sku: r.sku || null,
            isActive: r.isActive,
          }));
        await adminSaveVariantsAction(savedProductId, variantPayload);
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save product: " + err.message);
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
          <p className="text-sm text-gray-500 mt-1">Manage catalog details, variants, inventory levels, and visibility status.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-xl border-gray-200 text-xs font-bold px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
          >
            Export CSV
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

      {/* Filters */}
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
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
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
                <th className="px-6 py-4">Image &amp; Product</th>
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
                              width="40" height="40"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate max-w-[180px]">{p.name}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">{cat?.name || "Uncategorized"}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{formatINR(p.price)}</div>
                        {p.compareAtPrice && (
                          <div className="text-[10px] text-gray-400 line-through mt-0.5">{formatINR(p.compareAtPrice)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.stock === 0 ? "bg-red-50 text-red-600" : p.stock < 5 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
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

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-gray-100 p-0 shadow-xl">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-lg font-black tracking-tight text-gray-900">
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>

            {/* Tab switcher */}
            <div className="flex gap-1 mt-4 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                  activeTab === "basic"
                    ? "border-[#4285F4] text-[#4285F4]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("variants")}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                  activeTab === "variants"
                    ? "border-[#4285F4] text-[#4285F4]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Variants
                {variantRows.length > 0 && (
                  <span className="bg-[#4285F4] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {variantRows.length}
                  </span>
                )}
              </button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSave}>
            {/* ── BASIC INFO TAB ──────────────────────────────── */}
            <div className={`px-6 py-5 space-y-5 ${activeTab !== "basic" ? "hidden" : ""}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-gray-600">Product Name *</Label>
                  <Input
                    id="name" value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Whey Protein Isolate"
                    className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]" required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-xs font-bold text-gray-600">Slug *</Label>
                  <Input
                    id="slug" value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. whey-protein-isolate"
                    className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]" required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-bold text-gray-600">Base Price (₹) *</Label>
                  <Input
                    id="price" type="number" step="0.01" value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]" required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="compareAtPrice" className="text-xs font-bold text-gray-600">Compare At Price (₹)</Label>
                  <Input
                    id="compareAtPrice" type="number" step="0.01" value={formCompareAtPrice}
                    onChange={(e) => setFormCompareAtPrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-bold text-gray-600">Category *</Label>
                  <select
                    id="category" value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full text-sm border border-gray-200 px-3 py-2.5 rounded-xl bg-white text-gray-700 focus:border-[#4285F4] outline-none" required
                  >
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stock" className="text-xs font-bold text-gray-600">Base Stock *</Label>
                  <Input
                    id="stock" type="number" value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="0"
                    className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]" required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-gray-600">Description</Label>
                <textarea
                  id="description" rows={3} value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Product properties, highlights, usage instructions..."
                  className="w-full text-sm border border-gray-200 px-3.5 py-2.5 rounded-xl focus:border-[#4285F4] outline-none"
                />
              </div>

              {/* Images */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-gray-600">Product Images</Label>
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4] flex-1"
                  />
                  <Button onClick={handleAddImageUrl} type="button" className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold">
                    Add URL
                  </Button>
                </div>
                {formImages.length > 0 && (
                  <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 mt-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    {formImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1 group overflow-hidden">
                        <img src={img} alt="Product preview" width="80" height="80" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button" onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attributes */}
              <div className="bg-gray-50/60 p-4 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Product Attributes</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Featured Product", val: formIsFeatured, setter: setFormIsFeatured },
                    { label: "Best Seller", val: formIsBestSeller, setter: setFormIsBestSeller },
                    { label: "New Arrival", val: formIsNewArrival, setter: setFormIsNewArrival },
                    { label: "Enabled (Visible in store)", val: formIsActive, setter: setFormIsActive },
                  ].map(({ label, val, setter }) => (
                    <label key={label} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox" checked={val}
                        onChange={(e) => setter(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                      />
                      <div className="text-xs font-bold text-gray-700">{label}</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── VARIANTS TAB ────────────────────────────────── */}
            <div className={`px-6 py-5 space-y-6 ${activeTab !== "variants" ? "hidden" : ""}`}>
              {variantsLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin text-[#4285F4]" />
                  <span className="ml-2 text-sm">Loading variants...</span>
                </div>
              ) : (
                <>
                  {/* Weight Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Weight / Size Options</Label>
                    </div>
                    {/* Quick suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_WEIGHTS.map((w) => (
                        <button
                          key={w} type="button"
                          onClick={() => addWeightOption(w)}
                          disabled={weightOptions.includes(w)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                            weightOptions.includes(w)
                              ? "border-[#4285F4] bg-blue-50 text-[#4285F4] cursor-default"
                              : "border-gray-200 text-gray-500 hover:border-[#4285F4] hover:text-[#4285F4] cursor-pointer"
                          }`}
                        >
                          {weightOptions.includes(w) ? <Check className="h-3 w-3 inline mr-0.5" /> : <Plus className="h-3 w-3 inline mr-0.5" />}
                          {w}
                        </button>
                      ))}
                    </div>
                    {/* Custom input */}
                    <div className="flex gap-2">
                      <Input
                        value={newWeightInput}
                        onChange={(e) => setNewWeightInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWeightOption(newWeightInput); }}}
                        placeholder="Custom weight (e.g. 750 g)"
                        className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4] text-sm"
                      />
                      <Button type="button" onClick={() => addWeightOption(newWeightInput)} className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold shrink-0">
                        Add
                      </Button>
                    </div>
                    {/* Selected weights */}
                    {weightOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {weightOptions.map((w) => (
                          <span key={w} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#4285F4] rounded-xl text-xs font-bold">
                            {w}
                            <button type="button" onClick={() => removeWeightOption(w)} className="hover:text-red-500 transition-colors cursor-pointer">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flavour Options */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Flavour Options</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_FLAVOURS.map((f) => (
                        <button
                          key={f} type="button"
                          onClick={() => addFlavourOption(f)}
                          disabled={flavourOptions.includes(f)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                            flavourOptions.includes(f)
                              ? "border-[#4285F4] bg-blue-50 text-[#4285F4] cursor-default"
                              : "border-gray-200 text-gray-500 hover:border-[#4285F4] hover:text-[#4285F4] cursor-pointer"
                          }`}
                        >
                          {flavourOptions.includes(f) ? <Check className="h-3 w-3 inline mr-0.5" /> : <Plus className="h-3 w-3 inline mr-0.5" />}
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newFlavourInput}
                        onChange={(e) => setNewFlavourInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFlavourOption(newFlavourInput); }}}
                        placeholder="Custom flavour (e.g. Peanut Butter)"
                        className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4] text-sm"
                      />
                      <Button type="button" onClick={() => addFlavourOption(newFlavourInput)} className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold shrink-0">
                        Add
                      </Button>
                    </div>
                    {flavourOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {flavourOptions.map((f) => (
                          <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#4285F4] rounded-xl text-xs font-bold">
                            {f}
                            <button type="button" onClick={() => removeFlavourOption(f)} className="hover:text-red-500 transition-colors cursor-pointer">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generate combinations button */}
                  {(weightOptions.length > 0 || flavourOptions.length > 0) && (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={generateCombinations}
                        className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Generate All Combinations
                      </Button>
                      {variantRows.length > 0 && (
                        <>
                          <Button type="button" onClick={bulkSetPrice} variant="outline" className="rounded-xl border-gray-200 text-xs font-bold cursor-pointer">
                            Bulk Set Price
                          </Button>
                          <Button type="button" onClick={bulkSetStock} variant="outline" className="rounded-xl border-gray-200 text-xs font-bold cursor-pointer">
                            Bulk Set Stock
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Variant rows table */}
                  {variantRows.length > 0 && (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100">
                              <th className="px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wide">Weight</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wide">Flavour</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wide">Price (₹) *</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wide">MRP (₹)</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wide">Stock *</th>
                              <th className="px-3 py-3 text-left font-bold text-gray-500 uppercase tracking-wide">SKU</th>
                              <th className="px-3 py-3 text-center font-bold text-gray-500 uppercase tracking-wide">Active</th>
                              <th className="px-3 py-3"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {variantRows.map((row, i) => (
                              <tr key={i} className={`transition-colors ${row.isActive ? "bg-white" : "bg-gray-50/50 opacity-60"}`}>
                                <td className="px-3 py-2.5">
                                  <span className="font-semibold text-gray-700">{row.weightLabel || <span className="text-gray-300 italic">—</span>}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-semibold text-gray-700">{row.flavourLabel || <span className="text-gray-300 italic">—</span>}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="number" step="0.01" min="0"
                                    value={row.price}
                                    onChange={(e) => updateVariantRow(i, "price", e.target.value)}
                                    placeholder="0.00"
                                    className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#4285F4]"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="number" step="0.01" min="0"
                                    value={row.mrp}
                                    onChange={(e) => updateVariantRow(i, "mrp", e.target.value)}
                                    placeholder="0.00"
                                    className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#4285F4]"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="number" min="0"
                                    value={row.stock}
                                    onChange={(e) => updateVariantRow(i, "stock", e.target.value)}
                                    placeholder="0"
                                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#4285F4]"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={row.sku}
                                    onChange={(e) => updateVariantRow(i, "sku", e.target.value)}
                                    placeholder="SKU-001"
                                    className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#4285F4]"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={row.isActive}
                                    onChange={(e) => updateVariantRow(i, "isActive", e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#4285F4]"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => setVariantRows((prev) => prev.filter((_, j) => j !== i))}
                                    className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {variantRows.length === 0 && (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No variants yet</p>
                      <p className="text-xs mt-1">Add weight/size and flavour options above, then click "Generate All Combinations".</p>
                      <p className="text-xs mt-1 text-gray-300">Products with no variants will show price and stock from Basic Info.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="px-6 pb-6 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold">
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

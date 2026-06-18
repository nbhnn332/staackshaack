"use client";

import { useEffect, useState } from "react";
import { 
  adminGetOrdersAction, 
  adminUpdateOrderStatusAction, 
  adminUpdateOrderTrackingAction,
  getProductsAction
} from "@/app/actions";
import { 
  Search, 
  Loader2, 
  ClipboardList, 
  Printer,
  Truck,
  Eye,
  Mail,
  User,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatINR, parseAddress, DetailedAddress } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { exportToCSV } from "@/lib/csv";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleExportCSV = () => {
    const dataToExport: any[] = [];
    filteredOrders.forEach((o) => {
      const parsed = parseAddress(o.address);
      const isDetailed = typeof parsed !== 'string';
      
      const formattedAddress = isDetailed 
        ? `${parsed.house}${parsed.street ? `, ${parsed.street}` : ""}, ${parsed.postOffice}, ${parsed.city}, ${parsed.district}, ${parsed.state} - ${parsed.pin}`
        : parsed as string;
      const mobileNumber = isDetailed ? parsed.mobile : "N/A";

      if (!o.items || o.items.length === 0) {
        dataToExport.push({
          InvoiceNumber: o.invoiceNumber || "",
          CustomerName: o.name,
          MobileNumber: mobileNumber,
          Email: o.email,
          ExactProductName: "N/A",
          ProductVariant: "N/A",
          Quantity: 0,
          UnitPrice: 0,
          LineTotal: 0,
          OrderTotal: o.total,
          PaymentStatus: o.paymentStatus,
          OrderStatus: o.status,
          TrackingNumber: o.trackingNumber || "",
        });
      } else {
        o.items.forEach((item: any) => {
          const fallbackProduct = getProductInfo(item.productId);
          const exactName = item.productName || fallbackProduct?.name || "Unknown Product";
          const variantLabel = [item.variantWeight, item.variantFlavour].filter(Boolean).join(" · ");
          
          dataToExport.push({
            InvoiceNumber: o.invoiceNumber || "",
            CustomerName: o.name,
            MobileNumber: mobileNumber,
            Email: o.email,
            ExactProductName: exactName,
            ProductVariant: variantLabel || `${item.weight} ${item.weightUnit}`,
            Quantity: item.quantity,
            UnitPrice: item.price,
            LineTotal: item.quantity * item.price,
            OrderTotal: o.total,
            PaymentStatus: o.paymentStatus,
            OrderStatus: o.status,
            TrackingNumber: o.trackingNumber || "",
          });
        });
      }
    });
    exportToCSV(dataToExport, "stack_shack_orders");
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Invoice Dialog
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Tracking Dialog
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState("");
  const [formTrackingNumber, setFormTrackingNumber] = useState("");
  const [updatingTracking, setUpdatingTracking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await adminGetOrdersAction();
      const prods = await getProductsAction({ onlyActive: false });
      setOrders(data);
      setProducts(prods);
    } catch (err: any) {
      console.error(err);
      setError("Failed to retrieve order listings.");
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminUpdateOrderStatusAction(orderId, newStatus);
      // update local status
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e) {
      alert("Failed to update order status.");
    }
  };

  const openTrackingDialog = (order: any) => {
    setTrackingOrderId(order.id);
    setFormTrackingNumber(order.trackingNumber || "");
    setTrackingDialogOpen(true);
  };

  const saveTrackingNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingTracking(true);
      await adminUpdateOrderTrackingAction(trackingOrderId, formTrackingNumber);
      setOrders(prev => prev.map(o => o.id === trackingOrderId ? { ...o, trackingNumber: formTrackingNumber, status: "SHIPPED" } : o));
      setTrackingDialogOpen(false);
    } catch (e) {
      alert("Failed to save tracking number.");
    } finally {
      setUpdatingTracking(false);
    }
  };

  const openInvoice = (order: any) => {
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
  };

  const printInvoice = () => {
    const printContent = document.getElementById("invoice-print-area");
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    // restore original
    window.location.reload();
  };

  // Filters logic
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProductInfo = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Retrieving customer orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Review customer checkouts, update processing states, and print invoices.</p>
        </div>
        <Button 
          onClick={handleExportCSV}
          variant="outline"
          className="rounded-xl border-gray-200 text-xs font-bold px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-1.5 self-start"
        >
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders by invoice#, email, customer name..." 
            className="pl-10 border-gray-200 focus-visible:ring-[#4285F4] rounded-xl"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-semibold border border-gray-200 px-3.5 py-2.5 rounded-xl bg-white text-gray-700 outline-none focus:border-[#4285F4] self-start md:self-auto"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50 font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Invoice / Date</th>
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">Products</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Order Status</th>
                <th className="px-6 py-4">Tracking</th>
                <th className="px-6 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No orders matching selection criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/55 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">
                        {o.invoiceNumber || `#${o.id.substring(0, 8)}`}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{o.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{o.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {o.items?.map((item: any, i: number) => {
                          const p = getProductInfo(item.productId);
                          const imgUrl = item.productImage || p?.images?.[0] || "";
                          const productName = item.productName || p?.name || "Unknown Product";
                          return (
                            <div key={i} className="flex items-center gap-2">
                              {imgUrl ? (
                                <img src={imgUrl} alt={productName} className="w-8 h-8 object-contain rounded border border-gray-100 bg-white" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center border border-gray-100">
                                  <ClipboardList className="w-3 h-3 text-gray-300" />
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-800 text-[11px] leading-tight line-clamp-1" title={productName}>{productName}</span>
                                <span className="text-[9px] text-gray-400 font-semibold">{item.weight} {item.weightUnit} &times; {item.quantity}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{formatINR(o.total)}</div>
                      {o.couponCode && (
                        <span className="text-[9px] font-bold text-[#4285F4] bg-blue-50 px-1 rounded-sm mt-0.5 inline-block">
                          Coupon: {o.couponCode}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.paymentStatus === "PAID" 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`text-[10px] font-bold border rounded-lg px-2 py-1 outline-none ${
                          o.status === "DELIVERED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                            : o.status === "SHIPPED"
                            ? "border-blue-200 bg-blue-50 text-[#4285F4]"
                            : o.status === "PROCESSING"
                            ? "border-amber-200 bg-amber-50 text-amber-600"
                            : o.status === "CANCELLED"
                            ? "border-red-200 bg-red-50 text-red-500"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {o.trackingNumber ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-800 tracking-wide text-[11px]">{o.trackingNumber}</span>
                          <button
                            onClick={() => openTrackingDialog(o)}
                            className="text-[9px] text-[#4285F4] font-bold hover:underline text-left"
                          >
                            Edit Tracking
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openTrackingDialog(o)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4285F4] border border-blue-100 bg-blue-50/50 hover:bg-blue-50 px-2 py-1 rounded-lg"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Add Tracking</span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openInvoice(o)}
                        className="p-1.5 text-gray-500 hover:text-[#4285F4] hover:bg-gray-50 border border-gray-100 rounded-lg"
                        title="View Invoice"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking number dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-white border border-gray-100 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black tracking-tight text-gray-900 flex items-center gap-1.5">
              <Truck className="h-5 w-5 text-[#4285F4]" />
              <span>Update Shipping Tracking</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={saveTrackingNumber} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="tracking" className="text-xs font-bold text-gray-600">Courier Tracking Number</Label>
              <Input 
                id="tracking"
                value={formTrackingNumber}
                onChange={(e) => setFormTrackingNumber(e.target.value)}
                placeholder="e.g. IN19238910023"
                className="rounded-xl border-gray-200 focus-visible:ring-[#4285F4]"
                required
              />
              <p className="text-[10px] text-gray-400 leading-normal">
                Setting a tracking ID automatically triggers an email notification to the customer and flags the order as SHIPPED.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTrackingDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingTracking}
                className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold"
              >
                {updatingTracking ? "Saving..." : "Save Tracking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl rounded-2xl bg-white border border-gray-100 p-0 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 border-b border-gray-100 flex-row items-center justify-between space-y-0 bg-gray-50/50">
            <DialogTitle className="text-sm font-black tracking-wider text-gray-800">
              INVOICE VIEWER
            </DialogTitle>
            <Button
              onClick={printInvoice}
              className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold flex items-center gap-1.5 px-3 py-1.5 text-xs mr-6"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
            </Button>
          </DialogHeader>

          {/* Printable Invoice content block */}
          <div className="flex-1 overflow-y-auto p-8" id="invoice-print-area">
            {selectedOrder && (
              <div className="font-sans text-gray-800 max-w-2xl mx-auto space-y-8">
                {/* Branding */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-gray-900">
                      STACK SHACK<span className="text-[#4285F4]"> NUTRITION</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Sport Supplements & Nutrition Shack</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-black text-[#4285F4]">{selectedOrder.invoiceNumber || `ORD-${selectedOrder.id.substring(0, 8)}`}</h3>
                    <p className="text-xs text-gray-400 mt-1">Invoice Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Split info grid */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 text-xs">
                  <div className="space-y-2">
                    <div className="font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span>Customer Details</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{selectedOrder.name}</div>
                      <div className="text-gray-500 mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>{selectedOrder.email}</span>
                      </div>
                      {(() => {
                        const parsed = parseAddress(selectedOrder.address);
                        if (typeof parsed !== 'string') {
                          return (
                            <div className="text-gray-500 mt-0.5 flex items-center gap-1">
                              <span className="font-semibold text-gray-700">Mobile:</span> {parsed.mobile}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>Delivery Address</span>
                    </div>
                    <div className="text-gray-700 font-semibold leading-relaxed">
                      {(() => {
                        const parsed = parseAddress(selectedOrder.address);
                        if (typeof parsed !== 'string') {
                          return (
                            <>
                              <div>{parsed.house}{parsed.street ? `, ${parsed.street}` : ""}</div>
                              <div>PO: {parsed.postOffice}</div>
                              <div>{parsed.city}, {parsed.district}</div>
                              <div>{parsed.state} - {parsed.pin}</div>
                              {parsed.country && <div>{parsed.country}</div>}
                            </>
                          );
                        }
                        return selectedOrder.address;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Invoice status metrics */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                  <div className="text-center">
                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Order Status</div>
                    <div className="font-black text-gray-800 mt-1">{selectedOrder.status}</div>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Payment Status</div>
                    <div className="font-black text-gray-800 mt-1">{selectedOrder.paymentStatus}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Tracking Number</div>
                    <div className="font-black text-gray-800 mt-1">{selectedOrder.trackingNumber || "N/A"}</div>
                  </div>
                </div>

                {/* Invoice Items list */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Line Items</span>
                  <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 font-bold text-gray-500">
                          <th className="px-4 py-2.5">Product</th>
                          <th className="px-4 py-2.5 text-center">Weight</th>
                          <th className="px-4 py-2.5 text-center">Qty</th>
                          <th className="px-4 py-2.5 text-right">Unit Price</th>
                          <th className="px-4 py-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {selectedOrder.items.map((item: any, i: number) => {
                          const p = getProductInfo(item.productId);
                          const imgUrl = item.productImage || p?.images?.[0] || "";
                          const productName = item.productName || p?.name || "Premium Sport Supplement";
                          const variantLabel = [item.variantWeight, item.variantFlavour].filter(Boolean).join(" · ");
                          return (
                            <tr key={i}>
                              <td className="px-4 py-3 flex items-center gap-3">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={productName} className="w-10 h-10 object-contain rounded-md bg-white border border-gray-100" />
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <ClipboardList className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-gray-900">{productName}</div>
                                  {variantLabel && (
                                    <div className="text-[10px] text-[#4285F4] font-semibold mt-0.5">{variantLabel}</div>
                                  )}
                                  <div className="text-[10px] text-gray-400 mt-0.5">{p?.slug || `id: ${item.productId}`}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">
                               {variantLabel ? variantLabel : "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-800 font-bold">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-gray-800">{formatINR(item.price)}</td>
                              <td className="px-4 py-3 text-right font-black text-gray-900">{formatINR(item.quantity * item.price)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subtotals & Math Summary */}
                <div className="flex justify-end pt-2 text-xs">
                  <div className="w-64 space-y-2 font-semibold">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal:</span>
                      <span>
                        {formatINR(selectedOrder.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0))}
                      </span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ""}:</span>
                        <span className="text-red-500">-{formatINR(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                      <span>Tax ({((selectedOrder.tax / (selectedOrder.total || 1)) * 100).toFixed(0)}% estimated):</span>
                      <span>{formatINR(selectedOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping Fee:</span>
                      <span>{formatINR(selectedOrder.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total Amount:</span>
                      <span>{formatINR(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-4 border-t border-gray-100">
            <Button
              onClick={() => setInvoiceDialogOpen(false)}
              className="rounded-xl border border-gray-200 self-end"
              variant="outline"
            >
              Close Viewer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

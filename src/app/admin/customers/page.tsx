"use client";

import { useEffect, useState } from "react";
import { 
  adminGetCustomersAction, 
  adminGetCustomerOrdersAction
} from "@/app/actions";
import { 
  Search, 
  Loader2, 
  Users, 
  DollarSign, 
  ShoppingBag,
  Calendar,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/csv";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleExportCSV = () => {
    const dataToExport = filteredCustomers.map((c) => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      RegistrationDate: new Date(c.createdAt).toISOString(),
      OrderCount: c.orderCount,
      LifetimeSpend: c.totalSpent,
    }));
    exportToCSV(dataToExport, "stack_shack_customers");
  };

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Customer Orders dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await adminGetCustomersAction();
      setCustomers(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to retrieve customer list.");
    } finally {
      setLoading(false);
    }
  }

  const openHistory = async (customer: any) => {
    setSelectedCustomer(customer);
    setHistoryDialogOpen(true);
    try {
      setLoadingHistory(true);
      const orders = await adminGetCustomerOrdersAction(customer.id);
      setCustomerOrders(orders);
    } catch (e) {
      console.error(e);
      alert("Failed to retrieve customer order history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    return c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           c.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && customers.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Retrieving customer database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor registered customer accounts, customer purchase counts, and lifetime spends.</p>
        </div>
        <Button 
          onClick={handleExportCSV}
          variant="outline"
          className="rounded-xl border-gray-200 text-xs font-bold px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-1.5 self-start"
        >
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or email address..." 
            className="w-full text-sm border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#4285F4] transition-all bg-white"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50 font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Customer Name & ID</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4 text-center">Total Orders</th>
                <th className="px-6 py-4">Lifetime Spend</th>
                <th className="px-6 py-4 text-right">Order History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No matching customer accounts found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/55 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
                          {c.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-gray-900 font-bold text-sm block">{c.name}</span>
                          <span className="text-[9px] text-gray-400 font-semibold">{c.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-semibold">
                      {c.email}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-semibold">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-800 font-bold">
                      {c.orderCount} checkouts
                    </td>
                    <td className="px-6 py-4 font-black text-[#4285F4] text-sm">
                      ${c.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => openHistory(c)}
                        variant="outline"
                        className="rounded-xl border-gray-200 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 ml-auto"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>View History</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-gray-100 p-6 shadow-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#4285F4]" />
              <span>Purchase History: {selectedCustomer?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#4285F4]" />
              <span className="mt-2 text-xs font-semibold">Loading purchase records...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 py-3 text-xs">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No orders recorded for this customer yet.
                </div>
              ) : (
                customerOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-gray-900 text-sm">{order.invoiceNumber || `#${order.id.substring(0, 8)}`}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                        order.status === "DELIVERED" 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-semibold text-gray-500 pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                        <span>{order.items.length} unique items</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-400 mt-2 truncate">
                      <strong>Delivery address: </strong> {order.address}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-100">
            <Button
              onClick={() => setHistoryDialogOpen(false)}
              className="rounded-xl border border-gray-200 self-end"
              variant="outline"
            >
              Close History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

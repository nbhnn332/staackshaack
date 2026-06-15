"use client";

import { useEffect, useState } from "react";
import { adminGetKPIsAction } from "@/app/actions";
import { 
  TrendingUp, 
  ShoppingBag, 
  ClipboardList, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface KPIState {
  totalOrders: number;
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  yearlyOrders: number;
  totalSales: number;
  todaySales: number;
  monthlySales: number;
  yearlySales: number;
  lowStockCount: number;
  lowStockList: any[];
  outOfStockCount: number;
  outOfStockList: any[];
  recentOrders: any[];
  bestSelling: any[];
  salesChartData: { month: string; sales: number }[];
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminGetKPIsAction();
        setKpis(res);
      } catch (err: any) {
        console.error("Failed to load KPIs:", err);
        setError("Unable to retrieve dashboard stats. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Loading dashboard stats...</span>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <p className="font-semibold">{error || "An error occurred"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Find max sales for SVG scaling
  const maxSales = Math.max(...kpis.salesChartData.map(d => d.sales), 100);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time store statistics, order analytics, and operations overview.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white border border-gray-100 px-3.5 py-2 rounded-xl self-start">
          <Calendar className="h-4 w-4 text-[#4285F4]" />
          <span>Last 12 Months Sales Overview</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Sales KPI */}
        <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#4285F4] transition-colors group-hover:bg-[#4285F4] group-hover:text-white">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-gray-900">{formatINR(kpis.totalSales)}</h3>
            <div className="mt-2 flex flex-col gap-1 text-xs font-medium text-gray-500">
              <div className="flex justify-between">
                <span>Today:</span>
                <span className="font-bold text-[#4285F4]">{formatINR(kpis.todaySales)}</span>
              </div>
              <div className="flex justify-between">
                <span>This Month:</span>
                <span className="font-bold text-gray-800">{formatINR(kpis.monthlySales)}</span>
              </div>
              <div className="flex justify-between">
                <span>This Year:</span>
                <span className="font-bold text-gray-800">{formatINR(kpis.yearlySales)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders KPI */}
        <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#4285F4] transition-colors group-hover:bg-[#4285F4] group-hover:text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-gray-900">{kpis.totalOrders}</h3>
            <div className="mt-2 flex flex-col gap-1 text-xs font-medium text-gray-500">
              <div className="flex justify-between">
                <span>Today&apos;s Orders:</span>
                <span className="font-bold text-[#4285F4]">{kpis.todayOrders}</span>
              </div>
              <div className="flex justify-between">
                <span>Weekly / Monthly:</span>
                <span className="font-bold text-gray-800">{kpis.weeklyOrders} / {kpis.monthlyOrders}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock KPI */}
        <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Stock items</span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-gray-900">{kpis.lowStockCount}</h3>
            <div className="mt-2 flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span className="truncate">Items running low (under 5 units)</span>
              <a href="/admin/products?filter=lowStock" className="text-[#4285F4] hover:underline flex items-center gap-0.5 mt-0.5">
                <span>View Low Stock</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Out of Stock KPI */}
        <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Out Of Stock</span>
            <div className="rounded-xl bg-red-50 p-2.5 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-gray-900">{kpis.outOfStockCount}</h3>
            <div className="mt-2 flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span className="truncate">Active items requiring stock refill</span>
              <a href="/admin/products?filter=outOfStock" className="text-[#4285F4] hover:underline flex items-center gap-0.5 mt-0.5">
                <span>View Out of Stock</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Stock Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Revenue Volume</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly revenue comparison for the current year</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4285F4] bg-blue-50 px-2.5 py-1 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Paid Orders</span>
            </div>
          </div>

          {/* SVG Sales Area Chart */}
          <div className="relative h-64 w-full">
            <svg width="600" height="220" viewBox="0 0 600 220" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4285F4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4285F4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="40" y1="20" x2="580" y2="20" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="70" x2="580" y2="70" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="120" x2="580" y2="120" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="170" x2="580" y2="170" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />

              {/* Left axis values */}
              <text x="30" y="24" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">{formatINR(Math.round(maxSales))}</text>
              <text x="30" y="74" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">{formatINR(Math.round(maxSales * 0.75))}</text>
              <text x="30" y="124" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">{formatINR(Math.round(maxSales * 0.5))}</text>
              <text x="30" y="174" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">{formatINR(Math.round(maxSales * 0.25))}</text>
              <text x="30" y="200" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">{formatINR(0)}</text>

              {/* Draw area and line */}
              {(() => {
                const points = kpis.salesChartData.map((d, index) => {
                  const x = 50 + (index * (520 / 11));
                  const y = 190 - (d.sales / maxSales) * 160;
                  return { x, y };
                });

                const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                const areaPath = `${linePath} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`;

                return (
                  <>
                    <path d={areaPath} fill="url(#chartGradient)" />
                    <path d={linePath} fill="none" stroke="#4285F4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Points circle markers */}
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#FFFFFF"
                        stroke="#4285F4"
                        strokeWidth="2.5"
                        className="cursor-pointer transition-all hover:r-5"
                      />
                    ))}
                  </>
                );
              })()}

              {/* X Axis Labels */}
              {kpis.salesChartData.map((d, index) => {
                const x = 50 + (index * (520 / 11));
                return (
                  <text
                    key={index}
                    x={x}
                    y="212"
                    fill="#9AA0A6"
                    fontSize="10"
                    fontWeight="semibold"
                    textAnchor="middle"
                  >
                    {d.month}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Best Sellers Side Panel */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-base font-bold text-gray-900">Bestselling Products</h2>
            <p className="text-xs text-gray-400">Top performant sport supplements by units sold</p>
          </div>

          <div className="space-y-4">
            {kpis.bestSelling.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <ShoppingBag className="h-8 w-8 mb-2 stroke-1" />
                <span className="text-xs">No sales recorded yet.</span>
              </div>
            ) : (
              kpis.bestSelling.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center p-1.5 border border-gray-100 overflow-hidden">
                    <img 
                      src={product.images?.[0] || "/placeholder-product.png"} 
                      alt={product.name} 
                      width="44"
                      height="44"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-800 truncate">{product.name}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{product.salesCount} items sold</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900">{formatINR(product.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <p className="text-xs text-gray-400 mt-0.5">Summary of latest consumer checkouts</p>
          </div>
          <a href="/admin/orders" className="text-xs font-bold text-[#4285F4] hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50 font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Invoice / ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {kpis.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                kpis.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/55 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-gray-800">
                      {order.invoiceNumber || `#${order.id.substring(0, 8)}`}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-gray-800">{order.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{order.email}</div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.status === "DELIVERED" 
                          ? "bg-emerald-50 text-emerald-600" 
                          : order.status === "SHIPPED"
                          ? "bg-blue-50 text-[#4285F4]"
                          : order.status === "PROCESSING"
                          ? "bg-amber-50 text-amber-600"
                          : order.status === "CANCELLED"
                          ? "bg-red-50 text-red-500"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === "PAID" 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-6 py-4.5 text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

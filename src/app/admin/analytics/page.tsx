"use client";

import { useEffect, useState } from "react";
import { adminGetKPIsAction } from "@/app/actions";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  TrendingDown,
  BarChart3,
  Loader2,
  PieChart,
  Percent,
  Calendar
} from "lucide-react";

interface KPIState {
  totalOrders: number;
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  yearlyOrders: number;
  totalSales: number;
  todaySales: number;
  monthlySales: number;
  lowStockCount: number;
  outOfStockCount: number;
  bestSelling: any[];
  salesChartData: { month: string; sales: number }[];
}

export default function AdminAnalytics() {
  const [kpis, setKpis] = useState<KPIState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminGetKPIsAction();
        setKpis(res);
      } catch (err: any) {
        console.error(err);
        setError("Failed to retrieve analytics reports.");
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
        <span className="mt-3 text-sm font-medium">Calculating store metrics...</span>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
        <p className="font-semibold">{error || "An error occurred"}</p>
      </div>
    );
  }

  // Analytics Math
  const aov = kpis.totalOrders > 0 ? Number((kpis.totalSales / kpis.totalOrders).toFixed(2)) : 0;
  const maxSales = Math.max(...kpis.salesChartData.map(d => d.sales), 100);
  const totalBestSellersRevenue = kpis.bestSelling.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Review revenue logs, evaluate order values, and identify bestselling supplements.</p>
      </div>

      {/* KPI Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total revenue */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gross Sales Revenue</span>
          <div className="flex items-baseline gap-1 mt-3">
            <h3 className="text-3xl font-black tracking-tight text-gray-900">${kpis.totalSales.toLocaleString()}</h3>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+14.2%</span>
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">Total revenue generated from processed orders</p>
        </div>

        {/* Average order value */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Average Order Value (AOV)</span>
          <div className="flex items-baseline gap-1 mt-3">
            <h3 className="text-3xl font-black tracking-tight text-gray-900">${aov}</h3>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+4.8%</span>
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">Average amount spent per consumer transaction</p>
        </div>

        {/* Conversion rate mock */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Conversion Rate</span>
          <div className="flex items-baseline gap-1 mt-3">
            <h3 className="text-3xl font-black tracking-tight text-gray-900">3.42%</h3>
            <span className="text-xs font-bold text-red-500 flex items-center gap-0.5">
              <TrendingDown className="h-3 w-3" />
              <span>-0.5%</span>
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-semibold">Percentage of store visitors placing checkouts</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Revenue Performance Graph</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sales trends calculated across month indicators</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4285F4] bg-blue-50 px-2.5 py-1 rounded-lg">
              <Calendar className="h-3.5 w-3.5" />
              <span>Paid Orders Only</span>
            </div>
          </div>

          <div className="relative h-64 w-full">
            <svg width="600" height="220" viewBox="0 0 600 220" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4285F4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4285F4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="40" y1="20" x2="580" y2="20" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="70" x2="580" y2="70" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="120" x2="580" y2="120" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="170" x2="580" y2="170" stroke="#F1F3F4" strokeWidth="1" strokeDasharray="3" />

              {/* Axis labels */}
              <text x="30" y="24" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">${Math.round(maxSales).toLocaleString()}</text>
              <text x="30" y="74" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">${Math.round(maxSales * 0.75).toLocaleString()}</text>
              <text x="30" y="124" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">${Math.round(maxSales * 0.5).toLocaleString()}</text>
              <text x="30" y="174" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">${Math.round(maxSales * 0.25).toLocaleString()}</text>
              <text x="30" y="200" fill="#9AA0A6" fontSize="10" fontWeight="bold" textAnchor="end">$0</text>

              {/* Chart line and fill */}
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
                    <path d={areaPath} fill="url(#analyticsGradient)" />
                    <path d={linePath} fill="none" stroke="#4285F4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4.5"
                        fill="#FFFFFF"
                        stroke="#4285F4"
                        strokeWidth="3"
                        className="cursor-pointer"
                      />
                    ))}
                  </>
                );
              })()}

              {/* Month labels */}
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

        {/* Bestselling Share percentages */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Bestseller Revenue Shares</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-semibold">Contribution share of top 5 supplement products</p>
          </div>

          <div className="space-y-4.5 my-6">
            {kpis.bestSelling.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No bestseller stats compiled.
              </div>
            ) : (
              kpis.bestSelling.map((product) => {
                const pct = totalBestSellersRevenue > 0 
                  ? Math.round((product.revenue / totalBestSellersRevenue) * 100)
                  : 0;

                return (
                  <div key={product.id} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span className="truncate max-w-[170px]">{product.name}</span>
                      <span>{pct}% (${product.revenue.toLocaleString()})</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-2 bg-gray-50 border border-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4285F4] rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Top 5 revenue:</span>
            <span className="font-black text-gray-900">${totalBestSellersRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

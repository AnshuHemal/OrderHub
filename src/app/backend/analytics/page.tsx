"use client";

import { useState } from "react";
import { useApp } from "@/app/context/AppContext";

export default function AnalyticsPage() {
  const {
    users,
    products,
    categories,
    orders,
    sessionsList
  } = useApp();

  // Report Filter states
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "custom">("today");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [filterProductId, setFilterProductId] = useState<string>("all");

  const handleExportSimulated = (format: "pdf" | "xls") => {
    alert(`Generating dynamic ${format.toUpperCase()} report with selected filters...\nDownload triggered successfully!`);
  };

  // dynamic filtering calculations for reports
  const filteredOrders = orders.filter((order) => {
    // 1. Period filter
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (filterPeriod === "today") {
      const orderDateZero = new Date(order.createdAt);
      orderDateZero.setHours(0,0,0,0);
      if (orderDateZero.getTime() !== today.getTime()) return false;
    } else if (filterPeriod === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (orderDate < oneWeekAgo) return false;
    } else if (filterPeriod === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      if (orderDate < oneMonthAgo) return false;
    } else if (filterPeriod === "custom") {
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        if (orderDate < start) return false;
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }
    }

    // 2. Employee filter
    if (filterEmployeeId !== "all" && order.employeeId !== filterEmployeeId) {
      return false;
    }

    // 3. Session filter
    if (filterSessionId !== "all" && order.sessionId !== parseInt(filterSessionId)) {
      return false;
    }

    // 4. Product filter
    if (filterProductId !== "all") {
      const hasProduct = order.items.some(it => it.productId === filterProductId);
      if (!hasProduct) return false;
    }

    return true;
  });

  // Calculate stats based on filtered orders
  const paidOrders = filteredOrders.filter(o => o.status === "paid");
  const totalOrdersCount = filteredOrders.length;
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Top Products calculations
  const productSalesMap: Record<string, { name: string; qty: number; rev: number }> = {};
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      // If product filter is specific, ignore other products in the list
      if (filterProductId !== "all" && item.productId !== filterProductId) return;

      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, qty: 0, rev: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].rev += item.total;
    });
  });

  const topProductsList = Object.values(productSalesMap).sort((a, b) => b.rev - a.rev);

  // Top Categories calculations
  const categorySalesMap: Record<string, { name: string; color: string; rev: number }> = {};
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.categoryId) {
        const cat = categories.find(c => c.id === prod.categoryId);
        if (cat) {
          if (!categorySalesMap[cat.id]) {
            categorySalesMap[cat.id] = { name: cat.name, color: cat.color, rev: 0 };
          }
          categorySalesMap[cat.id].rev += item.total;
        }
      }
    });
  });

  const topCategoriesList = Object.values(categorySalesMap).sort((a, b) => b.rev - a.rev);

  // Top Orders calculations
  const topOrdersList = [...filteredOrders].sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in text-xs">
      {/* Header info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-stone-800 dark:text-stone-100">Live Sales Analytics</h2>
          <p className="text-sm text-stone-500 mt-1">Real-time statistics and sales distribution charts for cafe orders.</p>
        </div>

        {/* PDF / Excel Exports */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExportSimulated("pdf")}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-sm transition-all"
          >
            📄 Export PDF
          </button>
          <button
            onClick={() => handleExportSimulated("xls")}
            className="px-4 py-2 border border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-xl font-bold transition-all text-stone-700 dark:text-stone-300"
          >
            📊 Export Excel
          </button>
        </div>
      </div>

      {/* DASHBOARD FILTERS */}
      <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-extrabold text-stone-800 dark:text-stone-200 mb-2 uppercase tracking-wider text-[10px]">Filter Dashboard Records</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* 1. Period Selector */}
          <div>
            <label className="block text-stone-400 font-bold mb-1">Time Period</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Dates */}
          {filterPeriod === "custom" && (
            <>
              <div>
                <label className="block text-stone-400 font-bold mb-1">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="block text-stone-400 font-bold mb-1">End Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                />
              </div>
            </>
          )}

          {/* 2. Employee Selector */}
          <div>
            <label className="block text-stone-400 font-bold mb-1">Cashier/Employee</label>
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
            >
              <option value="all">All Cashiers</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Session Selector */}
          <div>
            <label className="block text-stone-400 font-bold mb-1">POS Shift Session</label>
            <select
              value={filterSessionId}
              onChange={(e) => setFilterSessionId(e.target.value)}
              className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
            >
              <option value="all">All Sessions</option>
              {sessionsList.map(s => (
                <option key={s.id} value={s.id}>
                  Session #{s.id} ({new Date(s.openedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Product Selector */}
          <div>
            <label className="block text-stone-400 font-bold mb-1">Target Product</label>
            <select
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
            >
              <option value="all">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm text-center">
          <span className="text-3xl">📋</span>
          <h4 className="text-stone-400 font-bold uppercase tracking-wider text-[10px] mt-2">Total Orders</h4>
          <p className="text-3xl font-black text-stone-800 dark:text-white mt-1">{totalOrdersCount}</p>
        </div>

        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm text-center">
          <span className="text-3xl">💵</span>
          <h4 className="text-stone-400 font-bold uppercase tracking-wider text-[10px] mt-2">Revenue Total</h4>
          <p className="text-3xl font-black text-primary dark:text-amber-500 mt-1">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm text-center">
          <span className="text-3xl">📈</span>
          <h4 className="text-stone-400 font-bold uppercase tracking-wider text-[10px] mt-2">Average Order Value</h4>
          <p className="text-3xl font-black text-stone-800 dark:text-white mt-1">${averageOrderValue.toFixed(2)}</p>
        </div>

      </div>

      {/* DASHBOARD CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Sales distribution visual CSS graph */}
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm mb-4">Top Categories Sales Distribution</h3>
          <div className="space-y-4">
            {topCategoriesList.length === 0 ? (
              <p className="text-stone-400 italic">No sales transactions found in filtered criteria.</p>
            ) : (
              topCategoriesList.map((cat, idx) => {
                const maxVal = Math.max(...topCategoriesList.map(c => c.rev));
                const percentWidth = maxVal > 0 ? (cat.rev / maxVal) * 100 : 0;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                        {cat.name}
                      </span>
                      <span>${cat.rev.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-850 h-3 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${percentWidth}%`,
                          backgroundColor: cat.color
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sales trend representation bar graph */}
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm mb-4">Hourly / Order Count Timeline Chart</h3>
          
          {paidOrders.length === 0 ? (
            <p className="text-stone-400 italic">No transactions to graph sales trends.</p>
          ) : (
            <div className="h-44 flex items-end gap-3 justify-center border-b border-stone-200 dark:border-stone-800 pb-2">
              {/* Simulated timeline bars */}
              {paidOrders.slice(-8).map((ord, idx) => {
                const maxTotal = Math.max(...paidOrders.map(o => o.total));
                const percentHeight = maxTotal > 0 ? (ord.total / maxTotal) * 100 : 10;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative animate-fade-in">
                    {/* hover tooltips */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-stone-950 text-white font-bold p-1.5 rounded shadow text-[10px] whitespace-nowrap transition-opacity">
                      ${ord.total.toFixed(2)}
                    </div>
                    
                    <div
                      style={{ height: `${percentHeight}%` }}
                      className="w-full bg-primary hover:bg-primary-hover rounded-t-lg transition-all duration-500"
                    ></div>
                    <span className="text-[9px] text-stone-500 font-mono rotate-45 block transform origin-left">
                      {ord.orderNumber.split("-")[2]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* TABULAR REPORTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products Table */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
          <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm mb-4">Top Products Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 text-stone-400 text-[10px] font-bold uppercase">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Quantity Sold</th>
                  <th className="pb-3 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {topProductsList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-stone-400">
                      No product sales.
                    </td>
                  </tr>
                ) : (
                  topProductsList.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10">
                      <td className="py-3 font-bold text-stone-800 dark:text-stone-200">{prod.name}</td>
                      <td className="py-3 text-stone-500 font-mono">{prod.qty} units</td>
                      <td className="py-3 text-right font-black text-stone-850 dark:text-white">${prod.rev.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highest Value Orders Table */}
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm mb-4">Top High-Value Orders</h3>
          <div className="space-y-3">
            {topOrdersList.length === 0 ? (
              <p className="text-stone-400 italic">No sales logs found.</p>
            ) : (
              topOrdersList.map((order, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-xl hover:bg-stone-100/50 dark:hover:bg-stone-900/50 transition-colors">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-200">{order.orderNumber}</p>
                    <span className="text-[10px] text-stone-500">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </span>
                  </div>
                  <span className="font-black text-primary dark:text-amber-500">${order.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { motion } from "motion/react";
import { exportToExcel, exportToPDF } from "@/lib/analytics-export";
import {
  TrendingUp,
  Clock,
  Users,
  Flame,
  Utensils,
  Percent,
  Banknote,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  Lightbulb,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Gauge
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

// Themed tooltip for Recharts (light + dark aware)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-3.5 rounded-2xl shadow-xl text-xs space-y-1 font-sans">
        <p className="font-extrabold text-stone-700 dark:text-stone-300 mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="font-bold flex items-center justify-between gap-4" style={{ color: p.color || p.fill }}>
            <span className="text-stone-500 dark:text-stone-400">{p.name}</span>
            <span>{p.name.toLowerCase().includes("revenue") || p.name.toLowerCase().includes("value") || p.name.toLowerCase().includes("sales") ? `₹${Number(p.value).toFixed(2)}` : p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const {
    users, products, categories, orders, sessionsList, tables, paymentMethods
  } = useApp();
  const { success, error } = useToast();

  // Report Filter states
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "all" | "custom">("month");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [filterProductId, setFilterProductId] = useState<string>("all");

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
    } else if (filterPeriod === "all") {
      // no date restriction — show everything
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

  // 1. Busy Hours Tracking calculations (0 - 23 hours)
  const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    hourLabel: `${i === 0 ? 12 : i > 12 ? i - 12 : i} ${i >= 12 ? "PM" : "AM"}`,
    "Orders Count": 0,
    "Sales Revenue": 0,
  }));
  paidOrders.forEach((order) => {
    const date = new Date(order.createdAt);
    const hour = date.getHours();
    if (hour >= 0 && hour < 24) {
      hourlyCounts[hour]["Orders Count"] += 1;
      hourlyCounts[hour]["Sales Revenue"] += order.total;
    }
  });
  // Filter to show active/operational hours to avoid chart clutter (e.g. between 7 AM and 11 PM)
  const activeHourlyData = hourlyCounts.filter(h => h["Orders Count"] > 0 || (h.hour >= 8 && h.hour <= 22));

  // 2. Average Ticket Size & Table Turnover metrics
  const tableOccupancies: Record<string, { totalTimeMs: number; count: number; tableNum: string }> = {};
  paidOrders.forEach((order) => {
    if (order.tableId && order.completedAt) {
      const durationMs = new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime();
      // Only include logical occupancies between 2 minutes and 4 hours
      if (durationMs >= 2 * 60 * 1000 && durationMs <= 4 * 60 * 60 * 1000) {
        if (!tableOccupancies[order.tableId]) {
          const tableInfo = tables.find(t => t.id === order.tableId);
          tableOccupancies[order.tableId] = {
            totalTimeMs: 0,
            count: 0,
            tableNum: tableInfo ? `Table ${tableInfo.tableNumber}` : `Table ${order.tableId.slice(0, 4)}`
          };
        }
        tableOccupancies[order.tableId].totalTimeMs += durationMs;
        tableOccupancies[order.tableId].count += 1;
      }
    }
  });

  const tableTurnoverList = Object.entries(tableOccupancies).map(([tableId, val]) => ({
    tableId,
    tableNumber: val.tableNum,
    avgOccupancyMins: Math.round(val.totalTimeMs / (60 * 1000) / val.count),
    turnovers: val.count
  })).sort((a, b) => b.turnovers - a.turnovers);

  const overallTableOrders = paidOrders.filter(o => o.tableId && o.completedAt);
  const totalOccupancyMs = overallTableOrders.reduce((sum, o) => {
    const duration = new Date(o.completedAt!).getTime() - new Date(o.createdAt).getTime();
    return (duration >= 2 * 60 * 1000 && duration <= 4 * 60 * 60 * 1000) ? sum + duration : sum;
  }, 0);
  const validTableOrdersCount = overallTableOrders.filter(o => {
    const d = new Date(o.completedAt!).getTime() - new Date(o.createdAt).getTime();
    return d >= 2 * 60 * 1000 && d <= 4 * 60 * 60 * 1000;
  }).length;
  const avgOccupancyMins = validTableOrdersCount > 0 ? Math.round(totalOccupancyMs / (60 * 1000) / validTableOrdersCount) : 38; // standard default

  // 3. Top-Selling Pairs Recommender (Association Rules Algorithm)
  const productCountsMap: Record<string, { name: string; count: number }> = {};
  const pairCountsMap: Record<string, { idA: string; idB: string; nameA: string; nameB: string; count: number }> = {};

  paidOrders.forEach((order) => {
    const uniqueProductIds = Array.from(new Set(order.items.map(it => it.productId)));

    // Individual item frequencies
    uniqueProductIds.forEach((pId) => {
      const orderItem = order.items.find(it => it.productId === pId);
      if (orderItem) {
        productCountsMap[pId] = {
          name: orderItem.name,
          count: (productCountsMap[pId]?.count || 0) + 1
        };
      }
    });

    // Co-occurrence frequencies (pairs)
    for (let i = 0; i < uniqueProductIds.length; i++) {
      for (let j = i + 1; j < uniqueProductIds.length; j++) {
        const idA = uniqueProductIds[i];
        const idB = uniqueProductIds[j];
        const key = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;

        const itemA = order.items.find(it => it.productId === idA)!;
        const itemB = order.items.find(it => it.productId === idB)!;

        pairCountsMap[key] = {
          idA: idA < idB ? idA : idB,
          idB: idA < idB ? idB : idA,
          nameA: idA < idB ? itemA.name : itemB.name,
          nameB: idA < idB ? itemB.name : itemA.name,
          count: (pairCountsMap[key]?.count || 0) + 1
        };
      }
    }
  });

  const recommendedPairs = Object.values(pairCountsMap).map((pair) => {
    const totalA = productCountsMap[pair.idA]?.count || 1;
    const totalB = productCountsMap[pair.idB]?.count || 1;

    // Association metrics
    const confAtoB = (pair.count / totalA) * 100;
    const confBtoA = (pair.count / totalB) * 100;

    return {
      ...pair,
      confAtoB,
      confBtoA,
      strongestDirection: confAtoB >= confBtoA
        ? { from: pair.nameA, to: pair.nameB, confidence: confAtoB }
        : { from: pair.nameB, to: pair.nameA, confidence: confBtoA }
    };
  }).sort((a, b) => b.count - a.count).slice(0, 4);

  // 4. Daily Revenue Trend Data (for Area Chart)
  const dailyStatsMap: Record<string, { date: string; Sales: number; Orders: number }> = {};
  paidOrders.forEach((order) => {
    const dStr = new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });
    if (!dailyStatsMap[dStr]) {
      dailyStatsMap[dStr] = { date: dStr, Sales: 0, Orders: 0 };
    }
    dailyStatsMap[dStr].Sales += order.total;
    dailyStatsMap[dStr].Orders += 1;
  });
  const revenueTrendData = Object.values(dailyStatsMap).slice(-8); // Show trailing 8 days

  // Top Products calculations
  const productSalesMap: Record<string, { name: string; qty: number; rev: number }> = {};
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
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
  const categorySalesMap: Record<string, { name: string; value: number; color: string }> = {};
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.categoryId) {
        const cat = categories.find(c => c.id === prod.categoryId);
        if (cat) {
          if (!categorySalesMap[cat.id]) {
            categorySalesMap[cat.id] = { name: cat.name, value: 0, color: cat.color || "#8884d8" };
          }
          categorySalesMap[cat.id].value += item.total;
        }
      }
    });
  });

  const topCategoriesList = Object.values(categorySalesMap).sort((a, b) => b.value - a.value);

  // Top Orders calculations
  const topOrdersList = [...filteredOrders].sort((a, b) => b.total - a.total).slice(0, 5);

  const handleExport = (format: "pdf" | "excel") => {
    try {
      const cashierName = filterEmployeeId === "all" 
        ? "All Cashiers" 
        : (users.find(u => u.id === filterEmployeeId)?.name || filterEmployeeId);

      const sessionName = filterSessionId === "all" 
        ? "All Sessions" 
        : `Session #${filterSessionId}`;

      const productName = filterProductId === "all" 
        ? "All Products" 
        : (products.find(p => p.id === filterProductId)?.name || filterProductId);

      const detailedOrders = filteredOrders.map(o => {
        const cashier = users.find(u => u.id === o.employeeId)?.name || o.employeeId;
        const tableInfo = o.tableId ? tables.find(t => t.id === o.tableId) : null;
        const tableNumber = tableInfo ? `Table ${tableInfo.tableNumber}` : "POS Walk-in";
        const payMethod = o.paymentMethodId 
          ? (paymentMethods?.find(pm => pm.id === o.paymentMethodId)?.name || `Method #${o.paymentMethodId}`)
          : "Cash";
        const itemsList = o.items.map(it => `${it.quantity}x ${it.name}`).join(", ");
        
        return {
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          cashierName: cashier,
          tableNumber,
          subtotal: o.subtotal,
          tax: o.tax,
          discounts: o.discounts,
          total: o.total,
          status: o.status,
          paymentMethod: payMethod,
          items: itemsList
        };
      });

      const exportData = {
        period: filterPeriod,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        cashierName,
        sessionName,
        productName,
        totals: {
          orders: totalOrdersCount,
          revenue: totalRevenue,
          avgOrderValue: averageOrderValue,
          avgTableTime: avgOccupancyMins
        },
        revenueTrend: revenueTrendData,
        topProducts: topProductsList.map(p => ({ name: p.name, qty: p.qty, rev: p.rev })),
        topCategories: topCategoriesList.map(c => ({ name: c.name, value: c.value })),
        tableTurnover: tableTurnoverList.map(t => ({ tableNumber: t.tableNumber, turnovers: t.turnovers, avgOccupancyMins: t.avgOccupancyMins })),
        combos: recommendedPairs.map(p => ({
          nameA: p.strongestDirection.from,
          nameB: p.strongestDirection.to,
          confidence: p.strongestDirection.confidence,
          count: p.count
        })),
        detailedOrders
      };

      if (format === "excel") {
        exportToExcel(exportData);
        success("Excel Export Successful", "Your Excel report spreadsheet has been generated.");
      } else {
        exportToPDF(exportData);
        success("PDF Export Successful", "Your PDF management report document has been generated.");
      }
    } catch (err) {
      console.error("Export error:", err);
      error("Export Failed", "An error occurred while generating your report.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-sm text-stone-800 dark:text-stone-200 font-sans">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-2">
            <Gauge className="size-6 text-primary" />
            Management Analytics
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
            Real-time revenue charts, table turnover metrics, predictive combos, and top-product rankings.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 text-sm"
          >
            <BarChart3 className="size-4" /> Export PDF
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-bold transition-all text-stone-700 dark:text-stone-300 text-sm"
          >
            <TrendingUp className="size-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* DASHBOARD FILTERS */}
      <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
        <h3 className="font-extrabold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
          <Calendar className="size-3.5 text-stone-400" /> Filter Dataset
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* 1. Period Selector */}
          <div>
            <label className="block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-xs">Time Period</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-all"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Dates */}
          {filterPeriod === "custom" && (
            <>
              <div>
                <label className="block text-stone-450 dark:text-stone-500 font-bold mb-1.5 text-xs uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-stone-450 dark:text-stone-500 font-bold mb-1.5 text-xs uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 2. Employee Selector */}
          <div>
            <label className="block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-xs">Cashier</label>
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-all"
            >
              <option value="all">All Cashiers</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Session Selector */}
          <div>
            <label className="block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-xs">Shift Session</label>
            <select
              value={filterSessionId}
              onChange={(e) => setFilterSessionId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-all"
            >
              <option value="all">All Sessions</option>
              {sessionsList.map(s => (
                <option key={s.id} value={s.id.toString()}>
                  Session #{s.id} ({new Date(s.openedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Product Selector */}
          <div>
            <label className="block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-xs">Product</label>
            <select
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-all"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders",      value: totalOrdersCount,              suffix: "",    Icon: BarChart3,    color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/20" },
          { label: "Net Revenue",        value: `₹${totalRevenue.toFixed(0)}`, suffix: "",    Icon: Banknote,     color: "text-primary",                         bg: "bg-primary/10",   border: "border-primary/20"   },
          { label: "Avg Order Value",   value: `₹${averageOrderValue.toFixed(0)}`, suffix: "", Icon: TrendingUp, color: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-500/10",   border: "border-sky-500/20"   },
          { label: "Avg Table Time",    value: avgOccupancyMins,               suffix: " min", Icon: Clock,      color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10",border: "border-emerald-500/20"},
        ].map(({ label, value, suffix, Icon, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className={`p-5 bg-white dark:bg-stone-900 border ${border} rounded-2xl flex items-center gap-4`}
          >
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl border ${border} ${bg} shrink-0`}>
              <Icon className={`size-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold">{label}</p>
              <p className={`text-2xl font-black mt-0.5 ${i === 1 ? "text-primary" : "text-stone-800 dark:text-stone-100"}`}>{value}{suffix}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* DASHBOARD CHARTS ROW (Interactive Area & Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Trailing Sales Revenue Trend */}
        <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
              <TrendingUp className="size-4 text-emerald-500" /> Trailing Sales Revenue & Orders Trend
            </h3>
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">Live Sync</span>
          </div>

          {revenueTrendData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2"><BarChart3 className="size-8 text-stone-300 dark:text-stone-700" /><p className="text-sm font-semibold">No sales data for this period</p><p className="text-xs">Try switching to &quot;All Time&quot; or a wider date range</p></div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #EF4444)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--color-primary, #EF4444)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-stone-800" />
                  <XAxis dataKey="date" tickLine={false} style={{ fontSize: 10, fontWeight: "bold" }} stroke="#78716C" />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fontWeight: "bold" }} stroke="#78716C" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Sales" name="Sales Revenue (₹)" stroke="var(--color-primary, #EF4444)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="Orders" name="Orders Count" stroke="#3B82F6" strokeWidth={1.5} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Operational Hours Distribution (Busy Hours) */}
        <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
              <Clock className="size-4 text-primary" /> Peak Operational Hours & Volume Tracking
            </h3>
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">Hourly Volume</span>
          </div>

          {activeHourlyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2"><Clock className="size-8 text-stone-300 dark:text-stone-700" /><p className="text-sm font-semibold">No hourly data</p></div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeHourlyData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-stone-800" />
                  <XAxis dataKey="hourLabel" tickLine={false} style={{ fontSize: 9, fontWeight: "bold" }} stroke="#78716C" />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} style={{ fontSize: 9, fontWeight: "bold" }} stroke="#78716C" />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} style={{ fontSize: 9, fontWeight: "bold" }} stroke="#78716C" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="Orders Count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar yAxisId="right" dataKey="Sales Revenue" fill="var(--color-primary, #EF4444)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SALES PREDICTION & RECOMMENDER (Top Selling Pairs) & TABLE TURNOVER SPEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Recommendation Engine: Predictive Pairs */}
        <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-white text-sm flex items-center gap-1.5">
              <Sparkles className="size-4 text-amber-500 animate-spin-slow" /> Predictive Combo Recommendations
            </h3>
            <p className="text-xs text-stone-450 dark:text-stone-500 mt-1">
              Waiters can pitch these high-confidence combos based on order history.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {recommendedPairs.length === 0 ? (
              <div className="p-8 text-center text-stone-400 italic">
                Add more multi-item bills to generate combos.
              </div>
            ) : (
              recommendedPairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-2xl flex flex-col gap-2 hover:border-amber-400/30 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Flame className="size-3" /> Combo #{idx + 1}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono font-black">{pair.count}x Purchased</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-extrabold text-stone-800 dark:text-stone-200">
                    <span className="px-2 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg max-w-[100px] truncate">{pair.strongestDirection.from}</span>
                    <ArrowRight className="size-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                    <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg max-w-[100px] truncate">{pair.strongestDirection.to}</span>
                  </div>

                  <p className="text-[11px] text-stone-550 dark:text-stone-400 leading-tight">
                    Guests ordering <span className="font-bold">{pair.strongestDirection.from}</span> have a <span className="font-extrabold text-stone-850 dark:text-stone-100 underline decoration-amber-400">{pair.strongestDirection.confidence.toFixed(0)}% likelihood</span> of adding <span className="font-bold">{pair.strongestDirection.to}</span>.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table Turnover Breakdown & Occupancy Durations */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-sm flex items-center gap-1.5">
                <Utensils className="size-4 text-sky-500" /> Table Turnaround & Turnover Speed
              </h3>
              <p className="text-xs text-stone-450 dark:text-stone-500 mt-1">
                Optimizing customer throughput. Tracks orders starting from table check-in to payment.
              </p>
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-md">Turnover</span>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 text-stone-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Table Identifier</th>
                  <th className="pb-3 text-center">Settled Receipts</th>
                  <th className="pb-3 text-center">Avg Occupancy (Mins)</th>
                  <th className="pb-3 text-right">Throughput Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {tableTurnoverList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400 italic">
                      Settle orders at dining tables to calculate turnover timings.
                    </td>
                  </tr>
                ) : (
                  tableTurnoverList.map((t, idx) => {
                    let rating = "Optimal";
                    let ratingCls = "bg-emerald-500/10 text-emerald-600";
                    if (t.avgOccupancyMins > 60) {
                      rating = "Extended";
                      ratingCls = "bg-amber-500/10 text-amber-600";
                    } else if (t.avgOccupancyMins < 20) {
                      rating = "Rapid";
                      ratingCls = "bg-sky-500/10 text-sky-600";
                    }

                    return (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10">
                        <td className="py-3 font-bold text-stone-850 dark:text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400" /> {t.tableNumber}
                        </td>
                        <td className="py-3 text-center text-stone-500 font-bold font-mono">{t.turnovers} sales</td>
                        <td className="py-3 text-center text-stone-800 dark:text-stone-200 font-bold font-mono">
                          {t.avgOccupancyMins} mins
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${ratingCls}`}>
                            {rating}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CATEGORY RATIOS (PIE) & TABULAR REPORTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Category Sales distribution visual pie graph */}
        <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
            <PieIcon className="size-4 text-indigo-500" /> Category Revenue Breakdown
          </h3>

          {topCategoriesList.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-stone-450 italic">No sales logs to break down.</div>
          ) : (
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={topCategoriesList}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {topCategoriesList.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden space-y-4">
          <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
            <Utensils className="size-4 text-orange-500" /> Best Selling Products
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 text-stone-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Product</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {topProductsList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-stone-400 italic">
                      No sales transactions.
                    </td>
                  </tr>
                ) : (
                  topProductsList.slice(0, 5).map((prod, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10">
                      <td className="py-3.5 font-bold text-stone-850 dark:text-stone-200 truncate max-w-[120px]">{prod.name}</td>
                      <td className="py-3.5 text-center text-stone-500 font-mono font-bold">{prod.qty} units</td>
                      <td className="py-3.5 text-right font-black text-stone-900 dark:text-white font-mono">₹{prod.rev.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highest Value Orders Table */}
        <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
            <TrendingUp className="size-4 text-primary" /> High-Value Orders
          </h3>
          <div className="space-y-3">
            {topOrdersList.length === 0 ? (
              <p className="text-stone-450 italic text-center py-8">No settled sales logs found.</p>
            ) : (
              topOrdersList.map((order, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-850 rounded-2xl hover:border-primary/25 transition-all">
                  <div>
                    <p className="font-bold text-stone-850 dark:text-stone-200 text-xs">{order.orderNumber}</p>
                    <span className="text-[10px] text-stone-450 dark:text-stone-500 font-bold uppercase tracking-wider">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </span>
                  </div>
                  <span className="font-black text-primary font-mono text-sm">₹{order.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

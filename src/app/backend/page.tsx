"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, Product, Category, User, Coupon, Promotion, Floor, Table, Booking, Order } from "@/app/context/AppContext";

export default function AdminBackend() {
  const router = useRouter();
  const {
    currentUser,
    users,
    categories,
    products,
    paymentMethods,
    floors,
    tables,
    customers,
    coupons,
    promotions,
    orders,
    bookings,
    sessionsList,
    createUser,
    updateUserPassword,
    toggleArchiveUser,
    deleteUser,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    createFloor,
    createTable,
    toggleTableStatus,
    createCoupon,
    toggleCouponActive,
    createPromotion,
    togglePromoActive,
    togglePaymentMethod,
    saveUpiId,
    createBooking,
    updateBookingStatus
  } = useApp();

  // Navigation tabs: "dashboard", "products", "categories", "tables", "promos", "payments", "users", "bookings"
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCatId, setProdCatId] = useState("");
  const [prodUom, setProdUom] = useState("per piece");
  const [prodTax, setProdTax] = useState("5.00");
  const [prodDesc, setProdDesc] = useState("");
  // Inline category creation within product form
  const [showInlineCatForm, setShowInlineCatForm] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");
  const [inlineCatColor, setInlineCatColor] = useState("#854d0e");

  // Category CRUD states
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#EF4444");

  // Floor & Table states
  const [newFloorName, setNewFloorName] = useState("");
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableFloorId, setTableFloorId] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [tableSeats, setTableSeats] = useState("4");

  // Coupon & Promo states
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percentage" | "fixed">("percentage");
  const [couponValue, setCouponValue] = useState("");

  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoName, setPromoName] = useState("");
  const [promoType, setPromoType] = useState<"product" | "order">("product");
  const [promoTargetProduct, setPromoTargetProduct] = useState("");
  const [promoMinQty, setPromoMinQty] = useState("2");
  const [promoMinOrderAmt, setPromoMinOrderAmt] = useState("30.00");
  const [promoDiscountType, setPromoDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [promoDiscountValue, setPromoDiscountValue] = useState("");

  // Employee CRUD states
  const [showUserForm, setShowUserForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "employee">("employee");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  // Booking states
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingCustId, setBookingCustId] = useState("");
  const [bookingTableId, setBookingTableId] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingGuests, setBookingGuests] = useState("2");
  const [bookingNotes, setBookingNotes] = useState("");

  // Report Filter states (2.9)
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "custom">("today");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [filterProductId, setFilterProductId] = useState<string>("all");

  useEffect(() => {
    // Default select category/floor in forms
    if (categories.length > 0) setProdCatId(String(categories[0].id));
    if (floors.length > 0) setTableFloorId(String(floors[0].id));
    if (products.length > 0) setPromoTargetProduct(String(products[0].id));
    if (customers.length > 0) setBookingCustId(String(customers[0].id));
    if (tables.length > 0) setBookingTableId(String(tables[0].id));
  }, [categories, floors, products, customers, tables]);

  // Security warning: redirect to home if not logged in, or to dashboard if not admin
  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    } else if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [currentUser, isAdmin, router]);

  if (!currentUser || !isAdmin) return null;

  // ==========================================
  // Product Form submit
  // ==========================================
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    const parsedPrice = parseFloat(prodPrice);
    const parsedTax = parseFloat(prodTax);
    const catIdNum = prodCatId || null;

    if (editingProductId !== null) {
      updateProduct(editingProductId, {
        name: prodName,
        categoryId: catIdNum,
        price: parsedPrice,
        unitOfMeasure: prodUom,
        taxPercentage: parsedTax,
        description: prodDesc
      });
      setEditingProductId(null);
    } else {
      createProduct({
        name: prodName,
        categoryId: catIdNum,
        price: parsedPrice,
        unitOfMeasure: prodUom,
        taxPercentage: parsedTax,
        description: prodDesc
      });
    }

    setProdName("");
    setProdPrice("");
    setProdDesc("");
    setShowProductForm(false);
  };

  const handleInlineCatCreate = () => {
    if (!inlineCatName) return;
    const newCat = createCategory({
      name: inlineCatName,
      color: inlineCatColor
    });
    setProdCatId(newCat.id);
    setInlineCatName("");
    setShowInlineCatForm(false);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdName(prod.name);
    setProdCatId(prod.categoryId ? prod.categoryId : "");
    setProdPrice(String(prod.price));
    setProdUom(prod.unitOfMeasure);
    setProdTax(String(prod.taxPercentage));
    setProdDesc(prod.description);
    setShowProductForm(true);
  };

  // ==========================================
  // Category Form submit
  // ==========================================
  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    if (editingCatId !== null) {
      updateCategory(editingCatId, { name: catName, color: catColor });
      setEditingCatId(null);
    } else {
      createCategory({ name: catName, color: catColor });
    }

    setCatName("");
    setShowCatForm(false);
  };

  // ==========================================
  // Floor & Table submits
  // ==========================================
  const handleFloorCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName) return;
    createFloor(newFloorName);
    setNewFloorName("");
    alert("New Floor created!");
  };

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFloorId || !tableNumber || !tableSeats) return;

    createTable({
      floorId: tableFloorId,
      tableNumber,
      seats: parseInt(tableSeats) || 4
    });

    setTableNumber("");
    setShowTableForm(false);
    alert(`Table ${tableNumber} created successfully!`);
  };

  // ==========================================
  // Promotion & Coupon Submits
  // ==========================================
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponValue) return;

    createCoupon({
      code: couponCode.toUpperCase(),
      discountType: couponType,
      discountValue: parseFloat(couponValue)
    });

    setCouponCode("");
    setCouponValue("");
    setShowCouponForm(false);
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName || !promoDiscountValue) return;

    createPromotion({
      name: promoName,
      promoType: promoType,
      targetProductId: promoType === "product" ? promoTargetProduct : null,
      minQuantity: promoType === "product" ? parseInt(promoMinQty) : null,
      minOrderAmount: promoType === "order" ? parseFloat(promoMinOrderAmt) : null,
      discountType: promoDiscountType,
      discountValue: parseFloat(promoDiscountValue)
    });

    setPromoName("");
    setPromoDiscountValue("");
    setShowPromoForm(false);
  };

  // ==========================================
  // User creation submits
  // ==========================================
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || (!editingUserId && !userPassword)) return;

    if (editingUserId !== null) {
      if (userPassword) {
        updateUserPassword(editingUserId, userPassword);
      }
      alert("Password updated!");
      setEditingUserId(null);
    } else {
      createUser({
        name: userName,
        email: userEmail,
        passwordHash: userPassword,
        role: userRole
      });
      alert(`Account for ${userName} registered!`);
    }

    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setShowUserForm(false);
  };

  // ==========================================
  // Reservation Bookings submit
  // ==========================================
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCustId || !bookingTableId || !bookingTime || !bookingGuests) return;

    createBooking({
      customerId: bookingCustId,
      tableId: bookingTableId,
      bookingTime,
      guestsCount: parseInt(bookingGuests) || 2,
      status: "pending",
      notes: bookingNotes
    });

    setBookingNotes("");
    setShowBookingForm(false);
    alert("Table reservation booking logged successfully!");
  };

  // ==========================================
  // dynamic filtering calculations for reports (2.9)
  // ==========================================

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

  const handleExportSimulated = (format: "pdf" | "xls") => {
    alert(`Generating dynamic ${format.toUpperCase()} report with selected filters...\nDownload triggered successfully!`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#faf8f5] text-[#1c1917] dark:bg-[#0c0a09] dark:text-[#f5f5f4] font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Brand header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white text-xl font-bold flex items-center justify-center shadow-md">
            ⚙️
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-primary dark:text-amber-500">Cafe POS Backend</h1>
            <p className="text-[10px] text-stone-500">Configurations & Reports</p>
          </div>
        </div>

        {/* Tab Items */}
        <nav className="flex-1 p-4 space-y-1.5 text-xs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "dashboard"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            📊 Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "products"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            📦 Products List
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "categories"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            🏷️ Product Categories
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "tables"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            🗺️ Floors & Tables
          </button>
          <button
            onClick={() => setActiveTab("promos")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "promos"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            🎁 Coupons & Promotions
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "payments"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            💳 Payment Setup
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "users"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            👥 Cashier Employees
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
              activeTab === "bookings"
                ? "bg-primary text-white shadow-md"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            📅 Bookings log
          </button>

          <div className="h-px bg-stone-200 dark:bg-stone-800 my-4"></div>

          {/* Quick exits */}
          <button
            onClick={() => router.push("/terminal")}
            className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-500 font-semibold"
          >
            ← POS Terminal View
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-500 font-semibold"
          >
            ⚙️ POS Sessions
          </button>
        </nav>

        {/* Footer profile log */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 text-xs bg-stone-50 dark:bg-stone-900/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center font-black">
            👤
          </div>
          <div>
            <p className="font-bold text-stone-800 dark:text-stone-200">{currentUser.name}</p>
            <p className="text-[10px] text-stone-400 capitalize">{currentUser.role}</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE PANEL */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
        
        {/* ========================================================
            1. ANALYTICS DASHBOARD (2.9)
        ======================================================== */}
        {activeTab === "dashboard" && (
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

            {/* DASHBOARD FILTERS (2.9 FILTER SEGMENTS) */}
            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-stone-800 dark:text-stone-200 mb-2 uppercase tracking-wider text-[10px]">Filter Dashboard Records</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                {/* 1. Period Selector */}
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Time Period</label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
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
                        className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 font-bold mb-1">End Date</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
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
                    className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
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
                    className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
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
                    className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                  >
                    <option value="all">All Products</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* SUMMARY METRICS CARDS (2.9 METRIC CARDS) */}
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

            {/* DASHBOARD CHARTS ROW (2.9 VISUAL GRAPHS & TABULAR STATS) */}
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
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
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
                          <tr key={idx}>
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
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-xl">
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
        )}

        {/* ========================================================
            2. PRODUCTS MANAGER (2.2)
        ======================================================== */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
              <div>
                <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">POS Products Directory</h2>
                <p className="text-stone-500 mt-0.5">List, configure, or register menu catalog products.</p>
              </div>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setProdName("");
                  setProdPrice("");
                  setProdDesc("");
                  setShowProductForm(true);
                }}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
              >
                + Register New Product
              </button>
            </div>

            {/* Product form dropdown popup */}
            {showProductForm && (
              <form onSubmit={handleProductSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-xl">
                <h3 className="font-extrabold text-sm border-b border-stone-100 pb-2">
                  {editingProductId !== null ? "Modify Product Details" : "Register New Product"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Product Name</label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g. Mocha Latte"
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-950 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="e.g. 4.50"
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-950 dark:text-white"
                      required
                    />
                  </div>

                  {/* 2.2 INLINE CATEGORY PICKER / CREATOR */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-stone-400 font-bold">Category Assignment</label>
                      <button
                        type="button"
                        onClick={() => setShowInlineCatForm(!showInlineCatForm)}
                        className="text-primary font-bold hover:underline"
                      >
                        {showInlineCatForm ? "Cancel inline create" : "+ Create category inline"}
                      </button>
                    </div>

                    {!showInlineCatForm ? (
                      <select
                        value={prodCatId}
                        onChange={(e) => setProdCatId(e.target.value)}
                        className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                      >
                        <option value="">No Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-3 animate-fade-in">
                        <p className="font-bold text-[10px] text-stone-400">Add Inline Category</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={inlineCatName}
                            onChange={(e) => setInlineCatName(e.target.value)}
                            placeholder="Category Name"
                            className="p-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white"
                          />
                          <input
                            type="color"
                            value={inlineCatColor}
                            onChange={(e) => setInlineCatColor(e.target.value)}
                            className="w-full h-8 p-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg cursor-pointer"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleInlineCatCreate}
                          className="px-3 py-1 bg-primary text-white font-bold rounded-lg"
                        >
                          Add & Select Category
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Unit of Measure</label>
                    <select
                      value={prodUom}
                      onChange={(e) => setProdUom(e.target.value)}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                    >
                      <option value="per piece">per piece</option>
                      <option value="per kg">per kg</option>
                      <option value="per litre">per litre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Tax Percentage (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prodTax}
                      onChange={(e) => setProdTax(e.target.value)}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-950 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-stone-400 font-bold mb-1">Description</label>
                    <textarea
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={2}
                      placeholder="Product description for receipts..."
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                    Save Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of products */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => {
                const cat = categories.find(c => c.id === prod.categoryId);
                
                return (
                  <div key={prod.id} className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className="px-2.5 py-0.5 rounded text-[10px] font-bold text-stone-700 uppercase"
                          style={{ backgroundColor: `${cat?.color || "#E2E8F0"}33`, borderLeft: `3px solid ${cat?.color || "#E2E8F0"}` }}
                        >
                          {cat ? cat.name : "No Category"}
                        </span>
                        <span className="font-mono text-stone-400">ID #{prod.id}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-stone-800 dark:text-white">{prod.name}</h4>
                      <p className="text-stone-400 text-xs mt-1 leading-tight">{prod.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                      <div>
                        <p className="font-black text-sm text-primary dark:text-amber-500">${prod.price.toFixed(2)}</p>
                        <span className="text-[10px] text-stone-500 block uppercase tracking-wider mt-0.5">{prod.unitOfMeasure}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditProduct(prod)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 rounded font-bold text-[10px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete product ${prod.name}?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded font-bold text-[10px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            3. CATEGORIES MANAGER (2.3)
        ======================================================== */}
        {activeTab === "categories" && (
          <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
              <div>
                <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Product Categories Setup</h2>
                <p className="text-stone-500 mt-0.5">Colors assigned below automatically sync across terminals and ticket headers.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCatId(null);
                  setCatName("");
                  setCatColor("#EF4444");
                  setShowCatForm(true);
                }}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
              >
                + Create Category
              </button>
            </div>

            {/* Cat form */}
            {showCatForm && (
              <form onSubmit={handleCatSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-sm">
                <h3 className="font-extrabold text-sm">
                  {editingCatId !== null ? "Edit Category Details" : "Create New Product Category"}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Category Title</label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g. Desserts, Specials"
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Assigned Color Code</label>
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-full h-10 p-1 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                    Save Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCatForm(false)}
                    className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Categories table list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: cat.color }}></span>
                    <div>
                      <h4 className="font-extrabold text-sm">{cat.name}</h4>
                      <p className="text-stone-400 text-[10px] uppercase font-mono">{cat.color}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setCatName(cat.name);
                        setCatColor(cat.color);
                        setShowCatForm(true);
                      }}
                      className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 rounded-lg font-bold text-[10px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category ${cat.name}?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-danger rounded-lg font-bold text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            4. FLOORS & TABLES LAYOUT DESIGNER (2.5)
        ======================================================== */}
        {activeTab === "tables" && (
          <div className="space-y-8 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
            <div>
              <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Cafe Table layouts & Floorplans</h2>
              <p className="text-stone-500 mt-0.5">Design zones/floors and add customer dining tables.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Floor Plan Creator */}
              <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm">Add Floor Location Zone</h3>
                <form onSubmit={handleFloorCreate} className="space-y-4">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Zone Name</label>
                    <input
                      type="text"
                      value={newFloorName}
                      onChange={(e) => setNewFloorName(e.target.value)}
                      placeholder="e.g. Balcony Patio"
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                      required
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                    Create Zone
                  </button>
                </form>

                {/* List of zones */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <p className="font-bold text-[10px] text-stone-400 uppercase">Registered Zones:</p>
                  {floors.map(f => (
                    <div key={f.id} className="p-2 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-lg flex justify-between font-bold">
                      <span>🏢 {f.name}</span>
                      <span className="text-stone-400">ID #{f.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Creator */}
              <div className="lg:col-span-2 p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm">Dining Tables Setup</h3>
                  <button
                    onClick={() => setShowTableForm(!showTableForm)}
                    className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl"
                  >
                    + Register Dining Table
                  </button>
                </div>

                {showTableForm && (
                  <form onSubmit={handleTableSubmit} className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs uppercase text-stone-400">New Table details</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-500 mb-1">Select Zone</label>
                        <select
                          value={tableFloorId}
                          onChange={(e) => setTableFloorId(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl"
                        >
                          {floors.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-500 mb-1">Table Code/Number</label>
                        <input
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="e.g. T-15"
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-stone-500 mb-1">Seats Capacity</label>
                        <input
                          type="number"
                          min="1"
                          value={tableSeats}
                          onChange={(e) => setTableSeats(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                      Save Table
                    </button>
                  </form>
                )}

                {/* Grid of dining tables */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {tables.map((table) => {
                    const floor = floors.find(f => f.id === table.floorId);
                    
                    return (
                      <div
                        key={table.id}
                        className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                          table.isActive
                            ? "bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800"
                            : "bg-stone-100 border-stone-200 dark:bg-stone-950 dark:border-stone-900 opacity-60"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] text-stone-400">
                          <span className="font-semibold uppercase tracking-wider">{floor ? floor.name : "Zone"}</span>
                          <span className="font-mono">Seats: {table.seats}</span>
                        </div>
                        <h4 className="font-black text-sm text-stone-800 dark:text-white">{table.tableNumber}</h4>
                        
                        <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-2.5">
                          <span className="text-[10px] font-bold text-stone-400 uppercase">
                            {table.isActive ? "Active" : "Archived"}
                          </span>
                          <button
                            onClick={() => toggleTableStatus(table.id)}
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                              table.isActive
                                ? "bg-red-500/10 text-danger hover:bg-red-500/20"
                                : "bg-green-500/10 text-success hover:bg-green-500/20"
                            }`}
                          >
                            {table.isActive ? "Archive" : "Activate"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            5. COUPON & PROMOTION GENERATOR (2.6)
        ======================================================== */}
        {activeTab === "promos" && (
          <div className="space-y-8 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
            <div>
              <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Discounts, Coupons & Promos Designer</h2>
              <p className="text-stone-500 mt-0.5">Setup coupon codes or create automated basket promotions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Coupon Codes config */}
              <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm">Manual Coupon Codes</h3>
                  <button
                    onClick={() => setShowCouponForm(!showCouponForm)}
                    className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl"
                  >
                    + Create Coupon Code
                  </button>
                </div>

                {showCouponForm && (
                  <form onSubmit={handleCouponSubmit} className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-3 animate-fade-in">
                    <h4 className="font-bold text-xs uppercase text-stone-400">Coupon Details</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-stone-500 mb-1">Code Name</label>
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="e.g. COFFEE20"
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl uppercase font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-stone-500 mb-1">Discount Mode</label>
                        <select
                          value={couponType}
                          onChange={(e) => setCouponType(e.target.value as any)}
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Cash ($)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-500 mb-1">Discount Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={couponValue}
                          onChange={(e) => setCouponValue(e.target.value)}
                          placeholder="e.g. 15.00"
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                      Save Coupon
                    </button>
                  </form>
                )}

                {/* Coupon list */}
                <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-stone-800 dark:text-stone-100 font-mono text-sm">{coupon.code}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                          {coupon.discountType === "percentage" ? `${coupon.discountValue}% Off total order` : `$${coupon.discountValue} Flat cash off`}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleCouponActive(coupon.id)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                          coupon.isActive
                            ? "bg-red-500/10 text-danger hover:bg-red-500/20"
                            : "bg-green-500/10 text-success hover:bg-green-500/20"
                        }`}
                      >
                        {coupon.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated Promotions config */}
              <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm">Automated Promotion Rules</h3>
                  <button
                    onClick={() => setShowPromoForm(!showPromoForm)}
                    className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl"
                  >
                    + Create Promo Rule
                  </button>
                </div>

                {showPromoForm && (
                  <form onSubmit={handlePromoSubmit} className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4 animate-fade-in">
                    <h4 className="font-bold text-xs uppercase text-stone-400">Promotion Rules Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-stone-500 mb-1">Promotion Title</label>
                        <input
                          type="text"
                          value={promoName}
                          onChange={(e) => setPromoName(e.target.value)}
                          placeholder="e.g. Cappuccino combo discount"
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-stone-500 mb-1">Promo Type Trigger</label>
                          <select
                            value={promoType}
                            onChange={(e) => setPromoType(e.target.value as any)}
                            className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl"
                          >
                            <option value="product">Product Quantity trigger</option>
                            <option value="order">Order Subtotal amount trigger</option>
                          </select>
                        </div>

                        {promoType === "product" ? (
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <label className="block text-stone-500 mb-1">Product</label>
                              <select
                                value={promoTargetProduct}
                                onChange={(e) => setPromoTargetProduct(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-stone-500 mb-1">Min Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={promoMinQty}
                                onChange={(e) => setPromoMinQty(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-stone-500 mb-1">Min Order Subtotal ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={promoMinOrderAmt}
                              onChange={(e) => setPromoMinOrderAmt(e.target.value)}
                              className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-stone-200 dark:border-stone-850 pt-3">
                        <div>
                          <label className="block text-stone-500 mb-1">Discount Mode</label>
                          <select
                            value={promoDiscountType}
                            onChange={(e) => setPromoDiscountType(e.target.value as any)}
                            className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Cash ($)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-stone-500 mb-1">Discount Value</label>
                          <input
                            type="number"
                            step="0.01"
                            value={promoDiscountValue}
                            onChange={(e) => setPromoDiscountValue(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                      Save Promo Rule
                    </button>
                  </form>
                )}

                {/* Promo list */}
                <div className="space-y-3">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-stone-850 dark:text-stone-150 text-xs">{promo.name}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Trigger: {promo.promoType === "product" ? `Qty >= ${promo.minQuantity} of ${products.find(p => p.id === promo.targetProductId)?.name}` : `Subtotal >= $${promo.minOrderAmount}`}
                        </p>
                        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Discount: {promo.discountType === "percentage" ? `${promo.discountValue}% Off whole order` : `$${promo.discountValue} Flat cash`}
                        </span>
                      </div>

                      <button
                        onClick={() => togglePromoActive(promo.id)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                          promo.isActive
                            ? "bg-red-500/10 text-danger hover:bg-red-500/20"
                            : "bg-green-500/10 text-success hover:bg-green-500/20"
                        }`}
                      >
                        {promo.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            6. PAYMENT METHODS Setup (2.4)
        ======================================================== */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
            <div>
              <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Payment Modes Configurator</h2>
              <p className="text-stone-500 mt-0.5">Enable/disable payment modes and configure active QR merchant UPI IDs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paymentMethods.map((pm) => {
                const [upiInput, setUpiInput] = useState(pm.upiId || "");
                
                return (
                  <div key={pm.id} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">
                        {pm.type === "cash" ? "💵" : pm.type === "card" ? "💳" : "📱"}
                      </span>
                      {/* Active toggle */}
                      <button
                        onClick={() => togglePaymentMethod(pm.id)}
                        className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                          pm.isEnabled
                            ? "bg-green-500/10 text-success"
                            : "bg-stone-100 text-stone-400 dark:bg-stone-800"
                        }`}
                      >
                        {pm.isEnabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm">{pm.name}</h4>
                      <p className="text-stone-400 text-[10px] uppercase tracking-wider mt-0.5">Type: {pm.type}</p>
                    </div>

                    {/* UPI Custom ID configuration field */}
                    {pm.type === "upi" && (
                      <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                        <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Merchant UPI ID</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={upiInput}
                            onChange={(e) => setUpiInput(e.target.value)}
                            placeholder="e.g. cafe@ybl"
                            className="flex-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 rounded-xl font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              saveUpiId(pm.id, upiInput);
                              alert(`UPI ID saved for QR code generator: ${upiInput}`);
                            }}
                            className="px-3 py-2 bg-primary text-white font-bold rounded-xl"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            7. USER / EMPLOYEE MANAGER (2.7)
        ======================================================== */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
              <div>
                <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Cashier & Staff Accounts</h2>
                <p className="text-stone-500 mt-0.5">Manage credentials, toggle roles and archive staff access.</p>
              </div>
              <button
                onClick={() => {
                  setEditingUserId(null);
                  setUserName("");
                  setUserEmail("");
                  setUserPassword("");
                  setUserRole("employee");
                  setShowUserForm(true);
                }}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
              >
                + Add Employee Account
              </button>
            </div>

            {showUserForm && (
              <form onSubmit={handleUserSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-sm">
                <h3 className="font-extrabold text-sm">
                  {editingUserId !== null ? "Change Password" : "Register Employee Account"}
                </h3>
                <div className="space-y-3">
                  {editingUserId === null && (
                    <>
                      <div>
                        <label className="block text-stone-400 font-bold mb-1">Employee Name</label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="e.g. Cashier Sarah"
                          className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold mb-1">Email Address</label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="sarah@cafepos.com"
                          className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 font-bold mb-1">Staff Access Role</label>
                        <select
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value as any)}
                          className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                        >
                          <option value="employee">Employee / Cashier</option>
                          <option value="admin">User / Admin</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">
                      {editingUserId !== null ? "Enter New Password" : "Login Password"}
                    </label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                      required={editingUserId === null}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                    Save Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUserForm(false)}
                    className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of user accounts */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-150 dark:border-stone-800 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4">Employee Name</th>
                      <th className="px-6 py-4">Login Email</th>
                      <th className="px-6 py-4">Access Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/10">
                        <td className="px-6 py-4 font-bold text-stone-800 dark:text-stone-200">{u.name}</td>
                        <td className="px-6 py-4 text-stone-500">{u.email}</td>
                        <td className="px-6 py-4 capitalize font-semibold">{u.role}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            u.isArchived ? "bg-red-500/15 text-danger" : "bg-green-500/15 text-success"
                          }`}>
                            {u.isArchived ? "Archived" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setUserPassword("");
                              setShowUserForm(true);
                            }}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 rounded font-bold text-[10px]"
                          >
                            Pass
                          </button>
                          <button
                            onClick={() => toggleArchiveUser(u.id)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 rounded font-bold text-[10px]"
                          >
                            {u.isArchived ? "Active" : "Archive"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete account for ${u.name}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded font-bold text-[10px]"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            8. RESERVATION BOOKINGS LOG
        ======================================================== */}
        {activeTab === "bookings" && (
          <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
              <div>
                <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Table Reservations & Booking Log</h2>
                <p className="text-stone-500 mt-0.5">Schedule guest bookings for specific dining tables.</p>
              </div>
              <button
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
              >
                + Log Table Booking
              </button>
            </div>

            {showBookingForm && (
              <form onSubmit={handleBookingSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-xl">
                <h3 className="font-extrabold text-sm">Create Dining Reservation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-500 mb-1">Select Guest Customer</label>
                    <select
                      value={bookingCustId}
                      onChange={(e) => setBookingCustId(e.target.value)}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">Select Dining Table</label>
                    <select
                      value={bookingTableId}
                      onChange={(e) => setBookingTableId(e.target.value)}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{t.tableNumber} ({t.seats} seats)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">Booking Date & Time</label>
                    <input
                      type="datetime-local"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">Guests Count</label>
                    <input
                      type="number"
                      min="1"
                      value={bookingGuests}
                      onChange={(e) => setBookingGuests(e.target.value)}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-stone-500 mb-1">Special Notes / Requests</label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={2}
                      placeholder="e.g. Anniversary celebration, birthday cake, window seat preferred"
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl">
                    Log Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Bookings table representation */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-150 dark:border-stone-800 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4">Guest Customer</th>
                      <th className="px-6 py-4">Table</th>
                      <th className="px-6 py-4">Reservation Time</th>
                      <th className="px-6 py-4">Guests</th>
                      <th className="px-6 py-4">Notes</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {bookings.map((booking) => {
                      const cust = customers.find(c => c.id === booking.customerId);
                      const table = tables.find(t => t.id === booking.tableId);
                      
                      return (
                        <tr key={booking.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/10">
                          <td className="px-6 py-4 font-bold text-stone-800 dark:text-stone-200">
                            {cust ? cust.name : `Guest ID #${booking.customerId}`}
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary dark:text-amber-500">
                            {table ? table.tableNumber : `Table ID #${booking.tableId}`}
                          </td>
                          <td className="px-6 py-4 text-stone-500">
                            {new Date(booking.bookingTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">{booking.guestsCount} guests</td>
                          <td className="px-6 py-4 text-stone-400 italic font-light truncate max-w-xs">{booking.notes || "None"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              booking.status === "confirmed"
                                ? "bg-green-500/10 text-success"
                                : booking.status === "pending"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-red-500/10 text-danger"
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {booking.status === "pending" && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-success rounded font-bold text-[10px]"
                              >
                                Confirm
                              </button>
                            )}
                            {booking.status !== "cancelled" && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded font-bold text-[10px]"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

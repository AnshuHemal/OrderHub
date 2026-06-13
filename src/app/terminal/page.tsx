"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, Product, Order, OrderItem, Customer, Table } from "@/app/context/AppContext";

export default function PosTerminal() {
  const router = useRouter();
  const {
    currentUser,
    activeSession,
    products,
    categories,
    tables,
    floors,
    customers,
    coupons,
    promotions,
    orders,
    paymentMethods,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    currentOrder,
    setCurrentOrder,
    loadTableOrder,
    addToCart,
    updateCartQty,
    applyManualCoupon,
    removeCoupon,
    linkCustomerToOrder,
    sendOrderToKitchen,
    processOrderPayment,
    cancelDraftOrder,
    editDraftOrder,
    createNewOrder,
    closeSession
  } = useApp();

  // Navigation tabs: "order" (POS Order View), "orders" (Orders history), "customer" (Customer management), "table" (Table floor plan)
  const [activeTab, setActiveTab] = useState<"order" | "orders" | "customer" | "table">("table");
  
  // Search states
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Selected floor in table view
  const [selectedFloorId, setSelectedFloorId] = useState<number>(1);

  // Modals & Popups
  const [showHamburger, setShowHamburger] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Checkout flow state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [cardReference, setCardReference] = useState("");
  const [upiQrConfirmed, setUpiQrConfirmed] = useState(false);

  // Receipt popup state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptEmailInput, setReceiptEmailInput] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);

  // View details order popup
  const [viewingOrderDetails, setViewingOrderDetails] = useState<Order | null>(null);

  // Security Check: Redirect to home page if no user or no active session
  useEffect(() => {
    if (!currentUser || !activeSession) {
      router.push("/");
    } else {
      if (floors.length > 0) {
        setSelectedFloorId(floors[0].id);
      }
    }
  }, [currentUser, activeSession, floors, router]);

  if (!currentUser || !activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-100 dark:bg-stone-950">
        <div className="text-center space-y-4">
          <p className="text-xl font-bold">A session is not currently open.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            Go to Session Opener
          </button>
        </div>
      </div>
    );
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
    return p.isActive && matchesSearch && matchesCategory;
  });

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (o.sessionId !== activeSession.id) return false;
    const cust = customers.find(c => c.id === o.customerId);
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchesSearch;
  });

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase())
    );
  });

  // Find active table details
  const activeTable = currentOrder?.tableId
    ? tables.find((t) => t.id === currentOrder.tableId)
    : null;

  // Find linked customer details
  const linkedCustomer = currentOrder?.customerId
    ? customers.find((c) => c.id === currentOrder.customerId)
    : null;

  // Send to kitchen action handler
  const handleSendToKitchen = () => {
    if (!currentOrder || currentOrder.items.length === 0) return;
    sendOrderToKitchen();
    alert(`Order ${currentOrder.orderNumber} sent to kitchen display!`);
  };

  // Checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !selectedPaymentId) return;

    const pm = paymentMethods.find((p) => p.id === selectedPaymentId);
    if (!pm) return;

    let refStr = "";
    if (pm.type === "cash") {
      const rec = parseFloat(cashReceived);
      if (isNaN(rec) || rec < currentOrder.total) {
        alert("Received cash must be equal to or greater than the order total.");
        return;
      }
      refStr = `Received: $${rec.toFixed(2)}, Change: $${(rec - currentOrder.total).toFixed(2)}`;
    } else if (pm.type === "card") {
      if (!cardReference) {
        alert("Please enter transaction reference code.");
        return;
      }
      refStr = `Ref: ${cardReference}`;
    } else if (pm.type === "upi") {
      refStr = `UPI QR Confirmed (${pm.upiId})`;
    }

    // Capture order details before resetting
    const completedOrder: Order = {
      ...currentOrder,
      status: "paid",
      paymentMethodId: selectedPaymentId,
      paymentReference: refStr
    };

    processOrderPayment(selectedPaymentId, refStr);
    
    // Close checkout and trigger receipt review
    setShowCheckoutModal(false);
    setReceiptOrder(completedOrder);
    if (completedOrder.customerId) {
      const cust = customers.find(c => c.id === completedOrder.customerId);
      if (cust) setReceiptEmailInput(cust.email);
    }
    setShowReceiptModal(true);

    // Reset payment states
    setCashReceived("");
    setCardReference("");
    setSelectedPaymentId(null);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");
    setDiscountSuccess("");
    if (!couponCodeInput) return;

    const result = applyManualCoupon(couponCodeInput);
    if (result.success) {
      setDiscountSuccess(result.message);
      setCouponCodeInput("");
      setTimeout(() => setShowDiscountModal(false), 800);
    } else {
      setDiscountError(result.message);
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      });
      setEditingCustomer(null);
    } else {
      const newCust = createCustomer({
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      });
      // Automatically link to order if we came from POS order
      if (currentOrder && activeTab === "order") {
        linkCustomerToOrder(newCust.id);
      }
    }

    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setShowCustomerModal(false);
  };

  const startEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustomerName(cust.name);
    setCustomerEmail(cust.email);
    setCustomerPhone(cust.phone);
    setShowCustomerModal(true);
  };

  const handleEmailReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptEmailInput) return;
    setEmailSentStatus(true);
    setTimeout(() => {
      setEmailSentStatus(false);
      alert(`Receipt email successfully queued to ${receiptEmailInput}!`);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100 dark:bg-stone-950 font-sans">
      {/* 3.1 TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-extrabold text-primary dark:text-amber-500 flex items-center gap-1">
            <span>☕</span>
            <span>Cafe POS</span>
          </div>
          
          {/* Quick Nav Options */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("table");
                setCurrentOrder(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "table"
                  ? "bg-white dark:bg-stone-700 shadow-sm text-primary dark:text-white"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              }`}
            >
              🗺️ Floor Plan
            </button>
            <button
              onClick={() => {
                if (!currentOrder) {
                  // Prompt to select table or start quick order
                  if (confirm("No active order. Create a Quick Counter Order (no table)?")) {
                    createNewOrder(null);
                    setActiveTab("order");
                  }
                } else {
                  setActiveTab("order");
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "order"
                  ? "bg-white dark:bg-stone-700 shadow-sm text-primary dark:text-white"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              }`}
            >
              🛒 POS Order
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-white dark:bg-stone-700 shadow-sm text-primary dark:text-white"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              }`}
            >
              📋 Orders Log
            </button>
            <button
              onClick={() => setActiveTab("customer")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "customer"
                  ? "bg-white dark:bg-stone-700 shadow-sm text-primary dark:text-white"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              }`}
            >
              👥 Customers
            </button>
          </nav>
        </div>

        {/* Search Bar / Context Panel */}
        <div className="flex-1 max-w-md mx-6 hidden lg:block">
          {activeTab === "order" ? (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">🔍</span>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Quick search products by name..."
                className="w-full pl-9 pr-4 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-sm text-stone-900 dark:text-white"
              />
            </div>
          ) : activeTab === "orders" ? (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">🔍</span>
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders (by order #, customer name)..."
                className="w-full pl-9 pr-4 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-sm text-stone-900 dark:text-white"
              />
            </div>
          ) : activeTab === "customer" ? (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">🔍</span>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer by name, email or phone..."
                className="w-full pl-9 pr-4 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-sm text-stone-900 dark:text-white"
              />
            </div>
          ) : null}
        </div>

        {/* Current Table Indicator, Employee and Hamburger Menu */}
        <div className="flex items-center gap-3">
          {activeTable ? (
            <div className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              {activeTable.tableNumber}
            </div>
          ) : currentOrder ? (
            <div className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-bold rounded-lg uppercase tracking-wider">
              Takeaway
            </div>
          ) : (
            <div className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-400 text-xs font-semibold rounded-lg italic">
              No Table
            </div>
          )}

          <div className="h-8 w-px bg-stone-200 dark:bg-stone-800"></div>

          {/* User Profile display */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 text-primary dark:text-amber-500 flex items-center justify-center font-bold text-sm shadow-inner">
              👤
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="text-xs text-stone-400">Cashier</p>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{currentUser.name}</p>
            </div>
          </div>

          {/* Hamburger Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowHamburger(!showHamburger)}
              className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors text-stone-600 dark:text-stone-300"
            >
              ☰
            </button>
            {showHamburger && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-sm">
                <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">Go to Views</p>
                <button
                  onClick={() => { setShowHamburger(false); router.push("/kitchen"); }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                >
                  🖥️ Kitchen Display (KDS)
                </button>
                {currentUser.role === "admin" && (
                  <button
                    onClick={() => { setShowHamburger(false); router.push("/backend"); }}
                    className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                  >
                    ⚙️ Admin Settings panel
                  </button>
                )}
                
                <div className="h-px bg-stone-200 dark:bg-stone-800 my-2"></div>
                <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">Navigation</p>
                <button onClick={() => { setActiveTab("table"); setShowHamburger(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800">🗺️ Floor Selector</button>
                <button onClick={() => { setActiveTab("orders"); setShowHamburger(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800">📋 Session Orders</button>
                <button onClick={() => { setActiveTab("customer"); setShowHamburger(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold">👥 Customers Directory</button>
                
                <div className="h-px bg-stone-200 dark:bg-stone-800 my-2"></div>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to CLOSE this POS Shift Session and review summary?")) {
                      closeSession();
                      router.push("/");
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-danger hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold"
                >
                  🔒 Close shift session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE NAV (Bottom Bar for small viewports) */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 grid grid-cols-4 py-2 text-center text-xs text-stone-500">
        <button onClick={() => { setActiveTab("table"); setCurrentOrder(null); }} className={`flex flex-col items-center gap-0.5 ${activeTab === "table" ? "text-primary font-bold" : ""}`}>
          <span className="text-lg">🗺️</span> Floor Plan
        </button>
        <button onClick={() => { if (!currentOrder) { createNewOrder(null); } setActiveTab("order"); }} className={`flex flex-col items-center gap-0.5 ${activeTab === "order" ? "text-primary font-bold" : ""}`}>
          <span className="text-lg">🛒</span> POS Order
        </button>
        <button onClick={() => setActiveTab("orders")} className={`flex flex-col items-center gap-0.5 ${activeTab === "orders" ? "text-primary font-bold" : ""}`}>
          <span className="text-lg">📋</span> Log
        </button>
        <button onClick={() => setActiveTab("customer")} className={`flex flex-col items-center gap-0.5 ${activeTab === "customer" ? "text-primary font-bold" : ""}`}>
          <span className="text-lg">👥</span> Guests
        </button>
      </footer>

      {/* MOBILE PRODUCT SEARCH / FILTER OVERLAY FOR ORDER TAB */}
      {activeTab === "order" && (
        <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 lg:hidden flex gap-2">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
          />
        </div>
      )}

      {/* ========================================================
          MAIN BODY LAYOUT
      ======================================================== */}
      <main className="flex-1 flex overflow-hidden pb-12 md:pb-0">
        
        {/* ========================================================
            TAB 1: FLOOR & TABLE GRID (3.2 FLOOR POP-UP VIEW)
        ======================================================== */}
        {activeTab === "table" && (
          <section className="flex-1 p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Restaurant Floor Selection</h2>
                <p className="text-sm text-stone-500">Pick an occupied table to continue, or tap an available table to seat guests.</p>
              </div>

              {/* Floor Tabs Selector */}
              <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-xl w-fit">
                {floors.map((floor) => (
                  <button
                    key={floor.id}
                    onClick={() => setSelectedFloorId(floor.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedFloorId === floor.id
                        ? "bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                    }`}
                  >
                    🏢 {floor.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tables Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {tables
                .filter((t) => t.floorId === selectedFloorId)
                .map((table) => {
                  // Check if table has an active draft order
                  const activeOrder = orders.find(
                    (o) => o.tableId === table.id && o.status === "draft" && o.sessionId === activeSession.id
                  );
                  const isOccupied = !!activeOrder;

                  return (
                    <button
                      key={table.id}
                      onClick={() => {
                        loadTableOrder(table.id);
                        setActiveTab("order");
                      }}
                      className={`relative flex flex-col items-center justify-between p-6 rounded-3xl border text-center transition-all duration-300 transform hover:scale-[1.03] shadow-md group ${
                        !table.isActive
                          ? "bg-stone-100/50 border-stone-200 text-stone-400 cursor-not-allowed opacity-50"
                          : isOccupied
                          ? "bg-red-500/10 border-danger hover:border-danger dark:bg-red-950/20 text-stone-800 dark:text-stone-200 shadow-red-500/5 glow-primary"
                          : "bg-white border-stone-200 hover:border-primary dark:bg-stone-900 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                      }`}
                      disabled={!table.isActive}
                    >
                      {/* Seat indicator */}
                      <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                        👥 {table.seats} seats
                      </span>

                      {/* Icon */}
                      <span className="text-3xl mt-4 mb-2 group-hover:scale-110 transition-transform">
                        🍽️
                      </span>

                      {/* Info */}
                      <div>
                        <p className="font-extrabold text-lg leading-tight">{table.tableNumber}</p>
                        {isOccupied ? (
                          <div className="mt-2 space-y-0.5">
                            <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-white bg-danger rounded-full">
                              Occupied
                            </span>
                            <p className="text-sm font-black text-danger mt-1">
                              ${activeOrder.total.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              {activeOrder.items.reduce((s, i) => s + i.quantity, 0)} items
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-success bg-green-500/10 dark:bg-green-500/20 rounded-full">
                              Available
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Quick checkout option */}
            <div className="pt-8 border-t border-stone-200 dark:border-stone-800 text-center">
              <button
                onClick={() => {
                  createNewOrder(null); // quick takeaway order
                  setActiveTab("order");
                }}
                className="px-6 py-3 bg-stone-950 hover:bg-stone-900 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
              >
                🛍️ Start Counter / Takeaway Order
              </button>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 2: ORDER VIEW (PRODUCT SECTION, CART, PAYMENT)
        ======================================================== */}
        {activeTab === "order" && currentOrder && (
          <section className="flex-1 flex flex-col md:flex-row overflow-hidden animate-fade-in">
            
            {/* Left: Products Section */}
            <div className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 overflow-y-auto">
              
              {/* Category tabs filters */}
              <div className="sticky top-0 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur z-10 px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategoryId === null
                      ? "bg-primary text-white shadow-md"
                      : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={{
                      borderLeft: `4px solid ${cat.color}`,
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 ${
                      selectedCategoryId === cat.id
                        ? "shadow-md ring-2 ring-stone-900 dark:ring-white"
                        : ""
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Grid of Product Cards */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((prod) => {
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  
                  return (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod, 1)}
                      className="group flex flex-col text-left bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-primary dark:hover:border-amber-500 overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      {/* Top category strip */}
                      <div
                        className="h-1.5 w-full"
                        style={{ backgroundColor: cat?.color || "#e2e8f0" }}
                      ></div>
                      
                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-stone-400 block mb-1">
                            {cat?.name || "Uncategorized"}
                          </span>
                          <h4 className="font-extrabold text-stone-800 dark:text-stone-200 group-hover:text-primary dark:group-hover:text-amber-500 transition-colors text-sm">
                            {prod.name}
                          </h4>
                          <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-tight">
                            {prod.description}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-3">
                          <span className="text-xs text-stone-400 italic">
                            {prod.unitOfMeasure}
                          </span>
                          <span className="text-sm font-black text-stone-800 dark:text-white">
                            ${prod.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Cart Section */}
            <div className="w-full md:w-96 flex flex-col bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800">
              
              {/* Cart Header */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900">
                <div>
                  <h3 className="font-black text-stone-800 dark:text-stone-100">Active Cart</h3>
                  <p className="text-xs text-stone-500">Order: {currentOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => cancelDraftOrder(currentOrder.id)}
                  className="p-1.5 text-xs font-semibold text-danger hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                >
                  Cancel Order
                </button>
              </div>

              {/* Linked Guest row */}
              <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-semibold">Guest/Customer:</span>
                {linkedCustomer ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-700 dark:text-stone-200">{linkedCustomer.name}</span>
                    <button
                      onClick={() => linkCustomerToOrder(null)}
                      className="text-stone-400 hover:text-danger font-bold text-sm"
                      title="Unlink Customer"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setCustomerName("");
                      setCustomerEmail("");
                      setCustomerPhone("");
                      setShowCustomerModal(true);
                    }}
                    className="text-primary dark:text-amber-500 font-bold hover:underline"
                  >
                    + Assign Guest
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentOrder.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-stone-400">
                    <span className="text-4xl mb-2">🛒</span>
                    <p className="text-sm font-semibold">Cart is currently empty.</p>
                    <p className="text-xs mt-1">Select products from the left to add them here.</p>
                  </div>
                ) : (
                  currentOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50"
                    >
                      <div className="flex-1 pr-2">
                        <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight">
                          {item.name}
                        </h5>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          ${item.unitPrice.toFixed(2)} / unit • Tax: {item.taxPercentage}%
                        </p>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2 bg-stone-200 dark:bg-stone-800 rounded-lg p-0.5">
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-stone-700 dark:text-stone-300 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(products.find(p => p.id === item.productId)!, 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                        >
                          +
                        </button>
                      </div>

                      {/* Price Display */}
                      <div className="w-16 text-right font-black text-xs text-stone-800 dark:text-white">
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Summary & Actions */}
              <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="font-bold text-stone-700 dark:text-stone-300">${currentOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Taxes</span>
                    <span className="font-bold text-stone-700 dark:text-stone-300">${currentOrder.tax.toFixed(2)}</span>
                  </div>
                  {currentOrder.discounts > 0 && (
                    <div className="flex justify-between text-danger font-medium">
                      <span>Discounts {currentOrder.appliedPromoName ? `(${currentOrder.appliedPromoName})` : ""}</span>
                      <span>-${currentOrder.discounts.toFixed(2)}</span>
                    </div>
                  )}
                  {currentOrder.appliedCouponCode && (
                    <div className="flex justify-between items-center text-success font-medium bg-green-500/10 px-2 py-0.5 rounded">
                      <span>Coupon: {currentOrder.appliedCouponCode}</span>
                      <button onClick={removeCoupon} className="text-stone-400 hover:text-stone-800">×</button>
                    </div>
                  )}
                  <div className="h-px bg-stone-200 dark:bg-stone-800 my-1"></div>
                  <div className="flex justify-between text-sm font-black">
                    <span className="text-stone-800 dark:text-stone-100">Order Total</span>
                    <span className="text-primary dark:text-amber-500">${currentOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Sub-action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setDiscountError("");
                      setDiscountSuccess("");
                      setShowDiscountModal(true);
                    }}
                    className="py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-stone-700 dark:text-stone-300"
                  >
                    🏷️ Coupon Code
                  </button>
                  <button
                    onClick={handleSendToKitchen}
                    disabled={currentOrder.items.length === 0}
                    className="py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-stone-700 dark:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🍳 Send to Kitchen
                  </button>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => {
                    if (currentOrder.items.length === 0) return;
                    // Preselect first enabled payment method
                    const firstPm = paymentMethods.find(p => p.isEnabled);
                    if (firstPm) setSelectedPaymentId(firstPm.id);
                    setShowCheckoutModal(true);
                  }}
                  disabled={currentOrder.items.length === 0}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-extrabold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💳 Process Payment & Complete
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 3: ORDERS LOG (3.6 VIEW SHIFT SALES LOG)
        ======================================================== */}
        {activeTab === "orders" && (
          <section className="flex-1 p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Current Shift Orders Log</h2>
              <p className="text-sm text-stone-500">Review, print receipts, or edit draft orders for the active session.</p>
            </div>

            {/* Mobile order search input */}
            <div className="lg:hidden">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders..."
                className="w-full px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-stone-900 dark:text-white"
              />
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Order Number</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Table / Mode</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-stone-400">
                          No orders match the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const table = tables.find(t => t.id === order.tableId);
                        const cust = customers.find(c => c.id === order.customerId);

                        return (
                          <tr key={order.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/20">
                            <td className="px-6 py-4 font-bold text-stone-800 dark:text-stone-200">
                              {order.orderNumber}
                            </td>
                            <td className="px-6 py-4 text-stone-500">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4">
                              {table ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider text-[10px]">
                                  {table.tableNumber}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                                  Takeaway
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-stone-600 dark:text-stone-300 font-medium">
                              {cust ? cust.name : <span className="italic text-stone-400">Walk-in</span>}
                            </td>
                            <td className="px-6 py-4 font-black text-stone-800 dark:text-white">
                              ${order.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === "paid"
                                  ? "bg-green-500/10 text-success"
                                  : order.status === "draft"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-red-500/10 text-danger"
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => setViewingOrderDetails(order)}
                                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg text-[11px] font-bold"
                              >
                                View Items
                              </button>
                              
                              {order.status === "draft" && (
                                <>
                                  <button
                                    onClick={() => {
                                      editDraftOrder(order.id);
                                      setActiveTab("order");
                                    }}
                                    className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg text-[11px] font-bold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Cancel draft order ${order.orderNumber}?`)) {
                                        cancelDraftOrder(order.id);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded-lg text-[11px] font-bold"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                              {order.status === "paid" && (
                                <button
                                  onClick={() => {
                                    setReceiptOrder(order);
                                    if (order.customerId) {
                                      const cust = customers.find(c => c.id === order.customerId);
                                      if (cust) setReceiptEmailInput(cust.email);
                                    }
                                    setShowReceiptModal(true);
                                  }}
                                  className="px-2.5 py-1 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-lg text-[11px] font-bold text-stone-600 dark:text-stone-300"
                                >
                                  Receipt
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 4: CUSTOMER DIRECTORY (3.8 GUEST DIRECTORY)
        ======================================================== */}
        {activeTab === "customer" && (
          <section className="flex-1 p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Guest & Customer Directory</h2>
                <p className="text-sm text-stone-500">Manage client directory profiles for email receipt delivery and booking logs.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setCustomerName("");
                  setCustomerEmail("");
                  setCustomerPhone("");
                  setShowCustomerModal(true);
                }}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                + Register New Customer
              </button>
            </div>

            {/* Mobile search bar */}
            <div className="lg:hidden">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm"
              />
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-stone-400">
                          No customer profiles found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/20">
                          <td className="px-6 py-4 font-bold text-stone-800 dark:text-stone-200">
                            {cust.name}
                          </td>
                          <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                            {cust.email || <span className="italic text-stone-400">Not provided</span>}
                          </td>
                          <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                            {cust.phone || <span className="italic text-stone-400">Not provided</span>}
                          </td>
                          <td className="px-6 py-4 text-stone-500">
                            2026-06-13
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {currentOrder && activeTab === "customer" && (
                              <button
                                onClick={() => {
                                  linkCustomerToOrder(cust.id);
                                  setActiveTab("order");
                                }}
                                className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-success rounded-lg font-bold"
                              >
                                Link to Cart
                              </button>
                            )}
                            <button
                              onClick={() => startEditCustomer(cust)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete profile for ${cust.name}?`)) {
                                  deleteCustomer(cust.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded-lg font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ========================================================
          MODALS & DIALOG POPUPS
      ======================================================== */}

      {/* 3.4 DISCOUNT / COUPON POPUP */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-800 dark:text-stone-100">Apply Promo Coupon Code</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            <form onSubmit={handleApplyCoupon} className="space-y-4 mt-4">
              {discountError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-danger text-xs font-semibold rounded-xl">
                  ⚠️ {discountError}
                </div>
              )}
              {discountSuccess && (
                <div className="p-2.5 bg-green-500/10 border border-green-500/30 text-success text-xs font-semibold rounded-xl">
                  ✅ {discountSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  placeholder="e.g. WELCOME10"
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary uppercase font-bold text-stone-950 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-md"
              >
                Validate Coupon
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400">
              <p className="font-bold mb-1 uppercase tracking-wider">Available Codes in DB:</p>
              <ul className="space-y-1">
                {coupons.filter(c => c.isActive).map(c => (
                  <li key={c.id} className="flex justify-between font-mono bg-stone-50 dark:bg-stone-950 p-1.5 rounded">
                    <span>{c.code}</span>
                    <span className="font-bold text-primary">{c.discountType === "percentage" ? `${c.discountValue}% Off` : `$${c.discountValue} Flat`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CREATE/EDIT MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-800 dark:text-stone-100">
                {editingCustomer ? "Edit Customer Record" : "Register Guest Customer"}
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-stone-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="sarah@terminator.com"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 555 1234"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md"
              >
                {editingCustomer ? "Save Customer" : "Register and Link"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3.5 CHECKOUT & PAYMENT MODAL */}
      {showCheckoutModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm">Cart Checkout Terminal</h3>
                <p className="text-[10px] text-stone-400">Processing order: {currentOrder.orderNumber}</p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            {/* Total Balance due */}
            <div className="my-4 p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl text-center space-y-1">
              <span className="text-stone-400 font-semibold block uppercase tracking-wider text-[10px]">Total Balance Due</span>
              <span className="text-2xl font-black text-primary dark:text-amber-500">${currentOrder.total.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block font-bold text-stone-500 uppercase tracking-wider text-[10px]">Select Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods
                  .filter((p) => p.isEnabled)
                  .map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaymentId(pm.id);
                        setUpiQrConfirmed(false);
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                        selectedPaymentId === pm.id
                          ? "border-primary bg-primary/10 text-primary dark:border-amber-500 dark:bg-amber-500/20 dark:text-amber-400"
                          : "border-stone-200 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800"
                      }`}
                    >
                      <span className="text-lg">
                        {pm.type === "cash" ? "💵" : pm.type === "card" ? "💳" : "📱"}
                      </span>
                      <span>{pm.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Payment Form Details */}
            {selectedPaymentId !== null && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 mt-6">
                {paymentMethods.find(p => p.id === selectedPaymentId)?.type === "cash" && (
                  <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl animate-fade-in">
                    <div>
                      <label className="block font-bold text-stone-500 mb-1">Received Cash Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={currentOrder.total}
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder={`Min: $${currentOrder.total.toFixed(2)}`}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-black text-sm"
                        required
                      />
                    </div>

                    {/* Change calculator display */}
                    {parseFloat(cashReceived) >= currentOrder.total && (
                      <div className="flex justify-between items-center bg-green-500/15 text-success p-2.5 rounded-xl font-bold">
                        <span>Change due back:</span>
                        <span>
                          ${(parseFloat(cashReceived) - currentOrder.total).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Cash quick selection helpers */}
                    <div className="flex gap-1.5 flex-wrap">
                      {[currentOrder.total, 5, 10, 20, 50, 100]
                        .filter(v => v >= currentOrder.total)
                        .map((val, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashReceived(val.toFixed(2))}
                            className="px-2.5 py-1 bg-white hover:bg-stone-200 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono"
                          >
                            {val === currentOrder.total ? "Exact" : `$${val}`}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {paymentMethods.find(p => p.id === selectedPaymentId)?.type === "card" && (
                  <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl animate-fade-in">
                    <div>
                      <label className="block font-bold text-stone-500 mb-1">Transaction/Reference Code</label>
                      <input
                        type="text"
                        value={cardReference}
                        onChange={(e) => setCardReference(e.target.value)}
                        placeholder="e.g. Auth Code, last 4 digits"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentMethods.find(p => p.id === selectedPaymentId)?.type === "upi" && (
                  <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-center animate-fade-in">
                    <p className="font-bold text-stone-600 dark:text-stone-300 mb-2">Scan QR Code on Guest Phone</p>
                    
                    {/* Simulated QR Code SVG representation */}
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-stone-200">
                      <svg width="128" height="128" viewBox="0 0 128 128" className="text-black">
                        {/* outer boundaries */}
                        <path d="M0 0h40v8H8v32H0V0zm88 0h40v40h-8V8H88V0zM0 88h8v32h32v8H0V88zm120 0h8v40H88v-8h32V88z" fill="currentColor" />
                        {/* squares */}
                        <path d="M12 12h16v16H12zm0 88h16v16H12zm88-88h16v16h-16z" fill="currentColor" />
                        {/* mini squares */}
                        <path d="M16 16h8v8h-8zm0 88h8v8h-8zm88-88h8v8h-8z" fill="none" stroke="white" strokeWidth="2" />
                        {/* randomized QR bits representation */}
                        <path d="M40 20h8v8h-8zm16 8h8v8h-8zm0-16h8v8h-8zm24 24h8v8h-8zm-8 16h8v8h-8zm-16 8h8v8h-8zm32 8h8v8h-8zm16 16h8v8h-8zm-24 8h8v8h-8zm-8-24h8v8h-8zm-8 8h8v8h-8z" fill="currentColor" />
                        {/* Center Cafe logo indicator */}
                        <rect x="52" y="52" width="24" height="24" rx="4" fill="white" />
                        <text x="64" y="68" fontSize="12" fontWeight="black" textAnchor="middle" fill="#854d0e">☕</text>
                      </svg>
                    </div>

                    <div className="mt-2 text-stone-500">
                      <p className="font-bold text-stone-700 dark:text-stone-300">
                        UPI: {paymentMethods.find(p => p.id === selectedPaymentId)?.upiId || "cafe@ybl"}
                      </p>
                      <p className="text-[10px] italic">Amount: ${currentOrder.total.toFixed(2)}</p>
                    </div>

                    {!upiQrConfirmed ? (
                      <button
                        type="button"
                        onClick={() => setUpiQrConfirmed(true)}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl mt-3"
                      >
                        Confirm Payment Received
                      </button>
                    ) : (
                      <div className="p-2.5 bg-green-500/10 text-success border border-green-500/30 rounded-xl font-bold flex items-center justify-center gap-1.5 mt-3">
                        <span>✓ Payment Confirmed</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Submit action button */}
                <button
                  type="submit"
                  disabled={
                    paymentMethods.find(p => p.id === selectedPaymentId)?.type === "upi" && !upiQrConfirmed
                  }
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-extrabold rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Payment Receipt & Clear Cart
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3.5 RECEIPT PRINTING & EMAIL MODAL */}
      {showReceiptModal && receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm">Receipt Generated</h3>
              <button onClick={() => { setShowReceiptModal(false); setReceiptOrder(null); }} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            {/* Receipt Preview Container (Printed receipt styling) */}
            <div className="my-4 p-4 rounded-xl receipt-paper max-h-96 overflow-y-auto text-[10px] font-mono leading-tight border border-stone-200">
              <div className="text-center space-y-1 mb-4">
                <h4 className="font-black text-xs uppercase">Odoo Cafe POS</h4>
                <p>Ground Floor, Main Block</p>
                <p>Phone: +1 555 CAFE</p>
                <p className="text-[8px] text-stone-400">--- TAX INVOICE ---</p>
              </div>

              <div className="space-y-1 mb-3 text-[9px] border-b border-dashed border-stone-300 pb-2">
                <p><span className="font-bold">Order:</span> {receiptOrder.orderNumber}</p>
                <p><span className="font-bold">Date:</span> {new Date(receiptOrder.createdAt).toLocaleString()}</p>
                <p>
                  <span className="font-bold">Cashier:</span>{" "}
                  {currentUser.name}
                </p>
                <p>
                  <span className="font-bold">Guest:</span>{" "}
                  {receiptOrder.customerId ? customers.find(c => c.id === receiptOrder.customerId)?.name : "Walk-in"}
                </p>
                <p>
                  <span className="font-bold">Table:</span>{" "}
                  {receiptOrder.tableId ? tables.find(t => t.id === receiptOrder.tableId)?.tableNumber : "Takeaway"}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-b border-dashed border-stone-300 pb-2 mb-3">
                <div className="grid grid-cols-12 font-bold text-[9px]">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Price</span>
                </div>
                {receiptOrder.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 text-[9px]">
                    <span className="col-span-6 truncate">{item.name}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-4 text-right">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="space-y-1 text-right text-[9px]">
                <p>Subtotal: ${receiptOrder.subtotal.toFixed(2)}</p>
                <p>Taxes (incl.): ${receiptOrder.tax.toFixed(2)}</p>
                {receiptOrder.discounts > 0 && <p className="text-stone-500">Discounts: -${receiptOrder.discounts.toFixed(2)}</p>}
                <p className="font-black text-xs pt-1 border-t border-dashed border-stone-300">TOTAL: ${receiptOrder.total.toFixed(2)}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-dashed border-stone-300 text-center text-[8px] text-stone-500">
                <p>Payment Mode: {paymentMethods.find(p => p.id === receiptOrder.paymentMethodId)?.name || "Cash"}</p>
                <p>{receiptOrder.paymentReference}</p>
                <p className="mt-2 font-bold">THANK YOU FOR YOUR VISIT!</p>
              </div>
            </div>

            {/* Print and Email Actions */}
            <div className="space-y-3 mt-4 text-xs">
              <button
                onClick={() => {
                  alert("Executing Print Spooler Connection...\nReceipt printed successfully!");
                }}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                🖨️ Print Thermal Receipt
              </button>

              <form onSubmit={handleEmailReceipt} className="space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
                <label className="block font-bold text-stone-500">Email Receipt to Customer</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={receiptEmailInput}
                    onChange={(e) => setReceiptEmailInput(e.target.value)}
                    placeholder="guest@email.com"
                    className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
                  >
                    Send
                  </button>
                </div>
                {emailSentStatus && (
                  <p className="text-[10px] text-success font-semibold">Queueing message...</p>
                )}
              </form>

              <button
                onClick={() => { setShowReceiptModal(false); setReceiptOrder(null); }}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-center block"
              >
                Close & Start Next Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ORDER ITEMS MODAL (From Order history view) */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
              <div>
                <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm">Order Details Summary</h3>
                <p className="text-[10px] text-stone-400">{viewingOrderDetails.orderNumber} • Status: {viewingOrderDetails.status.toUpperCase()}</p>
              </div>
              <button onClick={() => setViewingOrderDetails(null)} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            <div className="space-y-4">
              {/* Items Table */}
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
                <h4 className="font-bold text-[10px] uppercase text-stone-400 mb-2">Cart Lines</h4>
                <div className="space-y-2">
                  {viewingOrderDetails.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-xs">
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-stone-800 dark:text-stone-200">{it.name}</p>
                        <p className="text-[10px] text-stone-400">${it.unitPrice.toFixed(2)} x {it.quantity}</p>
                      </div>
                      <span className="font-mono text-stone-700 dark:text-stone-300">${it.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 px-2">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span>${viewingOrderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Taxes</span>
                  <span>${viewingOrderDetails.tax.toFixed(2)}</span>
                </div>
                {viewingOrderDetails.discounts > 0 && (
                  <div className="flex justify-between text-danger font-medium">
                    <span>Discounts</span>
                    <span>-${viewingOrderDetails.discounts.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px bg-stone-200 dark:bg-stone-800 my-1"></div>
                <div className="flex justify-between text-sm font-black">
                  <span>Order Total</span>
                  <span className="text-primary dark:text-amber-500">${viewingOrderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setViewingOrderDetails(null)}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-center"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

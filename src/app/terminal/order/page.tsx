"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Product, Order, Customer } from "@/app/context/AppContext";
import { UpiQr } from "@/components/shared/upi-qr";
import { downloadReceiptPDF } from "@/lib/receipt-pdf";

function OrderCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser,
    products,
    categories,
    customers,
    tables,
    paymentMethods,
    currentOrder,
    cancelDraftOrder,
    linkCustomerToOrder,
    addToCart,
    updateCartQty,
    applyManualCoupon,
    removeCoupon,
    sendOrderToKitchen,
    processOrderPayment,
    createCustomer,
    sendEmailReceipt
  } = useApp();

  // Search query sync from layout header
  const productSearch = searchParams.get("search") || "";
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Modals inside checkout screen
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [cardReference, setCardReference] = useState("");

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptEmailInput, setReceiptEmailInput] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);

  // Cashier quick customer assignment modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [modalMode, setModalMode] = useState<"select" | "register">("select");
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [custNameErr, setCustNameErr]   = useState("");
  const [custEmailErr, setCustEmailErr] = useState("");
  const [custPhoneErr, setCustPhoneErr] = useState("");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;

  // Pre-select first category by default if any
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null && !searchParams.get("category")) {
      // Default to null (All Items)
    }
  }, [categories, selectedCategoryId, searchParams]);

  if (!currentOrder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-100 dark:bg-stone-950 text-center space-y-4">
        <span className="text-5xl">🛍️</span>
        <p className="text-lg font-bold text-stone-700 dark:text-stone-300">No active POS order checkout is open.</p>
        <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
          Please assign a table from the Floor Plan or start a counter quick takeaway order.
        </p>
        <button
          onClick={() => router.push("/terminal/tables")}
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-colors"
        >
          Go to Floor Selector
        </button>
      </div>
    );
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
    return p.isActive && matchesSearch && matchesCategory;
  });

  // Find linked customer details
  const linkedCustomer = currentOrder.customerId
    ? customers.find((c) => c.id === currentOrder.customerId)
    : null;

  // Send to kitchen action handler
  const handleSendToKitchen = () => {
    if (currentOrder.items.length === 0) return;
    sendOrderToKitchen();
    alert(`Order ${currentOrder.orderNumber} sent to kitchen display!`);
  };

  // Checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId) return;

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

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Field-level validation
    const nErr = !customerName.trim() ? "Name is required." : "";
    const eErr = customerEmail.trim() && !EMAIL_RE.test(customerEmail.trim())
      ? "Enter a valid email address." : "";
    const pErr = customerPhone.trim() && !PHONE_RE.test(customerPhone.trim())
      ? "Enter a valid phone number (e.g. +1 555-0199)." : "";

    setCustNameErr(nErr);
    setCustEmailErr(eErr);
    setCustPhoneErr(pErr);
    if (nErr || eErr || pErr) return;

    setCustomerSaving(true);
    setCustomerError("");

    try {
      const newCust = await createCustomer({
        name: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim(),
      });

      if (newCust) {
        linkCustomerToOrder(newCust.id);
        setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
        setCustNameErr(""); setCustEmailErr(""); setCustPhoneErr("");
        setCustomerError("");
        setShowCustomerModal(false);
      }
    } catch (err: any) {
      setCustomerError(err?.message ?? "Failed to save guest. Please try again.");
    } finally {
      setCustomerSaving(false);
    }
  };

  const handleEmailReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptEmailInput || !receiptOrder) return;
    setEmailSentStatus(true);
    try {
      const res = await sendEmailReceipt(receiptOrder.id, receiptEmailInput);
      if (res?.previewUrl) {
        alert(`Receipt generated (Ethereal test mode)!\nPreview URL: ${res.previewUrl}`);
      } else if (res?.status === 'logged') {
        alert("Offline Mode: Email receipt simulation logged to the server terminal!");
      } else {
        alert(`Receipt email successfully sent to ${receiptEmailInput}!`);
      }
    } catch (err) {
      alert("Failed to send receipt email. Please verify settings.");
    } finally {
      setEmailSentStatus(false);
    }
  };

  return (
    <section className="flex-1 flex flex-col md:flex-row overflow-hidden animate-fade-in relative">
      
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
        <div className="p-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-16">
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
                    <h4 className="font-extrabold text-stone-850 dark:text-stone-200 group-hover:text-primary dark:group-hover:text-amber-500 transition-colors text-sm">
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
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-550 dark:bg-stone-900">
          <div>
            <h3 className="font-black text-stone-800 dark:text-stone-100 text-sm">Active Cart</h3>
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
                setCustomerName("");
                setCustomerEmail("");
                setCustomerPhone("");
                setSelectedCustomerId("");
                setModalMode(customers.length > 0 ? "select" : "register");
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
                <div className="flex items-center gap-2 bg-stone-200 dark:bg-stone-850 rounded-lg p-0.5">
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
                <div className="w-16 text-right font-black text-xs text-stone-850 dark:text-white">
                  ${(item.total ?? item.unitPrice * item.quantity).toFixed(2)}
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
              disabled={currentOrder.items.length === 0}
              className="py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-stone-700 dark:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🏷️ Coupon Code
            </button>
            <button
              onClick={handleSendToKitchen}
              disabled={currentOrder.items.length === 0 || (!!currentOrder.tableId && !linkedCustomer)}
              className="py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-stone-700 dark:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🍳 Send to Kitchen
            </button>
          </div>

          {/* Hint shown when table order has items but no guest yet */}
          {!!currentOrder.tableId && currentOrder.items.length > 0 && !linkedCustomer && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold text-center">
              ⚠️ Assign a guest above to enable kitchen &amp; payment
            </p>
          )}

          {/* Checkout Button */}
          <button
            onClick={() => {
              if (currentOrder.items.length === 0 || (currentOrder.tableId && !linkedCustomer)) return;
              const firstPm = paymentMethods.find(p => p.isEnabled);
              if (firstPm) setSelectedPaymentId(firstPm.id);
              setShowCheckoutModal(true);
            }}
            disabled={currentOrder.items.length === 0 || (!!currentOrder.tableId && !linkedCustomer)}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-extrabold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💳 Process Payment & Complete
          </button>
        </div>
      </div>

      {/* ========================================================
          MODAL CONTEXT OVERLAYS
      ======================================================== */}

      {/* Modal 1: Discount Coupon Application */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-150 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-800 dark:text-stone-100">Apply Coupon Promo</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>
            
            <form onSubmit={handleApplyCoupon} className="space-y-4 mt-4">
              <div>
                <label className="block text-stone-400 font-bold mb-1">Enter Code</label>
                <input
                  type="text"
                  required
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  placeholder="e.g. WELCOME10"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none uppercase font-bold text-stone-900 dark:text-white"
                />
              </div>

              {discountError && <p className="text-xs font-semibold text-danger">{discountError}</p>}
              {discountSuccess && <p className="text-xs font-semibold text-success">{discountSuccess}</p>}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold"
                >
                  Validate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Cashier Guest Registration / Select */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-150 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-800 dark:text-stone-100">
                {modalMode === "select" ? "Assign Existing Guest" : "Register Guest Customer"}
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-stone-400 hover:text-stone-850 dark:hover:text-stone-100 text-lg">×</button>
            </div>

            {/* Mode selection buttons */}
            {customers.length > 0 && (
              <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModalMode("select")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    modalMode === "select"
                      ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 shadow-sm"
                      : "text-stone-500"
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("register")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    modalMode === "register"
                      ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 shadow-sm"
                      : "text-stone-500"
                  }`}
                >
                  Create New
                </button>
              </div>
            )}

            {modalMode === "select" ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-500 mb-1.5">Select Customer Profile</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-bold"
                  >
                    <option value="">-- Choose Existing Guest --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""} {c.email ? `(${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-805 text-stone-500 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCustomerId) {
                        linkCustomerToOrder(selectedCustomerId);
                        setShowCustomerModal(false);
                      } else {
                        alert("Please select a customer first.");
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-bold shadow hover:bg-primary-hover transition-colors animate-pulse-light"
                  >
                    Link Guest Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-500 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setCustNameErr(""); }}
                    placeholder="e.g. Sarah Connor"
                    disabled={customerSaving}
                    className={`w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white ${custNameErr ? "border-red-400 focus:ring-red-400" : "border-stone-200 dark:border-stone-800"}`}
                  />
                  {custNameErr && <p className="text-red-500 text-[11px] mt-0.5">{custNameErr}</p>}
                </div>
                <div>
                  <label className="block font-bold text-stone-500 mb-1">
                    Email Address <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); setCustEmailErr(""); }}
                    placeholder="sarah@terminator.com"
                    disabled={customerSaving}
                    className={`w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white ${custEmailErr ? "border-red-400 focus:ring-red-400" : "border-stone-200 dark:border-stone-800"}`}
                  />
                  {custEmailErr && <p className="text-red-500 text-[11px] mt-0.5">{custEmailErr}</p>}
                </div>
                <div>
                  <label className="block font-bold text-stone-500 mb-1">
                    Phone Number <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => { setCustomerPhone(e.target.value); setCustPhoneErr(""); }}
                    placeholder="+1 555-0199"
                    disabled={customerSaving}
                    className={`w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white ${custPhoneErr ? "border-red-400 focus:ring-red-400" : "border-stone-200 dark:border-stone-800"}`}
                  />
                  {custPhoneErr && <p className="text-red-500 text-[11px] mt-0.5">{custPhoneErr}</p>}
                </div>

                {customerError && (
                  <p className="text-xs font-semibold text-red-500">{customerError}</p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowCustomerModal(false); setCustomerError(""); setCustNameErr(""); setCustEmailErr(""); setCustPhoneErr(""); }}
                    disabled={customerSaving}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-805 text-stone-500 rounded-xl font-bold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={customerSaving || !customerName.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-bold shadow hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {customerSaving ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Saving...
                      </>
                    ) : "Link Guest Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Checkout Payment Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-150 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-850 dark:text-stone-100">Process Checkout Invoice</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 mt-4">
              <div className="flex justify-between bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-100 dark:border-stone-850">
                <span className="font-bold text-stone-500">Amount Due:</span>
                <span className="font-black text-xl text-primary dark:text-amber-500">${currentOrder.total.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-stone-550 dark:text-stone-400 font-bold mb-1.5">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.filter(p => p.isEnabled).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedPaymentId(pm.id)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selectedPaymentId === pm.id
                          ? "bg-primary border-primary text-white shadow"
                          : "bg-stone-50 border-stone-200 text-stone-600 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300 hover:bg-stone-100"
                      }`}
                    >
                      <span className="text-xl">
                        {pm.type === "cash" ? "💵" : pm.type === "card" ? "💳" : "📱"}
                      </span>
                      {pm.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash payment specific details */}
              {selectedPaymentId === 1 && (
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Cash Tendered ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="e.g. 50.00"
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white font-mono"
                  />
                  {parseFloat(cashReceived) >= currentOrder.total && (
                    <div className="mt-2 text-xs font-bold text-success">
                      Change Back: ${(parseFloat(cashReceived) - currentOrder.total).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* Card payment specific details */}
              {selectedPaymentId === 2 && (
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Transaction reference ID</label>
                  <input
                    type="text"
                    required
                    value={cardReference}
                    onChange={(e) => setCardReference(e.target.value)}
                    placeholder="Auth code or transaction receipt #"
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white font-mono"
                  />
                </div>
              )}

              {/* UPI/QR specific details */}
              {selectedPaymentId === 3 && (() => {
                const upiMethod = paymentMethods.find(p => p.id === 3);
                return (
                  <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                    <UpiQr
                      upiId={upiMethod?.upiId ?? ""}
                      merchantName="Odoo Cafe"
                      amount={currentOrder.total}
                      orderId={currentOrder.orderNumber}
                    />
                  </div>
                );
              })()}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold shadow hover:bg-primary-hover transition-colors"
                >
                  Verify & Settle Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Checkout Printing Receipt Modal */}
      {showReceiptModal && receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-150 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-850 dark:text-stone-100">Order Receipt Printout</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            {/* Receipt Preview box */}
            <div className="my-4 p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-2xl font-mono text-[10px] space-y-3 leading-tight select-all">
              <div className="text-center">
                <h4 className="font-black text-sm uppercase">Odoo Cafe</h4>
                <p>Ground Floor Zone, POS shift</p>
                <p>{new Date(receiptOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="h-px border-t border-dashed border-stone-300 dark:border-stone-700"></div>
              <div>
                <p>Order Number: {receiptOrder.orderNumber}</p>
                <p>Table: {receiptOrder.tableId ? tables.find(t=>t.id===receiptOrder.tableId)?.tableNumber : "Takeaway"}</p>
              </div>
              <div className="h-px border-t border-dashed border-stone-300 dark:border-stone-700"></div>
              <div className="space-y-1">
                {receiptOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} (x{it.quantity})</span>
                    <span>${it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="h-px border-t border-dashed border-stone-300 dark:border-stone-700"></div>
              <div className="space-y-0.5 text-right font-bold">
                <p>Subtotal: ${receiptOrder.subtotal.toFixed(2)}</p>
                <p>Taxes: ${receiptOrder.tax.toFixed(2)}</p>
                {receiptOrder.discounts > 0 && <p className="text-danger">Discounts: -${receiptOrder.discounts.toFixed(2)}</p>}
                <p className="text-sm font-black">Total Paid: ${receiptOrder.total.toFixed(2)}</p>
              </div>
              <div className="h-px border-t border-dashed border-stone-300 dark:border-stone-700"></div>
              <div className="text-[9px] text-stone-400 text-center uppercase tracking-wider">
                Thank you for your visit!
              </div>
            </div>

            {/* Email send block */}
            <form onSubmit={handleEmailReceipt} className="space-y-3 pt-2.5 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Send Digital Receipt Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={receiptEmailInput}
                  onChange={(e) => setReceiptEmailInput(e.target.value)}
                  placeholder="e.g. guest@gmail.com"
                  className="flex-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-mono text-stone-800 dark:text-stone-200"
                />
                <button
                  type="submit"
                  disabled={emailSentStatus}
                  className="px-3 py-2 bg-primary text-white font-bold rounded-xl shadow disabled:opacity-50 hover:bg-primary-hover transition-colors"
                >
                  {emailSentStatus ? "Sending..." : "Send"}
                </button>
              </div>
            </form>

            <div className="flex gap-2 justify-end pt-4 border-t border-stone-100 dark:border-stone-800 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (!receiptOrder) return;
                  downloadReceiptPDF({
                    orderNumber: receiptOrder.orderNumber,
                    createdAt: receiptOrder.createdAt,
                    cashierName: currentUser?.name ?? "Cashier",
                    guestName: receiptOrder.customerId
                      ? (customers.find(c => c.id === receiptOrder.customerId)?.name ?? "Guest")
                      : "Walk-in",
                    tableNumber: receiptOrder.tableId
                      ? (tables.find(t => t.id === receiptOrder.tableId)?.tableNumber ?? "—")
                      : "Takeaway",
                    items: receiptOrder.items.map(it => ({ name: it.name, quantity: it.quantity, total: it.total })),
                    subtotal: receiptOrder.subtotal,
                    tax: receiptOrder.tax,
                    discounts: receiptOrder.discounts,
                    total: receiptOrder.total,
                    paymentMethod: paymentMethods.find(p => p.id === receiptOrder.paymentMethodId)?.name ?? "Cash",
                    paymentReference: receiptOrder.paymentReference ?? undefined,
                  });
                }}
                className="px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold flex items-center gap-1 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                🖨️ Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold shadow hover:bg-primary-hover transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

export default function OrderCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-100 dark:bg-stone-955 text-center space-y-4">
        <span className="text-xl text-stone-550 dark:text-stone-400">Loading Order Checkout...</span>
      </div>
    }>
      <OrderCheckoutContent />
    </Suspense>
  );
}

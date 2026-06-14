"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Product, Order, Customer } from "@/app/context/AppContext";
import { UpiQr } from "@/components/shared/upi-qr";
import { downloadReceiptPDF } from "@/lib/receipt-pdf";
import { DialogModal } from "@/components/ui/dialog-modal";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart, LayoutGrid, Minus, Plus, X, Tag, ChefHat,
  CreditCard, Banknote, Smartphone, UserPlus, UserCheck,
  Receipt, Send, Printer, TriangleAlert, CheckCircle2,
  Check, Users, Scissors
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Inner content (needs Suspense for useSearchParams) ──────────────────────

function OrderCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError, info, warning } = useToast();
  const {
    currentUser, products, categories, customers, tables,
    paymentMethods, currentOrder, cancelDraftOrder,
    linkCustomerToOrder, addToCart, updateCartQty,
    applyManualCoupon, removeCoupon, sendOrderToKitchen,
    processOrderPayment, createCustomer, sendEmailReceipt,
  } = useApp();

  const productSearch = searchParams.get("search") || "";
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // ── Modal states ──────────────────────────────────────────────────────────
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [cardReference, setCardReference] = useState("");

  // ── Split Billing States ──────────────────────────────────────────────────
  const [splitMode, setSplitMode] = useState<"full" | "equal" | "item" | "custom">("full");
  const [splitGuests, setSplitGuests] = useState<number>(2);
  const [activeEqualGuestIndex, setActiveEqualGuestIndex] = useState<number>(1);
  const [equalPaidList, setEqualPaidList] = useState<Array<{
    guestIndex: number;
    methodId: number;
    methodName: string;
    amount: number;
    reference: string;
  }>>([]);

  const [itemSelectedIds, setItemSelectedIds] = useState<string[]>([]); // list of expandedItem.id
  const [itemPaidList, setItemPaidList] = useState<Array<{
    guestName: string;
    itemIds: string[];
    itemNames: string[];
    methodId: number;
    methodName: string;
    amount: number;
  }>>([]);

  const [customPaidList, setCustomPaidList] = useState<Array<{
    paymentIndex: number;
    methodId: number;
    methodName: string;
    amount: number;
    reference: string;
  }>>([]);
  const [customAmountInput, setCustomAmountInput] = useState("");

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptEmailInput, setReceiptEmailInput] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [modalMode, setModalMode] = useState<"select" | "register">("select");
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [custNameErr, setCustNameErr] = useState("");
  const [custEmailErr, setCustEmailErr] = useState("");
  const [custPhoneErr, setCustPhoneErr] = useState("");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!currentOrder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-5">
        <div className="w-20 h-20 rounded-3xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <ShoppingCart className="size-9 text-stone-400" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-stone-700 dark:text-stone-300">No active order</p>
          <p className="text-sm text-stone-400 mt-1 max-w-xs leading-relaxed">
            Select a table from the Floor Plan or start a counter takeaway order.
          </p>
        </div>
        <button
          onClick={() => router.push("/terminal/tables")}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-all active:scale-95"
        >
          <LayoutGrid className="size-4" />
          Go to Floor Plan
        </button>
      </div>
    );
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
    return p.isActive && matchesSearch && matchesCategory;
  });

  const linkedCustomer = currentOrder.customerId
    ? customers.find((c) => c.id === currentOrder.customerId)
    : null;

  // Expand cart items so that quantity > 1 items are listed individually
  const expandedItems = React.useMemo(() => {
    if (!currentOrder) return [];
    const list: Array<{
      id: string;
      productId: string;
      name: string;
      unitPrice: number;
      taxPercentage: number;
      itemTotal: number;
    }> = [];
    currentOrder.items.forEach((item) => {
      const singleUnitTotal = item.total / item.quantity;
      for (let i = 0; i < item.quantity; i++) {
        list.push({
          id: `${item.id}-${i}`,
          productId: item.productId,
          name: item.name,
          unitPrice: item.unitPrice,
          taxPercentage: item.taxPercentage,
          itemTotal: singleUnitTotal,
        });
      }
    });
    return list;
  }, [currentOrder?.items]);

  const activePaymentAmount = React.useMemo(() => {
    if (!currentOrder) return 0;
    if (splitMode === "full") {
      return currentOrder.total;
    } else if (splitMode === "equal") {
      return currentOrder.total / splitGuests;
    } else if (splitMode === "item") {
      const selectedExpandedItems = expandedItems.filter(item => itemSelectedIds.includes(item.id));
      const selectedSubtotal = selectedExpandedItems.reduce((sum, item) => sum + item.unitPrice, 0);
      const proportionalRatio = currentOrder.subtotal > 0 ? (selectedSubtotal / currentOrder.subtotal) : 0;
      return proportionalRatio * currentOrder.total;
    } else if (splitMode === "custom") {
      return parseFloat(customAmountInput) || 0;
    }
    return 0;
  }, [splitMode, currentOrder, splitGuests, expandedItems, itemSelectedIds, customAmountInput]);

  const toggleItemSelection = (id: string) => {
    if (itemSelectedIds.includes(id)) {
      setItemSelectedIds(itemSelectedIds.filter(x => x !== id));
    } else {
      setItemSelectedIds([...itemSelectedIds, id]);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openCheckout = () => {
    if (currentOrder.items.length === 0 || needsGuest) return;
    const firstPm = paymentMethods.find((p) => p.isEnabled);
    if (firstPm) setSelectedPaymentId(firstPm.id);

    setSplitMode("full");
    setSplitGuests(2);
    setActiveEqualGuestIndex(1);
    setEqualPaidList([]);
    setItemSelectedIds([]);
    setItemPaidList([]);
    setCustomPaidList([]);
    setCustomAmountInput(currentOrder.total.toFixed(2));
    setCashReceived("");
    setCardReference("");

    setShowCheckoutModal(true);
  };

  const handleSendToKitchen = () => {
    if (currentOrder.items.length === 0) return;
    sendOrderToKitchen();
    success("Sent to Kitchen", `Order ${currentOrder.orderNumber} is now on the kitchen display.`);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId) return;
    const pm = paymentMethods.find((p) => p.id === selectedPaymentId);
    if (!pm) return;

    let refStr = "";
    if (pm.type === "cash") {
      const rec = parseFloat(cashReceived);
      if (isNaN(rec) || rec < currentOrder.total) {
        warning("Insufficient Cash", `Minimum cash required: ₹${currentOrder.total.toFixed(2)}`);
        return;
      }
      refStr = `Received: ₹${rec.toFixed(2)}, Change: ₹${(rec - currentOrder.total).toFixed(2)}`;
    } else if (pm.type === "card") {
      if (!cardReference) { warning("Reference Required", "Please enter the card transaction reference code."); return; }
      refStr = `Ref: ${cardReference}`;
    } else if (pm.type === "upi") {
      refStr = `UPI QR Confirmed (${pm.upiId})`;
    }

    const completedOrder: Order = { ...currentOrder, status: "paid", paymentMethodId: selectedPaymentId, paymentReference: refStr };
    processOrderPayment(selectedPaymentId, refStr);
    setShowCheckoutModal(false);
    setReceiptOrder(completedOrder);
    if (completedOrder.customerId) {
      const cust = customers.find((c) => c.id === completedOrder.customerId);
      if (cust) setReceiptEmailInput(cust.email);
    }
    setShowReceiptModal(true);
    setCashReceived(""); setCardReference(""); setSelectedPaymentId(null);
  };

  const handleEqualSplitGuestPayment = (guestIndex: number) => {
    if (!selectedPaymentId) return;
    const pm = paymentMethods.find((p) => p.id === selectedPaymentId);
    if (!pm) return;

    const shareAmount = currentOrder.total / splitGuests;
    let refStr = "";

    if (pm.type === "cash") {
      const rec = parseFloat(cashReceived);
      if (isNaN(rec) || rec < shareAmount) {
        warning("Insufficient Cash", `Minimum cash required for Guest ${guestIndex}: ₹${shareAmount.toFixed(2)}`);
        return;
      }
      refStr = `Received: ₹${rec.toFixed(2)}, Change: ₹${(rec - shareAmount).toFixed(2)}`;
    } else if (pm.type === "card") {
      if (!cardReference) { warning("Reference Required", "Please enter the transaction reference."); return; }
      refStr = `Ref: ${cardReference}`;
    } else if (pm.type === "upi") {
      refStr = `UPI Confirmed (${pm.upiId})`;
    }

    const newPayment = {
      guestIndex,
      methodId: selectedPaymentId,
      methodName: pm.name,
      amount: shareAmount,
      reference: refStr
    };

    const updatedPaidList = [...equalPaidList, newPayment];
    setEqualPaidList(updatedPaidList);
    setCashReceived("");
    setCardReference("");

    if (guestIndex < splitGuests) {
      setActiveEqualGuestIndex(guestIndex + 1);
    } else {
      const serializedRef = `Split Equally (${splitGuests} Guests): ` + updatedPaidList.map(
        p => `Guest ${p.guestIndex} (${p.methodName} - ₹${p.amount.toFixed(2)}${p.reference ? `, ${p.reference}` : ""})`
      ).join(" | ");

      const completedOrder: Order = {
        ...currentOrder,
        status: "paid",
        paymentMethodId: selectedPaymentId,
        paymentReference: serializedRef
      };

      processOrderPayment(selectedPaymentId, serializedRef);
      setShowCheckoutModal(false);
      setReceiptOrder(completedOrder);
      if (completedOrder.customerId) {
        const cust = customers.find((c) => c.id === completedOrder.customerId);
        if (cust) setReceiptEmailInput(cust.email);
      }
      setShowReceiptModal(true);
    }
  };

  const handleItemSplitGuestPayment = (selectedTotal: number, itemNames: string[]) => {
    if (!selectedPaymentId) return;
    const pm = paymentMethods.find((p) => p.id === selectedPaymentId);
    if (!pm) return;

    let refStr = "";
    if (pm.type === "cash") {
      const rec = parseFloat(cashReceived);
      if (isNaN(rec) || rec < selectedTotal) {
        warning("Insufficient Cash", `Minimum cash required: ₹${selectedTotal.toFixed(2)}`);
        return;
      }
      refStr = `Received: ₹${rec.toFixed(2)}, Change: ₹${(rec - selectedTotal).toFixed(2)}`;
    } else if (pm.type === "card") {
      if (!cardReference) { warning("Reference Required", "Please enter the transaction reference."); return; }
      refStr = `Ref: ${cardReference}`;
    } else if (pm.type === "upi") {
      refStr = `UPI Confirmed (${pm.upiId})`;
    }

    const currentGuestNumber = itemPaidList.length + 1;
    const newSegment = {
      guestName: `Guest ${currentGuestNumber}`,
      itemIds: [...itemSelectedIds],
      itemNames,
      methodId: selectedPaymentId,
      methodName: pm.name,
      amount: selectedTotal
    };

    const updatedPaidList = [...itemPaidList, newSegment];
    setItemPaidList(updatedPaidList);
    setItemSelectedIds([]);
    setCashReceived("");
    setCardReference("");

    const totalItemCount = currentOrder.items.reduce((s, i) => s + i.quantity, 0);
    const settledItemCount = updatedPaidList.reduce((s, p) => s + p.itemIds.length, 0);

    if (settledItemCount >= totalItemCount) {
      const serializedRef = `Split by Item: ` + updatedPaidList.map(
        p => `${p.guestName} (${p.itemNames.join(", ")} - ${p.methodName} - ₹${p.amount.toFixed(2)})`
      ).join(" | ");

      const completedOrder: Order = {
        ...currentOrder,
        status: "paid",
        paymentMethodId: selectedPaymentId,
        paymentReference: serializedRef
      };

      processOrderPayment(selectedPaymentId, serializedRef);
      setShowCheckoutModal(false);
      setReceiptOrder(completedOrder);
      if (completedOrder.customerId) {
        const cust = customers.find((c) => c.id === completedOrder.customerId);
        if (cust) setReceiptEmailInput(cust.email);
      }
      setShowReceiptModal(true);
    }
  };

  const handleCustomSplitPayment = (amount: number, remainingTotal: number) => {
    if (!selectedPaymentId) return;
    const pm = paymentMethods.find((p) => p.id === selectedPaymentId);
    if (!pm) return;

    if (isNaN(amount) || amount <= 0 || amount > remainingTotal) {
      warning("Invalid Amount", `Please enter a valid amount between ₹0.01 and ₹${remainingTotal.toFixed(2)}`);
      return;
    }

    let refStr = "";
    if (pm.type === "cash") {
      const rec = parseFloat(cashReceived);
      if (isNaN(rec) || rec < amount) {
        warning("Insufficient Cash", `Minimum cash required: ₹${amount.toFixed(2)}`);
        return;
      }
      refStr = `Received: ₹${rec.toFixed(2)}, Change: ₹${(rec - amount).toFixed(2)}`;
    } else if (pm.type === "card") {
      if (!cardReference) { warning("Reference Required", "Please enter the transaction reference."); return; }
      refStr = `Ref: ${cardReference}`;
    } else if (pm.type === "upi") {
      refStr = `UPI Confirmed (${pm.upiId})`;
    }

    const currentPaymentIndex = customPaidList.length + 1;
    const newPayment = {
      paymentIndex: currentPaymentIndex,
      methodId: selectedPaymentId,
      methodName: pm.name,
      amount,
      reference: refStr
    };

    const updatedPaidList = [...customPaidList, newPayment];
    setCustomPaidList(updatedPaidList);
    setCashReceived("");
    setCardReference("");

    const newRemaining = remainingTotal - amount;
    setCustomAmountInput(newRemaining.toFixed(2));

    if (newRemaining <= 0.01) {
      const serializedRef = `Split Custom: ` + updatedPaidList.map(
        p => `Part ${p.paymentIndex} (${p.methodName} - ₹${p.amount.toFixed(2)}${p.reference ? `, ${p.reference}` : ""})`
      ).join(" | ");

      const completedOrder: Order = {
        ...currentOrder,
        status: "paid",
        paymentMethodId: selectedPaymentId,
        paymentReference: serializedRef
      };

      processOrderPayment(selectedPaymentId, serializedRef);
      setShowCheckoutModal(false);
      setReceiptOrder(completedOrder);
      if (completedOrder.customerId) {
        const cust = customers.find((c) => c.id === completedOrder.customerId);
        if (cust) setReceiptEmailInput(cust.email);
      }
      setShowReceiptModal(true);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError(""); setDiscountSuccess("");
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
    const nErr = !customerName.trim() ? "Name is required." : "";
    const eErr = customerEmail.trim() && !EMAIL_RE.test(customerEmail.trim()) ? "Enter a valid email." : "";
    const pErr = customerPhone.trim() && !PHONE_RE.test(customerPhone.trim()) ? "Enter a valid phone number." : "";
    setCustNameErr(nErr); setCustEmailErr(eErr); setCustPhoneErr(pErr);
    if (nErr || eErr || pErr) return;
    setCustomerSaving(true); setCustomerError("");
    try {
      const newCust = await createCustomer({ name: customerName.trim(), email: customerEmail.trim(), phone: customerPhone.trim() });
      if (newCust) {
        linkCustomerToOrder(newCust.id);
        setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
        setCustNameErr(""); setCustEmailErr(""); setCustPhoneErr("");
        setCustomerError(""); setShowCustomerModal(false);
      }
    } catch (err: any) {
      setCustomerError(err?.message ?? "Failed to save guest.");
    } finally { setCustomerSaving(false); }
  };

  const handleEmailReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptEmailInput || !receiptOrder) return;
    setEmailSentStatus(true);
    try {
      const res = await sendEmailReceipt(receiptOrder.id, receiptEmailInput);
      if (res?.previewUrl) info("Receipt Preview", `Ethereal test mode — preview available in server logs.`);
      else if (res?.status === "logged") info("Offline Mode", "Receipt simulation logged to the server terminal.");
      else success("Receipt Sent", `Email delivered to ${receiptEmailInput} successfully.`);
    } catch { toastError("Email Failed", "Could not send receipt. Please check your connection."); }
    finally { setEmailSentStatus(false); }
  };

  const inputCls = (err?: string) =>
    cn(
      "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 transition-all placeholder:text-stone-400 text-sm",
      err
        ? "border-red-400 focus:ring-red-400/30"
        : "border-stone-200 dark:border-stone-800 focus:ring-primary/30 focus:border-primary"
    );
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  const cartItemCount = currentOrder.items.reduce((s, i) => s + i.quantity, 0);
  const needsGuest = !!currentOrder.tableId && !linkedCustomer && currentOrder.items.length > 0;

  return (
    <section className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

      {/* ══ LEFT: Products Panel ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden">

        {/* Category chips */}
        <div className="sticky top-0 z-10 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              selectedCategoryId === null
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100"
            )}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-white dark:bg-stone-900 border text-stone-600 dark:text-stone-400 hover:bg-stone-50",
                selectedCategoryId === cat.id
                  ? "border-stone-800 dark:border-white ring-2 ring-stone-900/20 dark:ring-white/10"
                  : "border-stone-200 dark:border-stone-800"
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
            {filteredProducts.map((prod) => {
              const cat = categories.find((c) => c.id === prod.categoryId);
              const inCart = currentOrder.items.find((i) => i.productId === prod.id);
              return (
                <motion.button
                  key={prod.id}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => addToCart(prod, 1)}
                  className="group relative flex flex-col text-left bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-primary/40 hover:shadow-md overflow-hidden shadow-sm transition-all"
                >
                  {/* Category colour bar */}
                  <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: cat?.color || "#e2e8f0" }} />

                  {/* In-cart quantity badge */}
                  {inCart && (
                    <span className="absolute top-3 left-3 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                      {inCart.quantity}
                    </span>
                  )}

                  {/* Add overlay on hover */}
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow scale-75 group-hover:scale-100">
                    <Plus className="size-3.5" />
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400 block mb-1">
                        {cat?.name || "Uncategorized"}
                      </span>
                      <h4 className="font-extrabold text-stone-850 dark:text-stone-100 group-hover:text-primary transition-colors text-sm leading-snug">
                        {prod.name}
                      </h4>
                      {prod.description && (
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-tight">{prod.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                      <span className="text-[10px] text-stone-400 italic">{prod.unitOfMeasure}</span>
                      <span className="text-sm font-black text-stone-800 dark:text-white">₹{prod.price.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-4 py-16 flex flex-col items-center gap-3 text-stone-400">
                <ShoppingCart className="size-10" />
                <p className="font-semibold italic">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Cart Sidebar ═══════════════════════════════════════════════ */}
      <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 flex flex-col bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800">

        {/* Cart header */}
        <div className="px-4 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-stone-800 dark:text-stone-100">Active Cart</h3>
              {cartItemCount > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-black rounded-full">
                  {cartItemCount}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 font-mono mt-0.5">{currentOrder.orderNumber}</p>
          </div>
          <button
            onClick={() => cancelDraftOrder(currentOrder.id)}
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <X className="size-3.5" />
            Cancel
          </button>
        </div>

        {/* Guest assignment row */}
        <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400 font-semibold">Guest:</span>
          {linkedCustomer ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="size-3 text-primary" />
              </div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-200">{linkedCustomer.name}</span>
              <button
                onClick={() => linkCustomerToOrder(null)}
                className="text-stone-400 hover:text-red-500 transition-colors"
                title="Unlink"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setCustomerName(""); setCustomerEmail(""); setCustomerPhone(""); setSelectedCustomerId("");
                setModalMode(customers.length > 0 ? "select" : "register");
                setShowCustomerModal(true);
              }}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
            >
              <UserPlus className="size-3.5" />
              Assign Guest
            </button>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence initial={false}>
            {currentOrder.items.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center text-stone-400 gap-3 py-12"
              >
                <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <ShoppingCart className="size-7 text-stone-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">Cart is empty</p>
                  <p className="text-xs mt-1">Tap products on the left to add them</p>
                </div>
              </motion.div>
            ) : (
              currentOrder.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{item.name}</h5>
                    <p className="text-[10px] text-stone-400 mt-0.5">₹{item.unitPrice.toFixed(2)} · Tax {item.taxPercentage}%</p>
                  </div>

                  {/* Qty stepper */}
                  <div className="flex items-center gap-1 bg-stone-200 dark:bg-stone-800 rounded-xl p-0.5 shrink-0">
                    <button
                      onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="text-xs font-black text-stone-800 dark:text-white w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(products.find((p) => p.id === item.productId)!, 1)}
                      className="w-7 h-7 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <div className="w-14 text-right font-black text-xs text-stone-900 dark:text-white shrink-0">
                    ₹{(item.total ?? item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Order summary & actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-3">
          {/* Totals */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span><span className="font-bold text-stone-700 dark:text-stone-300">₹{currentOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Taxes</span><span className="font-bold text-stone-700 dark:text-stone-300">₹{currentOrder.tax.toFixed(2)}</span>
            </div>
            {currentOrder.discounts > 0 && (
              <div className="flex justify-between text-red-500 font-semibold">
                <span>Discounts {currentOrder.appliedPromoName ? `(${currentOrder.appliedPromoName})` : ""}</span>
                <span>-₹{currentOrder.discounts.toFixed(2)}</span>
              </div>
            )}
            {currentOrder.appliedCouponCode && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1"><Tag className="size-3" />{currentOrder.appliedCouponCode}</span>
                <button onClick={removeCoupon} className="hover:text-stone-800 transition-colors"><X className="size-3.5" /></button>
              </div>
            )}
            <div className="h-px bg-stone-200 dark:bg-stone-800 my-1" />
            <div className="flex justify-between font-black text-sm">
              <span className="text-stone-800 dark:text-stone-100">Order Total</span>
              <span className="text-primary">₹{currentOrder.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Guest warning */}
          {needsGuest && (
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-500/20">
              <TriangleAlert className="size-3.5 shrink-0" />
              Assign a guest above to enable kitchen & payment
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setDiscountError(""); setDiscountSuccess(""); setShowDiscountModal(true); }}
              disabled={currentOrder.items.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-xl font-bold text-xs text-stone-700 dark:text-stone-300 transition-colors disabled:opacity-40"
            >
              <Tag className="size-3.5" /> Coupon
            </button>
            <button
              onClick={handleSendToKitchen}
              disabled={currentOrder.items.length === 0 || needsGuest}
              className="flex items-center justify-center gap-1.5 py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-xl font-bold text-xs text-stone-700 dark:text-stone-300 transition-colors disabled:opacity-40"
            >
              <ChefHat className="size-3.5" /> Kitchen
            </button>
          </div>

          {/* Checkout CTA */}
          <button
            onClick={openCheckout}
            disabled={currentOrder.items.length === 0 || needsGuest}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="size-4.5" />
            Process Payment
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════════ */}

      {/* Modal 1: Coupon / Discount */}
      <DialogModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="Apply Coupon Code"
        description="Enter a valid promo or coupon code to apply a discount to this order."
        icon={<Tag className="size-5" />}
        size="sm"
      >
        <form onSubmit={handleApplyCoupon} className="space-y-4">
          <div>
            <label className={labelCls}>Coupon Code <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              className={inputCls() + " font-mono font-bold tracking-widest"}
              autoFocus
            />
          </div>
          {discountError && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
              <TriangleAlert className="size-3.5" />{discountError}
            </p>
          )}
          {discountSuccess && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="size-3.5" />{discountSuccess}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button type="button" onClick={() => setShowDiscountModal(false)} className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95">Apply Code</button>
          </div>
        </form>
      </DialogModal>

      {/* Modal 2: Guest Assignment */}
      <DialogModal
        isOpen={showCustomerModal}
        onClose={() => { setShowCustomerModal(false); setCustomerError(""); setCustNameErr(""); setCustEmailErr(""); setCustPhoneErr(""); }}
        title={modalMode === "select" ? "Assign Existing Guest" : "Register New Guest"}
        description={modalMode === "select" ? "Link an existing customer profile to this order." : "Create a new guest profile and link them to this order."}
        icon={<UserPlus className="size-5" />}
        size="sm"
      >
        <div className="space-y-4">
          {/* Mode toggle */}
          {customers.length > 0 && (
            <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl">
              {(["select", "register"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModalMode(mode)}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    modalMode === mode
                      ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 shadow-sm"
                      : "text-stone-500"
                  )}
                >
                  {mode === "select" ? "Existing Guest" : "New Guest"}
                </button>
              ))}
            </div>
          )}

          {modalMode === "select" ? (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Select Customer</label>
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className={inputCls()}>
                  <option value="">— Choose a Guest —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedCustomerId) { warning("No Guest Selected", "Please choose a guest from the list before linking."); return; }
                    linkCustomerToOrder(selectedCustomerId);
                    setShowCustomerModal(false);
                  }}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95"
                >
                  Link Guest
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setCustNameErr(""); }} placeholder="e.g. Sarah Connor" disabled={customerSaving} className={inputCls(custNameErr)} autoFocus />
                {custNameErr && <p className="text-red-500 text-xs mt-1">{custNameErr}</p>}
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-stone-400 font-normal">(optional)</span></label>
                <input type="text" value={customerEmail} onChange={(e) => { setCustomerEmail(e.target.value); setCustEmailErr(""); }} placeholder="sarah@example.com" disabled={customerSaving} className={inputCls(custEmailErr)} />
                {custEmailErr && <p className="text-red-500 text-xs mt-1">{custEmailErr}</p>}
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-stone-400 font-normal">(optional)</span></label>
                <input type="text" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setCustPhoneErr(""); }} placeholder="+1 555-0199" disabled={customerSaving} className={inputCls(custPhoneErr)} />
                {custPhoneErr && <p className="text-red-500 text-xs mt-1">{custPhoneErr}</p>}
              </div>
              {customerError && <p className="text-xs text-red-500 font-semibold">{customerError}</p>}
              <div className="flex justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button type="button" onClick={() => setShowCustomerModal(false)} disabled={customerSaving} className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={customerSaving || !customerName.trim()} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                  {customerSaving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : "Link & Register"}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogModal>

      {/* Modal 3: Checkout Payment */}
      <DialogModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Process Checkout"
        description="Select a payment method and split mode to complete and settle this order."
        icon={<CreditCard className="size-5" />}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (splitMode === "full") {
              handleCheckoutSubmit(e);
            } else if (splitMode === "equal") {
              handleEqualSplitGuestPayment(activeEqualGuestIndex);
            } else if (splitMode === "item") {
              const selectedExpandedItems = expandedItems.filter(item => itemSelectedIds.includes(item.id));
              const selectedSubtotal = selectedExpandedItems.reduce((sum, item) => sum + item.unitPrice, 0);
              const proportionalRatio = currentOrder.subtotal > 0 ? (selectedSubtotal / currentOrder.subtotal) : 0;
              const selectedTotal = proportionalRatio * currentOrder.total;
              const selectedNames = selectedExpandedItems.map(item => item.name);
              handleItemSplitGuestPayment(selectedTotal, selectedNames);
            } else if (splitMode === "custom") {
              const customAmount = parseFloat(customAmountInput);
              const remainingTotal = currentOrder.total - customPaidList.reduce((sum, p) => sum + p.amount, 0);
              handleCustomSplitPayment(customAmount, remainingTotal);
            }
          }}
          className="space-y-5"
        >
          {/* Tab Selector Header */}
          <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-2xl gap-1">
            {[
              { id: "full", label: "Full Bill", icon: CreditCard },
              { id: "equal", label: "Split Equally", icon: Users },
              { id: "item", label: "Split by Item", icon: Scissors },
              { id: "custom", label: "Custom Amount", icon: Banknote },
            ].map((t) => {
              const Icon = t.icon;
              const active = splitMode === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSplitMode(t.id as any);
                    const firstPm = paymentMethods.find((p) => p.isEnabled);
                    if (firstPm) setSelectedPaymentId(firstPm.id);
                    setCashReceived("");
                    setCardReference("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    active
                      ? "bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 shadow border border-stone-200/50 dark:border-stone-850"
                      : "text-stone-500 hover:text-stone-850 dark:hover:text-stone-200"
                  )}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* SPLIT MODE: EQUALLY */}
          {splitMode === "equal" && (
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-stone-800 dark:text-stone-200 text-sm">Number of Guests</h4>
                  <p className="text-xs text-stone-400 mt-0.5">Divide the bill equally among participants</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-xl p-1 border border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    disabled={splitGuests <= 2}
                    onClick={() => {
                      setSplitGuests(Math.max(2, splitGuests - 1));
                      setEqualPaidList([]);
                      setActiveEqualGuestIndex(1);
                    }}
                    className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-40"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="font-black text-sm text-stone-800 dark:text-white w-6 text-center">{splitGuests}</span>
                  <button
                    type="button"
                    disabled={splitGuests >= 20}
                    onClick={() => {
                      setSplitGuests(Math.min(20, splitGuests + 1));
                      setEqualPaidList([]);
                      setActiveEqualGuestIndex(1);
                    }}
                    className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              {/* Steps Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Array.from({ length: splitGuests }).map((_, idx) => {
                  const gIndex = idx + 1;
                  const paymentInfo = equalPaidList.find(p => p.guestIndex === gIndex);
                  const isPaid = !!paymentInfo;
                  const isActive = activeEqualGuestIndex === gIndex;
                  return (
                    <div
                      key={gIndex}
                      className={cn(
                        "p-3 rounded-xl border text-center relative overflow-hidden transition-all",
                        isPaid
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : isActive
                            ? "bg-primary/10 border-primary/20 text-primary ring-2 ring-primary/20"
                            : "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400"
                      )}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider mb-1">Guest {gIndex}</div>
                      <div className="text-xs font-black">
                        ₹{(currentOrder.total / splitGuests).toFixed(2)}
                      </div>
                      {isPaid && (
                        <div className="absolute top-1 right-1">
                          <Check className="size-3 text-emerald-500 font-bold" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SPLIT MODE: BY ITEM */}
          {splitMode === "item" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Select Items for Guest {itemPaidList.length + 1}</label>
                <div className="max-h-[220px] overflow-y-auto border border-stone-200 dark:border-stone-800 rounded-2xl p-2 space-y-1 bg-stone-50 dark:bg-stone-950">
                  {expandedItems.map((item) => {
                    const isPaid = itemPaidList.some(p => p.itemIds.includes(item.id));
                    const paidBy = itemPaidList.find(p => p.itemIds.includes(item.id))?.guestName;
                    const isSelected = itemSelectedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isPaid}
                        onClick={() => toggleItemSelection(item.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                          isPaid
                            ? "bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-850 opacity-60 cursor-not-allowed"
                            : isSelected
                              ? "bg-primary/5 dark:bg-primary/10 border-primary text-primary"
                              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all",
                            isPaid
                              ? "bg-stone-300 dark:bg-stone-700 border-stone-300"
                              : isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-stone-300 dark:border-stone-700"
                          )}>
                            {(isPaid || isSelected) && <Check className="size-3" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{item.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">Tax: {item.taxPercentage}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold block">₹{item.itemTotal.toFixed(2)}</span>
                          {isPaid && <span className="text-[10px] text-emerald-500 font-semibold">Paid by {paidBy}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {itemPaidList.length > 0 && (
                <div className="space-y-2">
                  <label className={labelCls}>Settled Guest Shares</label>
                  <div className="space-y-1 max-h-[100px] overflow-y-auto">
                    {itemPaidList.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="truncate pr-4">{p.guestName} ({p.itemNames.join(", ")})</span>
                        <span className="font-mono font-bold shrink-0">₹{p.amount.toFixed(2)} ({p.methodName})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SPLIT MODE: CUSTOM AMOUNT */}
          {splitMode === "custom" && (
            <div className="space-y-4">
              {/* Custom presets */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {[0.1, 0.25, 0.5, 1.0].map((ratio) => {
                    const remainingTotal = currentOrder.total - customPaidList.reduce((sum, p) => sum + p.amount, 0);
                    const amt = remainingTotal * ratio;
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setCustomAmountInput(amt.toFixed(2))}
                        className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-[11px] font-bold transition-all"
                      >
                        {ratio === 1.0 ? "Full" : `${ratio * 100}%`} (₹{amt.toFixed(0)})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls}>Amount to Pay Next (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value)}
                  max={currentOrder.total - customPaidList.reduce((sum, p) => sum + p.amount, 0)}
                  min={0.01}
                  placeholder="e.g. 100.00"
                  className={inputCls() + " font-mono font-bold text-lg"}
                  autoFocus
                />
              </div>

              {customPaidList.length > 0 && (
                <div className="space-y-2">
                  <label className={labelCls}>Transaction History</label>
                  <div className="space-y-1 max-h-[100px] overflow-y-auto">
                    {customPaidList.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-2 rounded-xl text-xs text-stone-600 dark:text-stone-300">
                        <span>Payment #{p.paymentIndex} ({p.methodName})</span>
                        <span className="font-mono font-bold">₹{p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount due display (Dynamic based on split context) */}
          <div className="flex justify-between items-center bg-primary/5 dark:bg-primary/10 border border-primary/20 px-5 py-4 rounded-2xl">
            <span className="font-bold text-stone-500">
              {splitMode === "full" && "Amount Due"}
              {splitMode === "equal" && `Guest ${activeEqualGuestIndex} share`}
              {splitMode === "item" && `Selected Guest ${itemPaidList.length + 1} share`}
              {splitMode === "custom" && "Remaining / Custom share"}
            </span>
            <span className="font-black text-2xl text-primary">
              ₹{activePaymentAmount.toFixed(2)}
            </span>
          </div>

          {/* Payment methods selection */}
          <div>
            <label className={labelCls}>Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.filter((p) => p.isEnabled).map((pm) => {
                const PMIcon = pm.type === "cash" ? Banknote : pm.type === "card" ? CreditCard : Smartphone;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedPaymentId(pm.id)}
                    className={cn(
                      "p-3.5 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-2 transition-all",
                      selectedPaymentId === pm.id
                        ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                        : "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                    )}
                  >
                    <PMIcon className="size-5" />
                    {pm.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash details */}
          {selectedPaymentId === 1 && (
            <div>
              <label className={labelCls}>Cash Tendered (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="e.g. 500.00"
                className={inputCls() + " font-mono"}
                autoFocus
              />
              {parseFloat(cashReceived) >= activePaymentAmount && (
                <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                  <CheckCircle2 className="size-4" />
                  Change: ₹{(parseFloat(cashReceived) - activePaymentAmount).toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Card details */}
          {selectedPaymentId === 2 && (
            <div>
              <label className={labelCls}>Transaction Reference</label>
              <input
                type="text"
                required
                value={cardReference}
                onChange={(e) => setCardReference(e.target.value)}
                placeholder="Auth code or receipt #"
                className={inputCls() + " font-mono"}
                autoFocus
              />
            </div>
          )}

          {/* UPI QR */}
          {selectedPaymentId === 3 && (() => {
            const upiMethod = paymentMethods.find((p) => p.id === 3);
            return (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4">
                <UpiQr
                  upiId={upiMethod?.upiId ?? ""}
                  merchantName="OrderHub"
                  amount={activePaymentAmount}
                  orderId={currentOrder.orderNumber}
                />
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setShowCheckoutModal(false)}
              className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedPaymentId ||
                activePaymentAmount <= 0.001 ||
                (selectedPaymentId === 1 && (isNaN(parseFloat(cashReceived)) || parseFloat(cashReceived) < activePaymentAmount)) ||
                (selectedPaymentId === 2 && !cardReference)
              }
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {splitMode === "full" && "Settle Order"}
              {splitMode === "equal" && `Settle Guest ${activeEqualGuestIndex}`}
              {splitMode === "item" && `Settle Selected`}
              {splitMode === "custom" && `Settle Partial Amount`}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal 4: Receipt */}
      {receiptOrder && (
        <DialogModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Order Receipt"
          description={`Order ${receiptOrder.orderNumber} — ${new Date(receiptOrder.createdAt).toLocaleString()}`}
          icon={<Receipt className="size-5" />}
          size="md"
        >
          <div className="space-y-5">
            {/* Receipt preview */}
            <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl font-mono text-[11px] leading-relaxed space-y-3">
              <div className="text-center space-y-1">
                <h4 className="font-black text-sm uppercase tracking-wider">Odoo Cafe</h4>
                <p className="text-stone-500">Ground Floor Zone, POS Shift</p>
                <p className="text-stone-500">{new Date(receiptOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700" />
              <div className="space-y-0.5 text-stone-600 dark:text-stone-400">
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Order:</span> {receiptOrder.orderNumber}</p>
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Table:</span> {receiptOrder.tableId ? tables.find((t) => t.id === receiptOrder.tableId)?.tableNumber : "Takeaway"}</p>
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Guest:</span> {receiptOrder.customerId ? customers.find((c) => c.id === receiptOrder.customerId)?.name ?? "—" : "Walk-in"}</p>
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700" />
              <div className="space-y-1">
                {receiptOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} ×{it.quantity}</span>
                    <span className="font-bold">₹{it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700" />
              <div className="space-y-0.5 text-right">
                <p className="text-stone-500">Subtotal: ₹{receiptOrder.subtotal.toFixed(2)}</p>
                <p className="text-stone-500">Taxes: ₹{receiptOrder.tax.toFixed(2)}</p>
                {receiptOrder.discounts > 0 && <p className="text-red-500">Discounts: -₹{receiptOrder.discounts.toFixed(2)}</p>}
                <p className="font-black text-sm text-stone-900 dark:text-stone-100 pt-1 border-t border-dashed border-stone-300 dark:border-stone-700">TOTAL: ₹{receiptOrder.total.toFixed(2)}</p>
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700 pt-2 text-center text-[10px] text-stone-400 uppercase tracking-widest">
                Thank you for your visit!
              </div>
            </div>

            {/* Email receipt */}
            <form onSubmit={handleEmailReceipt} className="space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4">
              <label className="block text-xs text-stone-500 font-bold uppercase tracking-wider">Send Digital Receipt</label>
              <div className="flex gap-2">
                <input type="email" required value={receiptEmailInput} onChange={(e) => setReceiptEmailInput(e.target.value)} placeholder="guest@gmail.com" className={inputCls() + " flex-1 font-mono"} />
                <button type="submit" disabled={emailSentStatus} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 shrink-0">
                  <Send className="size-3.5" />
                  {emailSentStatus ? "Sending…" : "Send"}
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  if (!receiptOrder) return;
                  downloadReceiptPDF({
                    orderNumber: receiptOrder.orderNumber, createdAt: receiptOrder.createdAt,
                    cashierName: currentUser?.name ?? "Cashier",
                    guestName: receiptOrder.customerId ? (customers.find((c) => c.id === receiptOrder.customerId)?.name ?? "Guest") : "Walk-in",
                    tableNumber: receiptOrder.tableId ? (tables.find((t) => t.id === receiptOrder.tableId)?.tableNumber ?? "—") : "Takeaway",
                    items: receiptOrder.items.map((it) => ({ name: it.name, quantity: it.quantity, total: it.total })),
                    subtotal: receiptOrder.subtotal, tax: receiptOrder.tax, discounts: receiptOrder.discounts, total: receiptOrder.total,
                    paymentMethod: paymentMethods.find((p) => p.id === receiptOrder.paymentMethodId)?.name ?? "Cash",
                    paymentReference: receiptOrder.paymentReference ?? undefined,
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <Printer className="size-4" /> Print PDF
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </DialogModal>
      )}
    </section>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderCheckoutContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  AlertCircle,
  CornerDownRight,
  Plus,
  Minus,
  CheckCircle,
  Loader2,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { useApp, Order, OrderItem } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const VOID_REASONS = [
  "Wrong Items Placed",
  "Customer Cancelled",
  "Duplicate Order",
  "Kitchen Error",
  "Other",
];

const REFUND_REASONS = [
  "Wrong Item Served",
  "Item Unsatisfactory",
  "Customer Changed Mind",
  "Billing Mistake",
  "Other",
];

const REFUND_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "CARD", label: "Back to Card (manual)" },
  { id: "STORE_CREDIT", label: "Store Credit" },
];

export default function RefundDialog({ isOpen, onClose, order }: RefundDialogProps) {
  const { voidOrder, refundOrder } = useApp();
  const { success, error: toastError } = useToast();

  const [activeMode, setActiveMode] = useState<"void" | "refund">("void");
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [reason, setReason] = useState(VOID_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("CASH");

  // Partial Refund Quantities State
  // Map of orderItemId -> selected quantity to refund
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});

  // Reset states when mode changes
  useEffect(() => {
    setReason(activeMode === "void" ? VOID_REASONS[0] : REFUND_REASONS[0]);
    setCustomReason("");
    setNotes("");
  }, [activeMode]);

  // Initialize quantities to 0
  useEffect(() => {
    const initialQuants: Record<string, number> = {};
    order.items.forEach((it) => {
      initialQuants[it.id] = 0;
    });
    setRefundQuantities(initialQuants);
  }, [order]);

  const handleQtyChange = (itemId: string, remaining: number, delta: number) => {
    const current = refundQuantities[itemId] || 0;
    const next = Math.max(0, Math.min(remaining, current + delta));
    setRefundQuantities((prev) => ({ ...prev, [itemId]: next }));
  };

  // Calculations
  const calculatedRefund = (() => {
    let subtotal = 0;
    order.items.forEach((it) => {
      const qty = refundQuantities[it.id] || 0;
      subtotal += it.unitPrice * qty;
    });
    const tax = parseFloat((subtotal * 0.10).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    // Cap at remaining paid total
    const refundsList = order.refunds || [];
    const totalAlreadyRefunded = refundsList.reduce((sum, r) => sum + r.amount, 0);
    const maxRefundable = Math.max(0, order.total - totalAlreadyRefunded);
    const finalTotal = Math.min(total, maxRefundable);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax,
      total: parseFloat(finalTotal.toFixed(2)),
    };
  })();

  const isRefundDisabled = Object.values(refundQuantities).every((q) => q === 0);

  // Submit handlers
  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason : reason;
    if (!finalReason.trim()) return;

    setLoading(true);
    try {
      await voidOrder(order.id, finalReason, notes, refundMethod);
      success("Order Voided", `Order ${order.orderNumber} voided successfully.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      toastError("Void Failed", err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason : reason;
    if (!finalReason.trim()) return;

    const itemsToSend = Object.entries(refundQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        orderItemId: itemId,
        quantity: qty,
      }));

    if (itemsToSend.length === 0) return;

    setLoading(true);
    try {
      await refundOrder(order.id, finalReason, notes, refundMethod, itemsToSend);
      success("Refund Issued", `Partial refund of ₹${calculatedRefund.total.toFixed(2)} completed.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      toastError("Refund Failed", err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls =
    "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-stone-400";
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-xs uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Dialog Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100vh-80px)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
              <RefreshCcw className="size-5 text-primary" />
              Void / Refund Transaction
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Order: <span className="font-mono font-bold text-stone-600 dark:text-stone-300">{order.orderNumber}</span> · Total paid: ₹{order.total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-850 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors active:scale-95"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-stone-100 dark:border-stone-850 px-6 pt-2 shrink-0 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            onClick={() => setActiveMode("void")}
            className={cn(
              "px-4 py-2.5 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2",
              activeMode === "void"
                ? "border-red-500 text-red-500"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            )}
          >
            <Trash2 className="size-4" />
            Full Void & Credit Note
          </button>
          <button
            onClick={() => setActiveMode("refund")}
            className={cn(
              "px-4 py-2.5 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2",
              activeMode === "refund"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            )}
          >
            <CornerDownRight className="size-4" />
            Partial Refund Select
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <AnimatePresence mode="wait">
            {activeMode === "void" ? (
              <motion.form
                key="void-form"
                onSubmit={handleVoidSubmit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700 dark:text-red-400/80 leading-relaxed">
                    <p className="font-bold">Caution: Complete Order Void</p>
                    <p className="mt-0.5">
                      This will invalidate the payment transaction, set the order status to cancelled, mark the table as available, and create a full refund record in the system logs.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Void Reason */}
                  <div>
                    <label className={labelCls}>Void Reason</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={inputCls}
                    >
                      {VOID_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Refund Method */}
                  <div>
                    <label className={labelCls}>Refund Destination</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className={inputCls}
                    >
                      {REFUND_METHODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Reason */}
                  {reason === "Other" && (
                    <div className="col-span-1 sm:col-span-2">
                      <label className={labelCls}>Specify Custom Reason</label>
                      <input
                        type="text"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Enter void justification..."
                        className={inputCls}
                        required
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className={labelCls}>Internal Audit Note (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add compliance notes or details about customer feedback..."
                      className={cn(inputCls, "resize-none h-20")}
                    />
                  </div>
                </div>

                {/* Refund Total Summary Display */}
                <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-2xl flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-500">Refund Amount (Full):</span>
                  <span className="text-xl font-black text-red-500">₹{order.total.toFixed(2)}</span>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-850">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    Confirm Void Order
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="refund-form"
                onSubmit={handleRefundSubmit}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal">
                  Configure the items and quantities to refund. Tax adjustment (10%) is recalculated automatically.
                </p>

                {/* Items Selector List */}
                <div className="space-y-2 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/30 dark:bg-stone-950/20 max-h-60 overflow-y-auto">
                  {order.items.map((it) => {
                    const alreadyRefunded = it.refundedQuantity || 0;
                    const maxAllowed = it.quantity - alreadyRefunded;
                    const selected = refundQuantities[it.id] || 0;

                    return (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-850/80 rounded-xl"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-bold text-stone-800 dark:text-stone-200 text-sm truncate">
                            {it.name}
                          </p>
                          <p className="text-xs text-stone-450 mt-0.5">
                            ₹{it.unitPrice.toFixed(2)} each · {alreadyRefunded > 0 ? `${alreadyRefunded} refunded / ` : ""}{maxAllowed} available
                          </p>
                        </div>

                        {/* Qty controller */}
                        {maxAllowed === 0 ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            Fully Refunded
                          </span>
                        ) : (
                          <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-950 p-1 border border-stone-200 dark:border-stone-850 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(it.id, maxAllowed, -1)}
                              disabled={selected === 0}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors disabled:opacity-50"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="font-mono font-bold text-sm w-5 text-center">
                              {selected}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(it.id, maxAllowed, 1)}
                              disabled={selected === maxAllowed}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors disabled:opacity-50"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Refund Form inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Refund Reason */}
                  <div>
                    <label className={labelCls}>Refund Reason</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={inputCls}
                    >
                      {REFUND_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Refund Method */}
                  <div>
                    <label className={labelCls}>Refund Destination</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className={inputCls}
                    >
                      {REFUND_METHODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Reason */}
                  {reason === "Other" && (
                    <div className="col-span-1 sm:col-span-2">
                      <label className={labelCls}>Specify Custom Reason</label>
                      <input
                        type="text"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Enter refund justification..."
                        className={inputCls}
                        required
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className={labelCls}>Internal Audit Note (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add accounting reference, store credit card details or general notes..."
                      className={cn(inputCls, "resize-none h-20")}
                    />
                  </div>
                </div>

                {/* Summary Table */}
                <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-2xl text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between text-stone-500">
                    <span>Refund Subtotal</span>
                    <span>₹{calculatedRefund.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Recalculated Taxes (10%)</span>
                    <span>₹{calculatedRefund.tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-stone-200 dark:bg-stone-800 my-1" />
                  <div className="flex justify-between text-sm font-black">
                    <span className="text-stone-700 dark:text-stone-300">TOTAL REFUND ESTIMATE</span>
                    <span className="text-amber-500">₹{calculatedRefund.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-850">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isRefundDisabled}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 text-white font-bold rounded-xl shadow transition-all active:scale-95 flex items-center gap-2 text-sm"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    Confirm Refund (₹{calculatedRefund.total.toFixed(2)})
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

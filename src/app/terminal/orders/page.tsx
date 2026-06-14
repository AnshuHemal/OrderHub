"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Order } from "@/app/context/AppContext";
import { downloadReceiptPDF } from "@/lib/receipt-pdf";
import { DialogModal } from "@/components/ui/dialog-modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Pencil,
  Trash2, Eye, Receipt, Send, Printer, MapPin, Package, RefreshCcw, FileText,
  Flame, Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";
import RefundDialog from "@/components/shared/RefundDialog";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  paid:      { label: "Paid",      icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  draft:     { label: "Draft",     icon: Clock,        cls: "bg-amber-500/10  text-amber-600  dark:text-amber-400"    },
  cancelled: { label: "Cancelled", icon: XCircle,      cls: "bg-red-500/10    text-red-500"                           },
  sent:      { label: "Sent",      icon: CheckCircle2, cls: "bg-blue-500/10   text-blue-500"                          },
} as const;

const KITCHEN_STATUS_CONFIG = {
  PENDING:   { label: "Pending",   icon: Clock,        cls: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
  CONFIRMED: { label: "Confirmed", icon: Clock,        cls: "bg-blue-500/10 text-blue-550 border border-blue-500/20" },
  PREPARING: { label: "Preparing", icon: Flame,        cls: "bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20 animate-pulse font-extrabold" },
  READY:     { label: "Ready",     icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black" },
  SERVED:    { label: "Served",    icon: Utensils,     cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20" },
  PAID:      { label: "Paid",      icon: CheckCircle2, cls: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" },
  CANCELLED: { label: "Cancelled", icon: XCircle,      cls: "bg-red-500/10 text-red-500 border border-red-500/20" },
};

// ─── Inner content ────────────────────────────────────────────────────────────

function OrdersLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser, orders, activeSession, customers, tables,
    paymentMethods, cancelDraftOrder, editDraftOrder, sendEmailReceipt,
    printOrder
  } = useApp();

  const orderSearch = searchParams.get("search") || "";
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptEmailInput, setReceiptEmailInput] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "preparing" | "ready" | "paid" | "cancelled">("all");

  const isManager = currentUser?.role === "admin" || currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";

  if (!activeSession || !currentUser) return null;

  const { success, error: toastError, info } = useToast();
  const confirm = useConfirm();

  const isOrderInSession = (o: Order) => !o.sessionId || o.sessionId === activeSession.id;

  const filteredOrders = orders.filter((o) => {
    if (!isOrderInSession(o)) return false;

    // Filter by status tab
    const kStatus = o.kitchenStatus || (o.status === "paid" ? "PAID" : o.status === "cancelled" ? "CANCELLED" : "PENDING");
    if (statusTab !== "all") {
      if (statusTab === "pending" && kStatus !== "PENDING" && kStatus !== "CONFIRMED") return false;
      if (statusTab === "preparing" && kStatus !== "PREPARING") return false;
      if (statusTab === "ready" && kStatus !== "READY" && kStatus !== "SERVED") return false;
      if (statusTab === "paid" && (o.status !== "paid" || !!o.voidedAt)) return false;
      if (statusTab === "cancelled" && o.status !== "cancelled" && !o.voidedAt) return false;
    }

    const cust = customers.find((c) => c.id === o.customerId);
    return (
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(orderSearch.toLowerCase()))
    );
  });

  const handleEmailReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptEmailInput || !receiptOrder) return;
    setEmailSentStatus(true);
    try {
      const res = await sendEmailReceipt(receiptOrder.id, receiptEmailInput);
      if (res?.previewUrl) info("Receipt Preview", "Ethereal test mode — preview available in server logs.");
      else if (res?.status === "logged") info("Offline Mode", "Receipt simulation logged to the server terminal.");
      else success("Receipt Sent", `Email delivered to ${receiptEmailInput} successfully.`);
    } catch { toastError("Email Failed", "Could not send receipt. Please check your connection."); }
    finally { setEmailSentStatus(false); }
  };

  const openReceipt = (order: Order) => {
    setReceiptOrder(order);
    if (order.customerId) {
      const cust = customers.find((c) => c.id === order.customerId);
      if (cust) setReceiptEmailInput(cust.email);
    }
    setShowReceiptModal(true);
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-400 text-sm font-mono";

  return (
    <section className="flex-1 p-5 lg:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in overflow-y-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Shift Orders Log
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
            Review, reprint receipts, or edit draft orders for the active session.
          </p>
        </div>
        <div className="shrink-0 px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-300">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800/40 p-1 md:max-w-fit">
        {[
          { id: "all", label: "All Orders", count: orders.filter(o => isOrderInSession(o)).length },
          { id: "pending", label: "Pending", count: orders.filter(o => isOrderInSession(o) && (o.kitchenStatus === "PENDING" || o.kitchenStatus === "CONFIRMED")).length },
          { id: "preparing", label: "Preparing", count: orders.filter(o => isOrderInSession(o) && o.kitchenStatus === "PREPARING").length },
          { id: "ready", label: "Ready / Served", count: orders.filter(o => isOrderInSession(o) && (o.kitchenStatus === "READY" || o.kitchenStatus === "SERVED")).length },
          { id: "paid", label: "Paid", count: orders.filter(o => isOrderInSession(o) && o.status === "paid" && !o.voidedAt).length },
          { id: "cancelled", label: "Cancelled / Voided", count: orders.filter(o => isOrderInSession(o) && (o.status === "cancelled" || !!o.voidedAt)).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id as any)}
            className={cn(
              "relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5",
              statusTab === tab.id
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-850 dark:text-stone-400 dark:hover:text-stone-200"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-1.5 py-0.25 rounded-md text-[9px] font-extrabold",
              statusTab === tab.id
                ? "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                : "bg-stone-200/60 text-stone-500 dark:bg-stone-800/80 dark:text-stone-400"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800 text-stone-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Table / Mode</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-3 text-stone-400">
                      <Package className="size-10" />
                      <p className="font-semibold italic">No orders found for this session.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const table = tables.find((t) => t.id === order.tableId);
                  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
                  
                  const isVoided = !!order.voidedAt;
                  const hasRefunds = order.refunds && order.refunds.length > 0;
                  
                  const kStatus = order.kitchenStatus || (order.status === "paid" ? "PAID" : order.status === "cancelled" ? "CANCELLED" : "PENDING");
                  let statusCfg = KITCHEN_STATUS_CONFIG[kStatus as keyof typeof KITCHEN_STATUS_CONFIG] || KITCHEN_STATUS_CONFIG.PENDING;
                  
                  if (isVoided) {
                    const isRefundVoid = order.voidReason?.startsWith("Refunded:") || hasRefunds;
                    if (isRefundVoid) {
                      statusCfg = { label: "Refunded", icon: RefreshCcw, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" };
                    } else {
                      statusCfg = { label: "Voided", icon: XCircle, cls: "bg-red-500/10 text-red-500 border border-red-500/20" };
                    }
                  } else if (hasRefunds) {
                    statusCfg = { label: "Partially Refunded", icon: RefreshCcw, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" };
                  }
                  
                  const StatusIcon = statusCfg.icon;

                  return (
                    <tr key={order.id} className={cn(
                      "hover:bg-stone-50/60 dark:hover:bg-stone-900/40 transition-colors",
                      isVoided && "opacity-60"
                    )}>
                      <td className="px-6 py-4 font-mono font-bold text-stone-800 dark:text-stone-200 text-sm">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        {table ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-primary text-sm">
                            <MapPin className="size-3.5" />{table.tableNumber}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic text-sm">Takeaway</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-stone-500 text-sm">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300 text-sm">
                          <Package className="size-3.5 text-stone-400" />{itemCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-stone-900 dark:text-white text-sm">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          statusCfg.cls
                        )}>
                          <StatusIcon className="size-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-xs transition-colors"
                          >
                            <Eye className="size-3" /> View
                          </button>

                          {order.status === "draft" && (
                            <>
                              <button
                                onClick={() => { editDraftOrder(order.id); router.push("/terminal/order"); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs transition-colors"
                              >
                                <Pencil className="size-3" /> Edit
                              </button>
                              <button
                              onClick={async () => { if (await confirm({ title: "Cancel Order", message: `Are you sure you want to cancel order ${order.orderNumber}? This cannot be undone.`, confirmLabel: "Cancel Order", cancelLabel: "Keep Draft", variant: "danger" })) cancelDraftOrder(order.id); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
                              >
                                <Trash2 className="size-3" /> Cancel
                              </button>
                            </>
                          )}

                          {order.status === "paid" && (
                            <>
                              <button
                                onClick={() => openReceipt(order)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-xs transition-colors"
                              >
                                <Receipt className="size-3" /> Receipt
                              </button>
                              {isManager && !order.voidedAt && (
                                <button
                                  onClick={() => setRefundingOrder(order)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl font-bold text-xs transition-colors"
                                >
                                  <RefreshCcw className="size-3" /> Refund / Void
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Order Details ── */}
      {viewingOrder && (
        <DialogModal
          isOpen={!!viewingOrder}
          onClose={() => setViewingOrder(null)}
          title="Order Details"
          description={`${viewingOrder.orderNumber} · Status: ${viewingOrder.status.toUpperCase()}`}
          icon={<ClipboardList className="size-5" />}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2">
              <p className="text-xs font-bold uppercase text-stone-400 mb-3">Cart Items</p>
              {viewingOrder.items.map((it) => {
                const mods = it.selectedModifiers as any[];
                return (
                  <div key={it.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-stone-800 dark:text-stone-200">
                        {it.name}
                        {mods && mods.length > 0 && (
                          <span className="text-[10px] text-primary dark:text-primary/70 font-semibold block mt-0.5">
                            + {mods.map((m: any) => m.name).join(", ")}
                          </span>
                        )}
                        {it.notes && (
                          <span className="text-[10px] text-stone-400 block mt-0.5 italic">
                            &ldquo;{it.notes}&rdquo;
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-450 mt-1">₹{it.unitPrice.toFixed(2)} × {it.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-stone-700 dark:text-stone-300">₹{it.total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5 text-sm px-1">
              <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>₹{viewingOrder.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-stone-500"><span>Taxes</span><span>₹{viewingOrder.tax.toFixed(2)}</span></div>
              {viewingOrder.discounts > 0 && (
                <div className="flex justify-between text-red-500 font-semibold"><span>Discounts</span><span>-₹{viewingOrder.discounts.toFixed(2)}</span></div>
              )}
              {viewingOrder.voidedAt && (
                <div className="flex justify-between text-red-500 font-black">
                  <span>{viewingOrder.voidReason?.startsWith("Refunded:") ? "FULLY REFUNDED" : "VOIDED"}</span>
                  <span>-₹{viewingOrder.total.toFixed(2)}</span>
                </div>
              )}
              {viewingOrder.refunds && viewingOrder.refunds.length > 0 && !viewingOrder.voidedAt && (
                <div className="flex justify-between text-red-500 font-semibold">
                  <span>Total Refunded</span>
                  <span>-₹{viewingOrder.refunds.reduce((sum: number, r: any) => sum + r.amount, 0).toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-stone-200 dark:bg-stone-800 my-2" />
              <div className="flex justify-between font-black text-base">
                <span className="text-stone-800 dark:text-stone-100">Order Total</span>
                <span className={cn("text-primary", viewingOrder.voidedAt && "line-through text-stone-400")}>
                  ₹{viewingOrder.total.toFixed(2)}
                </span>
              </div>
              {viewingOrder.refunds && viewingOrder.refunds.length > 0 && !viewingOrder.voidedAt && (
                <div className="flex justify-between font-bold text-amber-600 dark:text-amber-500">
                  <span>Net Paid</span>
                  <span>₹{(viewingOrder.total - viewingOrder.refunds.reduce((sum: number, r: any) => sum + r.amount, 0)).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Refund history list */}
            {viewingOrder.refunds && viewingOrder.refunds.length > 0 && (
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
                <p className="text-xs font-bold uppercase text-stone-400 mb-2">Refund & Adjustment History</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {viewingOrder.refunds.map((ref: any, idx: number) => (
                    <div key={ref.id || idx} className="text-xs border-b border-stone-100 dark:border-stone-850 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between font-bold">
                        <span className="text-stone-700 dark:text-stone-300">
                          {ref.reason} ({ref.refundMethod})
                        </span>
                        <span className="text-red-500 font-mono">-₹{ref.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-stone-450 mt-0.5">
                        Issued on {new Date(ref.createdAt).toLocaleString()}
                      </p>
                      {ref.notes && (
                        <p className="text-[10px] text-stone-400 mt-1 italic">
                          &ldquo;{ref.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setViewingOrder(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold rounded-xl shadow transition-colors"
            >
              Close
            </button>
          </div>
        </DialogModal>
      )}

      {/* ── Modal: Receipt ── */}
      {receiptOrder && (
        <DialogModal
          isOpen={showReceiptModal}
          onClose={() => { setShowReceiptModal(false); setReceiptOrder(null); }}
          title="Order Receipt"
          description={`${receiptOrder.orderNumber} · ${new Date(receiptOrder.createdAt).toLocaleString()}`}
          icon={<Receipt className="size-5" />}
          size="md"
        >
          <div className="space-y-5">
            {/* Receipt preview */}
            <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl font-mono text-[11px] leading-relaxed space-y-3 max-h-80 overflow-y-auto">
              <div className="text-center space-y-0.5">
                <h4 className="font-black text-xs uppercase">OrderHub</h4>
                <p className="text-stone-500">Ground Floor, Main Block · +1 555 CAFE</p>
                <p className="text-stone-400 text-[9px]">--- TAX INVOICE ---</p>
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700" />
              <div className="space-y-0.5 text-stone-600 dark:text-stone-400">
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Order:</span> {receiptOrder.orderNumber}</p>
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Date:</span> {new Date(receiptOrder.createdAt).toLocaleString()}</p>
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Cashier:</span> {currentUser.name}</p>
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Guest:</span> {receiptOrder.customerId ? customers.find((c) => c.id === receiptOrder.customerId)?.name ?? "—" : "Walk-in"}</p>
                <p><span className="font-bold text-stone-800 dark:text-stone-200">Table:</span> {receiptOrder.tableId ? tables.find((t) => t.id === receiptOrder.tableId)?.tableNumber : "Takeaway"}</p>
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700" />
              <div className="grid grid-cols-12 font-bold">
                <span className="col-span-6">Item</span><span className="col-span-2 text-center">Qty</span><span className="col-span-4 text-right">Price</span>
              </div>
              {receiptOrder.items.map((item) => {
                const mods = item.selectedModifiers as any[];
                const modsText = mods && mods.length > 0 ? ` [${mods.map((m: any) => m.name).join(", ")}]` : "";
                return (
                  <div key={item.id} className="grid grid-cols-12">
                    <span className="col-span-6 truncate" title={`${item.name}${modsText}`}>{item.name}{modsText}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-4 text-right">₹{item.total.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700" />
              <div className="text-right space-y-0.5">
                <p>Subtotal: ₹{receiptOrder.subtotal.toFixed(2)}</p>
                <p>Taxes: ₹{receiptOrder.tax.toFixed(2)}</p>
                {receiptOrder.discounts > 0 && <p>Discounts: -₹{receiptOrder.discounts.toFixed(2)}</p>}
                <p className="font-black text-xs pt-1 border-t border-dashed border-stone-300 dark:border-stone-700">TOTAL: ₹{receiptOrder.total.toFixed(2)}</p>
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700 pt-2 text-center text-[10px] text-stone-400 uppercase tracking-widest">
                <p>Payment: {paymentMethods.find((p) => p.id === receiptOrder.paymentMethodId)?.name || "Cash"}</p>
                <p className="mt-1 font-bold">THANK YOU FOR YOUR VISIT!</p>
              </div>
            </div>

            {/* Print */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (receiptOrder) {
                    printOrder(receiptOrder, false);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow transition-colors dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                <Printer className="size-4" /> Print Receipt
              </button>
              <button
                onClick={() => {
                  if (!receiptOrder) return;
                  downloadReceiptPDF({
                    orderNumber: receiptOrder.orderNumber, createdAt: receiptOrder.createdAt,
                    cashierName: currentUser.name,
                    guestName: receiptOrder.customerId ? (customers.find((c) => c.id === receiptOrder.customerId)?.name ?? "Guest") : "Walk-in",
                    tableNumber: receiptOrder.tableId ? (tables.find((t) => t.id === receiptOrder.tableId)?.tableNumber ?? "—") : "Takeaway",
                    items: receiptOrder.items.map((it) => {
                      const modsList = it.selectedModifiers && (it.selectedModifiers as any).length > 0
                        ? ` [${(it.selectedModifiers as any).map((m: any) => m.name).join(", ")}]`
                        : "";
                      return {
                        name: `${it.name}${modsList}`,
                        quantity: it.quantity,
                        total: it.total
                      };
                    }),
                    subtotal: receiptOrder.subtotal, tax: receiptOrder.tax, discounts: receiptOrder.discounts, total: receiptOrder.total,
                    paymentMethod: paymentMethods.find((p) => p.id === receiptOrder.paymentMethodId)?.name ?? "Cash",
                    paymentReference: receiptOrder.paymentReference ?? undefined,
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors"
              >
                <FileText className="size-4" /> Print PDF
              </button>
            </div>

            {/* Email */}
            <form onSubmit={handleEmailReceipt} className="space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4">
              <label className="block text-xs font-bold uppercase text-stone-400 tracking-wider">Email Receipt</label>
              <div className="flex gap-2">
                <input type="email" required value={receiptEmailInput} onChange={(e) => setReceiptEmailInput(e.target.value)} placeholder="guest@email.com" className="flex-1 px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                <button type="submit" disabled={emailSentStatus} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow disabled:opacity-50 shrink-0 transition-all">
                  <Send className="size-3.5" />{emailSentStatus ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </DialogModal>
      )}

      {refundingOrder && (
        <RefundDialog
          isOpen={!!refundingOrder}
          onClose={() => setRefundingOrder(null)}
          order={refundingOrder}
        />
      )}
    </section>
  );
}

export default function OrdersLogPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrdersLogContent />
    </Suspense>
  );
}

"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Order, Customer } from "@/app/context/AppContext";

function OrdersLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser,
    orders,
    activeSession,
    customers,
    tables,
    paymentMethods,
    cancelDraftOrder,
    editDraftOrder
  } = useApp();

  // Search input from layout query params
  const orderSearch = searchParams.get("search") || "";

  // Details Modal
  const [viewingOrderDetails, setViewingOrderDetails] = useState<Order | null>(null);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptEmailInput, setReceiptEmailInput] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);

  if (!activeSession || !currentUser) return null;

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (o.sessionId !== activeSession.id) return false;
    const cust = customers.find(c => c.id === o.customerId);
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchesSearch;
  });

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
    <section className="flex-1 p-6 max-w-5xl mx-auto space-y-6 animate-fade-in text-xs text-stone-850 dark:text-stone-200">
      <div>
        <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Current Shift Orders Log</h2>
        <p className="text-sm text-stone-500">Review, print receipts, or edit draft orders for the active session.</p>
      </div>

      {/* Orders table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-150 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Table / Mode</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Cart Qty</th>
                <th className="px-6 py-4">Total Paid</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-stone-400 italic">
                    No orders matching search query found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const table = tables.find((t) => t.id === order.tableId);
                  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-stone-800 dark:text-stone-200">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        {table ? (
                          <span className="font-bold text-amber-600 dark:text-amber-500">
                            {table.tableNumber}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Takeaway</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-stone-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-stone-700 dark:text-stone-300">
                        {itemsCount} items
                      </td>
                      <td className="px-6 py-4 font-black text-stone-850 dark:text-white">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          order.status === "paid"
                            ? "bg-green-500/10 text-success"
                            : order.status === "cancelled"
                            ? "bg-red-500/10 text-danger"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setViewingOrderDetails(order)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg text-[11px] font-bold text-stone-600 dark:text-stone-300 transition-colors"
                        >
                          Details
                        </button>

                        {order.status === "draft" && (
                          <>
                            <button
                              onClick={() => {
                                editDraftOrder(order.id);
                                router.push("/terminal/order");
                              }}
                              className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Cancel draft order ${order.orderNumber}?`)) {
                                  cancelDraftOrder(order.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded-lg text-[11px] font-bold transition-colors"
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
                            className="px-2.5 py-1 border border-stone-205 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-lg text-[11px] font-bold text-stone-600 dark:text-stone-300 transition-all"
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

      {/* VIEW ORDER ITEMS MODAL (From Order history view) */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-xs text-[#1c1917] dark:text-[#f5f5f4]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
              <div>
                <h3 className="font-extrabold text-stone-805 dark:text-stone-100 text-sm">Order Details Summary</h3>
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
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-center shadow"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PRINTING & EMAIL MODAL */}
      {showReceiptModal && receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-[#1c1917] dark:text-[#f5f5f4]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm">Receipt Generated</h3>
              <button onClick={() => { setShowReceiptModal(false); setReceiptOrder(null); }} className="text-stone-400 hover:text-stone-800 text-lg">×</button>
            </div>

            {/* Receipt Preview Container */}
            <div className="my-4 p-4 rounded-xl receipt-paper max-h-96 overflow-y-auto text-[10px] font-mono leading-tight border border-stone-200 bg-stone-50 dark:bg-stone-950 dark:border-stone-850">
              <div className="text-center space-y-1 mb-4">
                <h4 className="font-black text-xs uppercase">Odoo Cafe POS</h4>
                <p>Ground Floor, Main Block</p>
                <p>Phone: +1 555 CAFE</p>
                <p className="text-[8px] text-stone-450">--- TAX INVOICE ---</p>
              </div>

              <div className="space-y-1 mb-3 text-[9px] border-b border-dashed border-stone-300 dark:border-stone-700 pb-2">
                <p><span className="font-bold">Order:</span> {receiptOrder.orderNumber}</p>
                <p><span className="font-bold">Date:</span> {new Date(receiptOrder.createdAt).toLocaleString()}</p>
                <p><span className="font-bold">Cashier:</span> {currentUser.name}</p>
                <p><span className="font-bold">Guest:</span> {receiptOrder.customerId ? customers.find(c => c.id === receiptOrder.customerId)?.name : "Walk-in"}</p>
                <p><span className="font-bold">Table:</span> {receiptOrder.tableId ? tables.find(t => t.id === receiptOrder.tableId)?.tableNumber : "Takeaway"}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-b border-dashed border-stone-300 dark:border-stone-700 pb-2 mb-3">
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
                {receiptOrder.discounts > 0 && <p className="text-stone-500 font-bold">Discounts: -${receiptOrder.discounts.toFixed(2)}</p>}
                <p className="font-black text-xs pt-1 border-t border-dashed border-stone-300 dark:border-stone-700">TOTAL: ${receiptOrder.total.toFixed(2)}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-dashed border-stone-300 dark:border-stone-700 text-center text-[8px] text-stone-550">
                <p>Payment Mode: {paymentMethods.find(p => p.id === receiptOrder.paymentMethodId)?.name || "Cash"}</p>
                <p>{receiptOrder.paymentReference}</p>
                <p className="mt-2 font-bold text-stone-700 dark:text-stone-350">THANK YOU FOR YOUR VISIT!</p>
              </div>
            </div>

            {/* Print and Email Actions */}
            <div className="space-y-3 mt-4 text-xs">
              <button
                onClick={() => {
                  alert("Executing Print Spooler Connection...\nReceipt printed successfully!");
                }}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
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
                    className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none text-stone-850 dark:text-stone-150 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors"
                  >
                    Send
                  </button>
                </div>
                {emailSentStatus && <p className="text-[10px] text-success">Sending mail request...</p>}
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function OrdersLogPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-100 dark:bg-stone-955 text-center space-y-4">
        <span className="text-xl text-stone-550 dark:text-stone-400">Loading Orders Log...</span>
      </div>
    }>
      <OrdersLogContent />
    </Suspense>
  );
}

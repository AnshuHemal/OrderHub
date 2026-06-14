"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  TrendingUp,
  Coins,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Printer,
  Calendar,
  User,
  Activity,
  ArrowRight,
  ReceiptCent
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

interface ZReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZReportDialog({ isOpen, onClose }: ZReportDialogProps) {
  const { activeSession, closeSession, orders } = useApp();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState("");
  const [zReportResult, setZReportResult] = useState<any | null>(null);

  // Live calculations of expected totals based on active session
  const stats = useMemo(() => {
    if (!activeSession) return null;

    // Filter paid, non-voided orders belonging to activeSession
    const sessionOrders = orders.filter(
      (o) => o.sessionId === activeSession.id && o.status === "paid" && !o.voidedAt
    );

    let cashSales = 0;
    let cardSales = 0;
    let upiSales = 0;
    let walletSales = 0;
    let totalSales = 0;
    let totalDiscount = 0;

    let cashRefunds = 0;
    let cardRefunds = 0;
    let storeCreditRefunds = 0;
    let totalRefunds = 0;

    sessionOrders.forEach((o) => {
      totalSales += o.total;
      totalDiscount += o.discounts || 0;

      // Map paymentMethodId to totals (1=CASH, 2=CARD, 3=UPI/Wallet/Other)
      if (o.paymentMethodId === 1) {
        cashSales += o.total;
      } else if (o.paymentMethodId === 2) {
        cardSales += o.total;
      } else {
        upiSales += o.total; // Default/UPI
      }

      if (o.refunds && o.refunds.length > 0) {
        o.refunds.forEach((r) => {
          totalRefunds += r.amount;
          if (r.refundMethod === "CASH") cashRefunds += r.amount;
          else if (r.refundMethod === "CARD") cardRefunds += r.amount;
          else storeCreditRefunds += r.amount;
        });
      }
    });

    const expectedCash = activeSession.openingBalance + cashSales - cashRefunds;

    return {
      cashSales,
      cardSales,
      upiSales,
      walletSales,
      totalSales,
      totalDiscount,
      cashRefunds,
      cardRefunds,
      storeCreditRefunds,
      totalRefunds,
      expectedCash,
      ordersCount: sessionOrders.length,
    };
  }, [activeSession, orders]);

  const countedCash = parseFloat(countedCashInput) || 0;
  const expectedCash = stats?.expectedCash || 0;
  const discrepancy = countedCash - expectedCash;

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !stats) return;
    if (countedCashInput.trim() === "") {
      toastError("Verification Needed", "Please enter the counted cash amount in the drawer.");
      return;
    }

    setLoading(true);
    try {
      const result = await closeSession(countedCash);
      success("Shift Reconciled", "The shift has been closed and Z-Report successfully archived.");
      if (result && result.zReportData) {
        setZReportResult(result.zReportData);
      } else {
        // Fallback layout in case backend data shape was raw
        setZReportResult({
          sessionId: activeSession.id,
          cashierName: activeSession.openedBy,
          openedAt: activeSession.openedAt,
          closedAt: new Date().toISOString(),
          openingBalance: activeSession.openingBalance,
          expectedCash: stats.expectedCash,
          countedCash: countedCash,
          discrepancy: discrepancy,
          salesCount: stats.ordersCount,
          salesBreakdown: {
            cash: stats.cashSales,
            card: stats.cardSales,
            upi: stats.upiSales,
            wallet: stats.walletSales,
            total: stats.totalSales,
          },
          discountsTotal: stats.totalDiscount,
          refundsTotal: stats.totalRefunds,
          refundsBreakdown: {
            cash: stats.cashRefunds,
            card: stats.cardRefunds,
            storeCredit: stats.storeCreditRefunds,
          },
        });
      }
    } catch (err: any) {
      console.error(err);
      toastError("Reconciliation Failed", err.message || "An error occurred closing the session.");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfDownload = () => {
    if (!zReportResult) return;
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Top red border primary accent
      doc.setFillColor(239, 68, 68);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 5, "F");

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(28, 25, 23);
      doc.text("POS SHIFT RECONCILIATION Z-REPORT", 15, 20);

      // Metadata block
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 113, 108);
      doc.text(`Session ID: ${zReportResult.sessionId}`, 15, 28);
      doc.text(`Cashier: ${zReportResult.cashierName}`, 15, 33);
      doc.text(`Shift Opened: ${new Date(zReportResult.openedAt).toLocaleString()}`, 15, 38);
      doc.text(`Shift Closed: ${new Date(zReportResult.closedAt).toLocaleString()}`, 15, 43);

      // Draw rule line
      doc.setDrawColor(231, 229, 228);
      doc.setLineWidth(0.4);
      doc.line(15, 47, 195, 47);

      // Drawer reconciliation table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(28, 25, 23);
      doc.text("1. Cash Drawer Reconciliation Summary", 15, 55);

      // Table headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setFillColor(245, 245, 244);
      doc.rect(15, 60, 180, 8, "F");
      doc.rect(15, 60, 180, 8, "S");
      doc.setTextColor(68, 64, 60);
      doc.text("Metric Description", 18, 65.5);
      doc.text("Amount (INR)", 192, 65.5, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const rows = [
        ["Opening Float Balance", `INR ${zReportResult.openingBalance.toFixed(2)}`],
        ["Expected Cash Sales", `INR ${zReportResult.salesBreakdown.cash.toFixed(2)}`],
        ["Expected Cash Refunds (deducted)", `- INR ${zReportResult.refundsBreakdown.cash.toFixed(2)}`],
        ["Expected Cash in Drawer", `INR ${zReportResult.expectedCash.toFixed(2)}`],
        ["Actual Cash Counted in Drawer", `INR ${zReportResult.countedCash.toFixed(2)}`],
      ];

      let y = 68;
      rows.forEach((row, idx) => {
        if (idx === 3 || idx === 4) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.rect(15, y, 180, 8, "S");
        doc.text(row[0], 18, y + 5.5);
        doc.text(row[1], 192, y + 5.5, { align: "right" });
        y += 8;
      });

      // Discrepancy Box
      y += 2;
      const disc = zReportResult.discrepancy;
      doc.setFillColor(disc < 0 ? 254 : 240, disc < 0 ? 242 : 253, disc < 0 ? 242 : 250);
      doc.rect(15, y, 180, 10, "F");
      doc.setDrawColor(disc < 0 ? 252 : 220, disc < 0 ? 165 : 252, disc < 0 ? 165 : 231);
      doc.rect(15, y, 180, 10, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(disc < 0 ? 185 : 21, disc < 0 ? 28 : 128, disc < 0 ? 28 : 61);
      doc.text("DRAWER DISCREPANCY VARIANCE STATUS:", 18, y + 6.5);
      const statusStr = disc === 0
        ? "BALANCED (INR 0.00)"
        : disc < 0
          ? `SHORTAGE (- INR ${Math.abs(disc).toFixed(2)})`
          : `SURPLUS (+ INR ${disc.toFixed(2)})`;
      doc.text(statusStr, 192, y + 6.5, { align: "right" });

      // Sales Breakdown
      y += 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(28, 25, 23);
      doc.text("2. Shift Sales Breakdown by Payment Method", 15, y);

      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setFillColor(245, 245, 244);
      doc.rect(15, y, 180, 8, "F");
      doc.rect(15, y, 180, 8, "S");
      doc.setTextColor(68, 64, 60);
      doc.text("Payment Method", 18, y + 5.5);
      doc.text("Amount (INR)", 192, y + 5.5, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const salesRows = [
        ["Cash Payments", `INR ${zReportResult.salesBreakdown.cash.toFixed(2)}`],
        ["Credit / Debit Card Payments", `INR ${zReportResult.salesBreakdown.card.toFixed(2)}`],
        ["UPI / QR Payments", `INR ${zReportResult.salesBreakdown.upi.toFixed(2)}`],
        ["Digital Wallet / Other Payments", `INR ${zReportResult.salesBreakdown.wallet.toFixed(2)}`],
        ["Gross Shift Sales (net total)", `INR ${zReportResult.salesBreakdown.total.toFixed(2)}`],
      ];

      y += 8;
      salesRows.forEach((row, idx) => {
        if (idx === 4) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.rect(15, y, 180, 8, "S");
        doc.text(row[0], 18, y + 5.5);
        doc.text(row[1], 192, y + 5.5, { align: "right" });
        y += 8;
      });

      // Audit info
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("3. Shift Volume & Adjustment Audits", 15, y);

      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const auditRows = [
        ["Total Shift Orders Processed", `${zReportResult.salesCount} tickets`],
        ["Total Discounts Deducted", `INR ${zReportResult.discountsTotal.toFixed(2)}`],
        ["Total Refunded Amount", `INR ${zReportResult.refundsTotal.toFixed(2)}`],
      ];

      auditRows.forEach((row) => {
        doc.rect(15, y, 180, 8, "S");
        doc.text(row[0], 18, y + 5.5);
        doc.text(row[1], 192, y + 5.5, { align: "right" });
        y += 8;
      });

      // Footer
      y += 15;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text("Compliance Notice: This report represents a final, database-locked snapshot of POS shift transactions.", 15, y);
      doc.text(`Generated by cashier ${zReportResult.cashierName} on ${new Date().toLocaleString()}. Approved for auditing.`, 15, y + 4);

      doc.save(`Z_Report_Session_${zReportResult.sessionId.substring(0, 8).toUpperCase()}.pdf`);
      success("Report Downloaded", "Z-Report PDF file has been downloaded successfully.");
    } catch (err) {
      console.error(err);
      toastError("Export Failed", "Could not compile PDF format.");
    }
  };

  const resetDialog = () => {
    setCountedCashInput("");
    setZReportResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={zReportResult ? resetDialog : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Dialog container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100vh-80px)] overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!zReportResult ? (
            <motion.form
              key="reconcile-screen"
              onSubmit={handleCloseShift}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col overflow-hidden max-h-[calc(100vh-80px)]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Coins className="size-5 text-red-500" />
                    Shift Reconciliation (EOD)
                  </h3>
                  {activeSession && (
                    <p className="text-xs text-stone-400 mt-1">
                      Session: <span className="font-mono font-bold text-stone-600 dark:text-stone-300">{activeSession.id.substring(0, 8).toUpperCase()}</span> · Active since {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-850 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Sales Breakdown Panel */}
                <div className="bg-stone-50/50 dark:bg-stone-950/20 border border-stone-150 dark:border-stone-850 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="size-3.5" />
                    Expected Totals Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-stone-600 dark:text-stone-400">
                    <div className="flex justify-between">
                      <span>Opening Float:</span>
                      <span className="text-stone-800 dark:text-stone-200">₹{activeSession?.openingBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Sales:</span>
                      <span className="text-emerald-500 font-extrabold">+₹{stats?.cashSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Card Sales:</span>
                      <span className="text-stone-800 dark:text-stone-200">₹{stats?.cardSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Refunds:</span>
                      <span className="text-red-500 font-extrabold">-₹{stats?.cashRefunds.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UPI/Other Sales:</span>
                      <span className="text-stone-800 dark:text-stone-200">₹{stats?.upiSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span className="text-stone-800 dark:text-stone-200">{stats?.ordersCount} bills</span>
                    </div>
                  </div>
                  <div className="h-px bg-stone-200/50 dark:bg-stone-800/50 my-1" />
                  <div className="flex justify-between items-center text-sm font-black">
                    <span className="text-stone-800 dark:text-stone-200">Expected Cash In Drawer:</span>
                    <span className="text-stone-950 dark:text-white text-lg">₹{expectedCash.toFixed(2)}</span>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-xs uppercase tracking-wider">
                      Counted Cash in Drawer (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={countedCashInput}
                      onChange={(e) => setCountedCashInput(e.target.value)}
                      placeholder="Count and enter actual cash amount..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold"
                      required
                    />
                  </div>

                  {/* Discrepancy Indicator Card */}
                  {countedCashInput.trim() !== "" && (
                    <div
                      className={cn(
                        "p-4 border rounded-2xl flex justify-between items-center transition-all",
                        discrepancy === 0
                          ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : discrepancy < 0
                            ? "bg-red-500/5 border-red-500/10 text-red-500"
                            : "bg-amber-500/5 border-amber-500/10 text-amber-500"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {discrepancy === 0 ? (
                          <CheckCircle className="size-5 shrink-0" />
                        ) : (
                          <AlertTriangle className="size-5 shrink-0" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {discrepancy === 0
                            ? "Drawer is Balanced"
                            : discrepancy < 0
                              ? "Drawer Shortage"
                              : "Drawer Surplus"}
                        </span>
                      </div>
                      <span className="text-lg font-black font-mono">
                        {discrepancy === 0
                          ? "₹0.00"
                          : discrepancy < 0
                            ? `-₹${Math.abs(discrepancy).toFixed(2)}`
                            : `+₹${discrepancy.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3 bg-stone-50/50 dark:bg-stone-950/20 shrink-0">
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
                    <>
                      Close Shift & Lock
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col p-6 space-y-5 text-center items-center"
            >
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                <CheckCircle className="size-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-stone-950 dark:text-white">
                  Shift Reconciled Successfully!
                </h3>
                <p className="text-xs text-stone-450">
                  Drawer floats locked. The shift report has been archived to the database ledger.
                </p>
              </div>

              {/* Printable receipt container summary */}
              <div className="w-full text-left bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-850 rounded-2xl p-4 font-mono text-xs text-stone-700 dark:text-stone-300 space-y-1">
                <div className="flex justify-between border-b border-dashed border-stone-300 dark:border-stone-800 pb-1.5 mb-1.5 font-bold">
                  <span>SHIFT Z-REPORT SUMMARY</span>
                  <span className="text-red-500 font-bold">LOCKED</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier Name:</span>
                  <span className="font-bold">{zReportResult.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orders Settled:</span>
                  <span>{zReportResult.salesCount} bills</span>
                </div>
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>₹{zReportResult.openingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales:</span>
                  <span>₹{zReportResult.salesBreakdown.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Refunds:</span>
                  <span>-₹{zReportResult.refundsBreakdown.cash.toFixed(2)}</span>
                </div>
                <div className="h-px bg-dashed border-t border-stone-300 dark:border-stone-800 my-1" />
                <div className="flex justify-between font-bold">
                  <span>Expected Cash:</span>
                  <span>₹{zReportResult.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Counted Cash:</span>
                  <span>₹{zReportResult.countedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Discrepancy:</span>
                  <span
                    className={
                      zReportResult.discrepancy === 0
                        ? "text-emerald-500"
                        : zReportResult.discrepancy < 0
                          ? "text-red-500"
                          : "text-amber-500"
                    }
                  >
                    {zReportResult.discrepancy === 0
                      ? "₹0.00 (BALANCED)"
                      : zReportResult.discrepancy < 0
                        ? `-₹${Math.abs(zReportResult.discrepancy).toFixed(2)} (SHORT)`
                        : `+₹${zReportResult.discrepancy.toFixed(2)} (SURPLUS)`}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={handlePdfDownload}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <FileText className="size-4 text-stone-500" />
                  Download PDF
                </button>
                <button
                  onClick={resetDialog}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

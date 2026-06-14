"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Search,
  Calendar,
  User,
  Coins,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Download
} from "lucide-react";
import { useApp, type PosSession } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

export default function ShiftReportsPage() {
  const { sessionsList } = useApp();
  const { success, error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessionsList.filter((sess) => {
    const cashierName = sess.openedBy.toLowerCase();
    const query = searchQuery.toLowerCase();
    return cashierName.includes(query) || sess.id.toLowerCase().includes(query);
  });

  const handlePdfDownload = (session: PosSession) => {
    if (!session.zReportData) {
      toastError("No Data Available", "This session was closed without generating Z-Report compliance details.");
      return;
    }
    
    const report = session.zReportData;
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
      doc.text(`Session ID: ${report.sessionId}`, 15, 28);
      doc.text(`Cashier: ${report.cashierName}`, 15, 33);
      doc.text(`Shift Opened: ${new Date(report.openedAt).toLocaleString()}`, 15, 38);
      doc.text(`Shift Closed: ${new Date(report.closedAt).toLocaleString()}`, 15, 43);

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
        ["Opening Float Balance", `INR ${report.openingBalance.toFixed(2)}`],
        ["Expected Cash Sales", `INR ${report.salesBreakdown.cash.toFixed(2)}`],
        ["Expected Cash Refunds (deducted)", `- INR ${report.refundsBreakdown.cash.toFixed(2)}`],
        ["Expected Cash in Drawer", `INR ${report.expectedCash.toFixed(2)}`],
        ["Actual Cash Counted in Drawer", `INR ${report.countedCash.toFixed(2)}`],
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
      const disc = report.discrepancy;
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
        ["Cash Payments", `INR ${report.salesBreakdown.cash.toFixed(2)}`],
        ["Credit / Debit Card Payments", `INR ${report.salesBreakdown.card.toFixed(2)}`],
        ["UPI / QR Payments", `INR ${report.salesBreakdown.upi.toFixed(2)}`],
        ["Digital Wallet / Other Payments", `INR ${report.salesBreakdown.wallet.toFixed(2)}`],
        ["Gross Shift Sales (net total)", `INR ${report.salesBreakdown.total.toFixed(2)}`],
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
        ["Total Shift Orders Processed", `${report.salesCount} tickets`],
        ["Total Discounts Deducted", `INR ${report.discountsTotal.toFixed(2)}`],
        ["Total Refunded Amount", `INR ${report.refundsTotal.toFixed(2)}`],
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
      doc.text(`Generated by cashier ${report.cashierName} on ${new Date().toLocaleString()}. Approved for auditing.`, 15, y + 4);

      doc.save(`Z_Report_Session_${report.sessionId.substring(0, 8).toUpperCase()}.pdf`);
      success("Z-Report Compiled", "PDF generated and downloaded successfully.");
    } catch (err) {
      console.error(err);
      toastError("Export Failed", "Error compiling PDF document.");
    }
  };

  return (
    <div className="space-y-6 text-sm text-stone-850 dark:text-stone-200">
      {/* Page Title & Desc */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white font-sans tracking-tight">
            Shift Reports & EOD Logs
          </h2>
          <p className="mt-1 text-stone-500">
            View historical cashier shifts, verify cash drawer floats, audit discrepancies, and export Z-Reports.
          </p>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Cashier or Session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-stone-400 font-medium"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-950/40 border-b border-stone-150 dark:border-stone-800 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <th className="px-6 py-4">Session ID</th>
                <th className="px-6 py-4">Cashier</th>
                <th className="px-6 py-4">Opened</th>
                <th className="px-6 py-4">Closed</th>
                <th className="px-6 py-4 text-right">Expected Drawer</th>
                <th className="px-6 py-4 text-right">Counted Cash</th>
                <th className="px-6 py-4 text-right">Discrepancy</th>
                <th className="px-6 py-4 text-center">Z-Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-stone-400 font-medium italic">
                    No matching shift sessions found.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const isClosed = sess.status === "CLOSED" || sess.closedAt !== null;
                  const variance = sess.discrepancy ?? 0;

                  return (
                    <tr
                      key={sess.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-850/10 transition-colors"
                    >
                      <td className="px-6 py-4.5 font-mono text-xs font-bold text-stone-700 dark:text-stone-300">
                        {sess.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4.5 font-bold">
                        {sess.user?.name || sess.openedBy}
                      </td>
                      <td className="px-6 py-4.5 text-xs text-stone-500">
                        {new Date(sess.openedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4.5 text-xs">
                        {isClosed ? (
                          <span className="text-stone-500">
                            {new Date(sess.closedAt!).toLocaleString()}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right font-bold font-mono">
                        {isClosed && sess.closingFloat !== null ? (
                          `₹${sess.closingFloat.toFixed(2)}`
                        ) : (
                          <span className="text-stone-400 italic font-normal text-xs">Calculated at close</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right font-bold font-mono">
                        {isClosed && sess.countedCash !== null ? (
                          `₹${sess.countedCash.toFixed(2)}`
                        ) : (
                          <span className="text-stone-400 italic font-normal text-xs">Open drawer</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right font-mono">
                        {isClosed ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md font-bold text-xs",
                              variance === 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : variance < 0
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-amber-500/10 text-amber-500"
                            )}
                          >
                            {variance === 0
                              ? "₹0.00"
                              : variance < 0
                                ? `-₹${Math.abs(variance).toFixed(2)}`
                                : `+₹${variance.toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        {isClosed && sess.zReportData ? (
                          <button
                            onClick={() => handlePdfDownload(sess)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-850 font-bold text-xs text-stone-600 dark:text-stone-300 transition-colors"
                            title="Download Z-Report PDF"
                          >
                            <Download className="size-3.5" />
                            PDF
                          </button>
                        ) : (
                          <span className="text-stone-400 italic text-xs">No report</span>
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
    </div>
  );
}

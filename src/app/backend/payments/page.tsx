"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Banknote, CreditCard, Smartphone,
  Check, X, Pencil, ShieldCheck, Info,
  Printer, Network, Usb, FileText, SlidersHorizontal, RefreshCw
} from "lucide-react";
import { useApp, type PaymentMethod, type PrinterConfig, type PrinterSettings, type Order } from "@/app/context/AppContext";
import { UpiQrPreview } from "@/components/shared/upi-qr";
import { isValidUpiId } from "@/lib/upi";
import { cn } from "@/lib/utils";

// ── Icons & copy per payment type ─────────────────────────────────────────────

const TYPE_META: Record<
  string,
  { icon: React.ReactNode; label: string; description: string; color: string }
> = {
  cash: {
    icon:        <Banknote className="size-6" />,
    label:       "Cash",
    description: "Accept physical currency. Cashier enters tendered amount and provides change.",
    color:       "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
  },
  card: {
    icon:        <CreditCard className="size-6" />,
    label:       "Card / Digital",
    description: "Credit / debit card via POS terminal. Cashier records the approval reference number.",
    color:       "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30",
  },
  upi: {
    icon:        <Smartphone className="size-6" />,
    label:       "UPI QR",
    description: "Instant bank transfer via Google Pay, PhonePe, Paytm, BHIM. Customer scans the generated QR.",
    color:       "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30",
  },
};

const MOCK_ORDER: Order = {
  id: "ORD-TEST-9999",
  sessionId: "session-test",
  tableId: null,
  customerId: null,
  employeeId: "admin-id",
  orderNumber: "ORD-TEST-99",
  subtotal: 450.00,
  tax: 22.50,
  discounts: 50.00,
  appliedPromoId: null,
  appliedPromoName: null,
  appliedCouponCode: null,
  total: 422.50,
  status: "paid",
  paymentMethodId: 1,
  paymentReference: "REF-TEST",
  createdAt: new Date().toISOString(),
  items: [
    {
      id: "item-1",
      productId: "prod-1",
      name: "Double Chocolate Muffin",
      quantity: 2,
      unitPrice: 150.00,
      taxPercentage: 5,
      taxAmount: 15.00,
      discountAmount: 0,
      total: 315.00,
      status: "served",
      selectedModifiers: [
        { groupName: "Extras", name: "Extra Choco Chips", priceAdjustment: 20.00 }
      ],
      notes: "Warm it up please"
    },
    {
      id: "item-2",
      productId: "prod-2",
      name: "Iced Caramel Macchiato",
      quantity: 1,
      unitPrice: 180.00,
      taxPercentage: 5,
      taxAmount: 9.00,
      discountAmount: 0,
      total: 189.00,
      status: "served",
      selectedModifiers: [
        { groupName: "Milk Type", name: "Almond Milk", priceAdjustment: 30.00 }
      ]
    }
  ]
};

// ── PaymentMethodCard ─────────────────────────────────────────────────────────

interface CardProps {
  pm: PaymentMethod;
  index: number;
  onToggle: (id: number) => void;
  onSaveUpi: (id: number, upiId: string) => void;
}

function PaymentMethodCard({ pm, index, onToggle, onSaveUpi }: CardProps) {
  const meta = TYPE_META[pm.type] ?? TYPE_META.cash;

  // UPI-specific local state
  const [upiDraft, setUpiDraft]       = useState(pm.upiId ?? "");
  const [editing, setEditing]         = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const draftValid = isValidUpiId(upiDraft);

  function handleSave() {
    if (!draftValid) return;
    onSaveUpi(pm.id, upiDraft.trim());
    setEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setUpiDraft(pm.upiId ?? ""); setEditing(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "relative flex flex-col gap-5 rounded-3xl border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-stone-900",
        pm.isEnabled
          ? "border-stone-200 dark:border-stone-700"
          : "border-stone-100 opacity-60 dark:border-stone-800",
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-2xl p-3", meta.color)}>
          {meta.icon}
        </div>

        {/* Enable / disable toggle */}
        <button
          type="button"
          onClick={() => onToggle(pm.id)}
          aria-label={pm.isEnabled ? "Disable payment method" : "Enable payment method"}
          className={cn(
            "flex h-7 w-12 items-center rounded-full px-0.5 transition-all duration-300",
            pm.isEnabled
              ? "bg-primary justify-end"
              : "bg-stone-200 justify-start dark:bg-stone-700",
          )}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 700, damping: 40 }}
            className="size-6 rounded-full bg-white shadow-sm"
          />
        </button>
      </div>

      {/* ── Title + description ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-base md:text-lg text-stone-850 dark:text-stone-100">
            {meta.label}
          </h4>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
            pm.isEnabled
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-stone-100 text-stone-400 dark:bg-stone-800",
          )}>
            {pm.isEnabled ? "Active" : "Disabled"}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          {meta.description}
        </p>
      </div>

      {/* ── UPI-specific configuration ───────────────────────────────────── */}
      {pm.type === "upi" && (
        <div className="flex flex-col gap-4 border-t border-stone-100 pt-4 dark:border-stone-800">

          {/* Merchant UPI ID field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Merchant UPI ID
              </label>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Pencil className="size-2.5" /> Edit
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      autoFocus
                      type="text"
                      value={upiDraft}
                      onChange={(e) => setUpiDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="yourname@ybl"
                      className={cn(
                        "h-9 w-full rounded-xl border bg-stone-50 px-3 font-mono text-xs text-stone-800 outline-none transition-all dark:bg-stone-950 dark:text-stone-200",
                        upiDraft && !draftValid
                          ? "border-red-400 focus:ring-1 focus:ring-red-400"
                          : "border-stone-200 focus:border-primary focus:ring-1 focus:ring-primary/30 dark:border-stone-700",
                      )}
                    />
                    {upiDraft && (
                      <span className={cn(
                        "absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold",
                        draftValid ? "text-emerald-500" : "text-red-400",
                      )}>
                        {draftValid ? "✓" : "✗"}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!draftValid}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Save UPI ID"
                  >
                    <Check className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUpiDraft(pm.upiId ?? ""); setEditing(false); }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-400 transition-all hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                    aria-label="Cancel"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-9 items-center rounded-xl border border-stone-100 bg-stone-50 px-3 dark:border-stone-800 dark:bg-stone-950"
                >
                  <span className="font-mono text-xs text-stone-700 dark:text-stone-300">
                    {pm.upiId || <span className="text-stone-400 italic">Not set</span>}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation hint */}
            {editing && upiDraft && !draftValid && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 text-xs text-red-500"
              >
                <Info className="size-3" />
                Must be in format: name@provider (e.g. cafe@ybl)
              </motion.p>
            )}

            {/* Save success toast */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  <ShieldCheck className="size-3.5" />
                  UPI ID saved — QR updated
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live QR preview */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Live QR Preview
            </p>
            <div className="flex items-center gap-4">
              <UpiQrPreview
                upiId={editing ? upiDraft : (pm.upiId ?? "")}
                merchantName="Odoo Cafe"
              />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  {isValidUpiId(editing ? upiDraft : (pm.upiId ?? ""))
                    ? "✅ Valid QR — ready to use"
                    : "⚠️ Set a valid UPI ID"}
                </p>
                <p className="text-xs leading-relaxed text-stone-400">
                  This preview shows how the QR will appear to customers at checkout.
                  Amount is not pre-filled in the preview.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const {
    paymentMethods,
    togglePaymentMethod,
    saveUpiId,
    printerSettings,
    updatePrinterSettings,
    printOrder
  } = useApp();

  const [activeTab, setActiveTab] = useState<"payments" | "printers">("payments");

  // Local state for printer configuration settings
  const [receiptType, setReceiptType] = useState<"browser" | "usb" | "network">("browser");
  const [receiptWidth, setReceiptWidth] = useState<"80mm" | "58mm">("80mm");
  const [receiptIp, setReceiptIp] = useState("");
  const [receiptPort, setReceiptPort] = useState(9100);
  const [receiptAuto, setReceiptAuto] = useState(false);
  const [receiptVid, setReceiptVid] = useState("");
  const [receiptPid, setReceiptPid] = useState("");

  const [kitchenType, setKitchenType] = useState<"browser" | "usb" | "network">("browser");
  const [kitchenWidth, setKitchenWidth] = useState<"80mm" | "58mm">("80mm");
  const [kitchenIp, setKitchenIp] = useState("");
  const [kitchenPort, setKitchenPort] = useState(9100);
  const [kitchenAuto, setKitchenAuto] = useState(false);
  const [kitchenVid, setKitchenVid] = useState("");
  const [kitchenPid, setKitchenPid] = useState("");

  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [isSavingKitchen, setIsSavingKitchen] = useState(false);

  // Sync state with loaded configuration settings
  useEffect(() => {
    if (printerSettings) {
      setReceiptType(printerSettings.receiptPrinter?.type || "browser");
      setReceiptWidth(printerSettings.receiptPrinter?.paperWidth || "80mm");
      setReceiptIp(printerSettings.receiptPrinter?.ipAddress || "");
      setReceiptPort(printerSettings.receiptPrinter?.port || 9100);
      setReceiptAuto(printerSettings.receiptPrinter?.autoPrint || false);
      setReceiptVid(printerSettings.receiptPrinter?.usbVendorId || "");
      setReceiptPid(printerSettings.receiptPrinter?.usbProductId || "");

      setKitchenType(printerSettings.kitchenPrinter?.type || "browser");
      setKitchenWidth(printerSettings.kitchenPrinter?.paperWidth || "80mm");
      setKitchenIp(printerSettings.kitchenPrinter?.ipAddress || "");
      setKitchenPort(printerSettings.kitchenPrinter?.port || 9100);
      setKitchenAuto(printerSettings.kitchenPrinter?.autoPrint || false);
      setKitchenVid(printerSettings.kitchenPrinter?.usbVendorId || "");
      setKitchenPid(printerSettings.kitchenPrinter?.usbProductId || "");
    }
  }, [printerSettings]);

  const handleSaveReceipt = async () => {
    setIsSavingReceipt(true);
    try {
      const payload: PrinterSettings = {
        ...printerSettings,
        receiptPrinter: {
          type: receiptType,
          paperWidth: receiptWidth,
          ipAddress: receiptIp,
          port: Number(receiptPort),
          autoPrint: receiptAuto,
          usbVendorId: receiptVid,
          usbProductId: receiptPid
        }
      };
      await updatePrinterSettings(payload);
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const handleSaveKitchen = async () => {
    setIsSavingKitchen(true);
    try {
      const payload: PrinterSettings = {
        ...printerSettings,
        kitchenPrinter: {
          type: kitchenType,
          paperWidth: kitchenWidth,
          ipAddress: kitchenIp,
          port: Number(kitchenPort),
          autoPrint: kitchenAuto,
          usbVendorId: kitchenVid,
          usbProductId: kitchenPid
        }
      };
      await updatePrinterSettings(payload);
    } finally {
      setIsSavingKitchen(false);
    }
  };

  const handleTestPrint = async (isKitchen: boolean) => {
    // Alert the user that settings should be saved first
    await printOrder(MOCK_ORDER, isKitchen);
  };

  return (
    <div className="space-y-8 text-sm text-stone-800 dark:text-stone-200">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans tracking-tight">
            Settings & Hardware
          </h2>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            Configure café payment options, receipt printers, and kitchen display ticket routing.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 rounded-2xl bg-stone-150 p-1.5 dark:bg-stone-800/60 max-w-fit">
          <button
            onClick={() => setActiveTab("payments")}
            className={cn(
              "relative rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300",
              activeTab === "payments"
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            )}
          >
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab("printers")}
            className={cn(
              "relative rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300",
              activeTab === "printers"
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            )}
          >
            Printers (Thermal/KDS)
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "payments" ? (
          <motion.div
            key="payments-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
              <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
              <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                <strong>UPI QR codes</strong> are generated in real-time at checkout using the merchant UPI ID set here.
                The customer's UPI app (Google Pay, PhonePe, Paytm, BHIM) pre-fills the exact order amount and payee details.
                No third-party payment gateway is required — funds transfer directly to your bank account.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {paymentMethods.map((pm, i) => (
                <PaymentMethodCard
                  key={pm.id}
                  pm={pm}
                  index={i}
                  onToggle={togglePaymentMethod}
                  onSaveUpi={saveUpiId}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="printers-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 gap-8 md:grid-cols-2"
          >
            {/* ── Client Receipt Printer Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                    <Printer className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      Client Receipt Printer
                    </h3>
                    <p className="text-xs text-stone-500">
                      Formats and prints checkout bills for customers.
                    </p>
                  </div>
                </div>

                <div className="divider border-t border-stone-100 dark:border-stone-850" />

                {/* Connection Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Connection Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "browser", label: "Browser", icon: <FileText className="size-3.5" /> },
                      { id: "usb", label: "USB Serial", icon: <Usb className="size-3.5" /> },
                      { id: "network", label: "Network IP", icon: <Network className="size-3.5" /> }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setReceiptType(type.id as any)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all",
                          receiptType === type.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-stone-200 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-850"
                        )}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Width */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Paper Width
                  </label>
                  <div className="flex gap-3">
                    {["80mm", "58mm"].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setReceiptWidth(w as any)}
                        className={cn(
                          "flex-1 rounded-xl border py-2 text-xs font-bold transition-all",
                          receiptWidth === w
                            ? "border-stone-850 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                            : "border-stone-200 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-850"
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Inputs */}
                <AnimatePresence mode="wait">
                  {receiptType === "network" && (
                    <motion.div
                      key="receipt-network-inputs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-3 gap-3"
                    >
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-stone-500">IP Address</label>
                        <input
                          type="text"
                          value={receiptIp}
                          onChange={(e) => setReceiptIp(e.target.value)}
                          placeholder="e.g. 192.168.1.100"
                          className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs outline-none focus:border-primary dark:border-stone-800 dark:bg-stone-950"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-500">Port</label>
                        <input
                          type="number"
                          value={receiptPort}
                          onChange={(e) => setReceiptPort(Number(e.target.value))}
                          placeholder="9100"
                          className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs outline-none focus:border-primary dark:border-stone-800 dark:bg-stone-950"
                        />
                      </div>
                    </motion.div>
                  )}

                  {receiptType === "usb" && (
                    <motion.div
                      key="receipt-usb-inputs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-500">USB Vendor ID (Hex)</label>
                          <input
                            type="text"
                            value={receiptVid}
                            onChange={(e) => setReceiptVid(e.target.value)}
                            placeholder="e.g. 0x0fe6"
                            className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 font-mono text-xs outline-none focus:border-primary dark:border-stone-800 dark:bg-stone-950"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-500">USB Product ID (Hex)</label>
                          <input
                            type="text"
                            value={receiptPid}
                            onChange={(e) => setReceiptPid(e.target.value)}
                            placeholder="e.g. 0x811e"
                            className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 font-mono text-xs outline-none focus:border-primary dark:border-stone-800 dark:bg-stone-950"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        Leave blank to request port selection via prompt on first print trigger.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auto-print trigger */}
                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4 dark:bg-stone-950/40">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      Auto-print on Checkout
                    </span>
                    <p className="text-[10px] text-stone-400">
                      Trigger receipt print dialog/command automatically upon payment approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptAuto(!receiptAuto)}
                    className={cn(
                      "flex h-6 w-11 items-center rounded-full px-0.5 transition-all duration-300",
                      receiptAuto ? "bg-primary justify-end" : "bg-stone-200 justify-start dark:bg-stone-800"
                    )}
                  >
                    <span className="size-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-3 border-t border-stone-100 pt-4 dark:border-stone-850">
                <button
                  type="button"
                  onClick={() => handleTestPrint(false)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-bold hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-850"
                >
                  <RefreshCw className="size-3.5" />
                  Test Print
                </button>
                <button
                  type="button"
                  onClick={handleSaveReceipt}
                  disabled={isSavingReceipt}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-40"
                >
                  {isSavingReceipt ? "Saving..." : "Save Config"}
                </button>
              </div>
            </motion.div>

            {/* ── Kitchen KDS Printer Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                    <SlidersHorizontal className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      Kitchen / KDS Printer
                    </h3>
                    <p className="text-xs text-stone-500">
                      Prints itemized order tickets for the chefs.
                    </p>
                  </div>
                </div>

                <div className="divider border-t border-stone-100 dark:border-stone-850" />

                {/* Connection Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Connection Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "browser", label: "Browser", icon: <FileText className="size-3.5" /> },
                      { id: "usb", label: "USB Serial", icon: <Usb className="size-3.5" /> },
                      { id: "network", label: "Network IP", icon: <Network className="size-3.5" /> }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setKitchenType(type.id as any)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all",
                          kitchenType === type.id
                            ? "border-violet-600 bg-violet-500/5 text-violet-600 dark:text-violet-400"
                            : "border-stone-200 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-850"
                        )}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Width */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Paper Width
                  </label>
                  <div className="flex gap-3">
                    {["80mm", "58mm"].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setKitchenWidth(w as any)}
                        className={cn(
                          "flex-1 rounded-xl border py-2 text-xs font-bold transition-all",
                          kitchenWidth === w
                            ? "border-stone-850 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                            : "border-stone-200 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-850"
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Inputs */}
                <AnimatePresence mode="wait">
                  {kitchenType === "network" && (
                    <motion.div
                      key="kitchen-network-inputs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-3 gap-3"
                    >
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-stone-500">IP Address</label>
                        <input
                          type="text"
                          value={kitchenIp}
                          onChange={(e) => setKitchenIp(e.target.value)}
                          placeholder="e.g. 192.168.1.101"
                          className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs outline-none focus:border-violet-600 dark:border-stone-800 dark:bg-stone-950"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-500">Port</label>
                        <input
                          type="number"
                          value={kitchenPort}
                          onChange={(e) => setKitchenPort(Number(e.target.value))}
                          placeholder="9100"
                          className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs outline-none focus:border-violet-600 dark:border-stone-800 dark:bg-stone-950"
                        />
                      </div>
                    </motion.div>
                  )}

                  {kitchenType === "usb" && (
                    <motion.div
                      key="kitchen-usb-inputs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-500">USB Vendor ID (Hex)</label>
                          <input
                            type="text"
                            value={kitchenVid}
                            onChange={(e) => setKitchenVid(e.target.value)}
                            placeholder="e.g. 0x0fe6"
                            className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 font-mono text-xs outline-none focus:border-violet-600 dark:border-stone-800 dark:bg-stone-950"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-500">USB Product ID (Hex)</label>
                          <input
                            type="text"
                            value={kitchenPid}
                            onChange={(e) => setKitchenPid(e.target.value)}
                            placeholder="e.g. 0x811e"
                            className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 font-mono text-xs outline-none focus:border-violet-600 dark:border-stone-800 dark:bg-stone-950"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        Leave blank to request port selection via prompt on first print trigger.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auto-print trigger */}
                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4 dark:bg-stone-950/40">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      Auto-print on Kitchen Send
                    </span>
                    <p className="text-[10px] text-stone-400">
                      Trigger receipt print dialog/command automatically when items are pushed to kitchen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setKitchenAuto(!kitchenAuto)}
                    className={cn(
                      "flex h-6 w-11 items-center rounded-full px-0.5 transition-all duration-300",
                      kitchenAuto ? "bg-violet-600 justify-end" : "bg-stone-200 justify-start dark:bg-stone-800"
                    )}
                  >
                    <span className="size-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-3 border-t border-stone-100 pt-4 dark:border-stone-850">
                <button
                  type="button"
                  onClick={() => handleTestPrint(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-bold hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-850"
                >
                  <RefreshCw className="size-3.5" />
                  Test Print
                </button>
                <button
                  type="button"
                  onClick={handleSaveKitchen}
                  disabled={isSavingKitchen}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-40"
                >
                  {isSavingKitchen ? "Saving..." : "Save Config"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

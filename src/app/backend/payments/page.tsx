"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Banknote, CreditCard, Smartphone,
  Check, X, Pencil, ShieldCheck, Info,
} from "lucide-react";
import { useApp, type PaymentMethod } from "@/app/context/AppContext";
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
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">
            {meta.label}
          </h4>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            pm.isEnabled
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-stone-100 text-stone-400 dark:bg-stone-800",
          )}>
            {pm.isEnabled ? "Active" : "Disabled"}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {meta.description}
        </p>
      </div>

      {/* ── UPI-specific configuration ───────────────────────────────────── */}
      {pm.type === "upi" && (
        <div className="flex flex-col gap-4 border-t border-stone-100 pt-4 dark:border-stone-800">

          {/* Merchant UPI ID field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Merchant UPI ID
              </label>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
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
                className="flex items-center gap-1 text-[10px] text-red-500"
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
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  <ShieldCheck className="size-3.5" />
                  UPI ID saved — QR updated
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live QR preview */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
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
                <p className="text-[10px] leading-relaxed text-stone-400">
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
  const { paymentMethods, togglePaymentMethod, saveUpiId } = useApp();

  return (
    <div className="space-y-8 text-xs text-stone-800 dark:text-stone-200">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">
          Payment Methods
        </h2>
        <p className="mt-1 text-stone-500">
          Enable or disable payment modes. Configure your merchant UPI ID to generate scannable QR codes at checkout.
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
        <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
          <strong>UPI QR codes</strong> are generated in real-time at checkout using the merchant UPI ID set here.
          The customer's UPI app (Google Pay, PhonePe, Paytm, BHIM) pre-fills the exact order amount and payee details.
          No third-party payment gateway is required — funds transfer directly to your bank account.
        </p>
      </motion.div>

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
    </div>
  );
}

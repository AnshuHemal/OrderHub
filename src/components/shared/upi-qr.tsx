"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  CheckCircle2, Copy, RefreshCw, AlertCircle,
  Smartphone, Timer, ToggleLeft, ToggleRight,
} from "lucide-react";
import { buildUpiUri, isValidUpiId } from "@/lib/upi";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────

const QR_EXPIRY_SECONDS = 120; // 2 minutes

// ── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const [key, setKey]             = useState(0);

  useEffect(() => {
    setRemaining(seconds);
    const id = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, key]);

  const restart    = () => setKey((k) => k + 1);
  const progress   = remaining / seconds; // 1 → 0
  const expired    = remaining === 0;
  const mm         = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss         = String(remaining % 60).padStart(2, "0");
  const label      = `${mm}:${ss}`;

  return { remaining, progress, expired, label, restart };
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface UpiQrProps {
  upiId: string;
  merchantName?: string;
  amount: number;
  orderId: string;
  compact?: boolean;
  className?: string;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function UpiQr({
  upiId,
  merchantName = "OrderHub",
  amount,
  orderId,
  compact = false,
  className,
}: UpiQrProps) {
  const [fixedAmount, setFixedAmount] = useState(true);
  const [copied, setCopied]           = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { progress, expired, label, restart } = useCountdown(QR_EXPIRY_SECONDS);

  const uri = useMemo(() => buildUpiUri({
    upiId,
    merchantName,
    amount: fixedAmount ? amount : undefined,
    note:   `Order ${orderId}`.slice(0, 50),
  }), [upiId, merchantName, amount, orderId, fixedAmount]);

  const isValid  = isValidUpiId(upiId);
  const qrSize   = compact ? 140 : 192;
  const GAP      = 10;
  const SW       = 4;

  async function handleCopy() {
    if (!uri) return;
    await navigator.clipboard.writeText(uri).catch(() => {});
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  // ── Invalid UPI ───────────────────────────────────────────────────────────
  if (!isValid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-center dark:border-amber-800/40 dark:bg-amber-950/20",
          className,
        )}
      >
        <AlertCircle className="size-8 text-amber-500" />
        <p className="font-bold text-sm text-amber-700 dark:text-amber-400">UPI ID not configured</p>
        <p className="text-xs text-amber-600/80 dark:text-amber-500/70">
          Go to Admin → Payments to set your merchant UPI ID.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn("flex flex-col items-center gap-4", className)}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400"
        >
          <Smartphone className="size-3.5" />
          Scan with Google Pay · PhonePe · Paytm · BHIM
        </motion.div>
      )}

      {/* ── QR Card Container ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-1">
        <AnimatePresence mode="wait">
          {expired ? (
            <motion.div
              key="expired"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: qrSize + 24, height: qrSize + 24 }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-red-300 bg-red-50 dark:border-red-800/50 dark:bg-red-950/20"
            >
              <Timer className="size-8 text-red-400" />
              <p className="text-xs font-bold text-red-500">QR Expired</p>
              <button
                type="button"
                onClick={restart}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-600"
              >
                <RefreshCw className="size-3" />
                Regenerate
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl bg-white p-4 shadow-md border border-stone-150/50 flex items-center justify-center"
            >
              {/* Clean QR — no logo excavation, level M is sufficient */}
              <QRCodeSVG
                value={uri!}
                size={qrSize}
                level="M"
                marginSize={1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Info row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1">
        {/* UPI ID + copy */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-stone-700 dark:text-stone-200">
            {upiId}
          </span>
          <motion.button
            type="button"
            onClick={handleCopy}
            whileTap={{ scale: 0.88 }}
            aria-label="Copy UPI ID"
            className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Copy className="size-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Amount */}
        {!compact && (
          <p className="text-lg font-black tabular-nums text-stone-800 dark:text-stone-100">
            ₹{amount.toFixed(2)}
          </p>
        )}

        {/* Timer pill */}
        <motion.div
          animate={expired ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums",
            expired
              ? "bg-red-100 text-red-500 dark:bg-red-950/30"
              : progress > 0.4
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
          )}
        >
          <Timer className="size-3" />
          {expired ? "Expired — regenerate" : `Expires in ${label}`}
        </motion.div>
      </div>

      {/* ── Amount toggle ──────────────────────────────────────────────────── */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 dark:border-stone-800 dark:bg-stone-900"
        >
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            Pre-fill amount in QR
          </span>
          <button
            type="button"
            onClick={() => setFixedAmount((v) => !v)}
            aria-label="Toggle pre-filled amount"
            className="text-stone-400 transition-colors hover:text-primary"
          >
            {fixedAmount
              ? <ToggleRight className="size-5 text-primary" />
              : <ToggleLeft  className="size-5" />
            }
          </button>
          <span className={cn(
            "text-[11px] font-bold",
            fixedAmount ? "text-primary" : "text-stone-400",
          )}>
            {fixedAmount ? "On" : "Off"}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Admin preview variant ──────────────────────────────────────────────────────

export function UpiQrPreview({
  upiId,
  merchantName = "OrderHub",
}: {
  upiId: string;
  merchantName?: string;
}) {
  const uri = useMemo(
    () => buildUpiUri({ upiId, merchantName, note: "Preview" }),
    [upiId, merchantName],
  );

  if (!isValidUpiId(upiId) || !uri) {
    return (
      <div className="flex size-24 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700">
        <p className="text-center text-[10px] text-stone-400">Enter UPI ID</p>
      </div>
    );
  }

  return (
    <motion.div
      key={upiId}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl bg-white p-2 shadow ring-1 ring-stone-200/80 dark:ring-stone-700"
    >
      <QRCodeSVG value={uri} size={96} level="M" marginSize={1} />
    </motion.div>
  );
}

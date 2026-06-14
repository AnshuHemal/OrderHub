"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number; // ms — 0 = permanent
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-500/30 bg-emerald-50   dark:bg-emerald-950/40  text-emerald-700 dark:text-emerald-300",
  error:   "border-red-500/30    bg-red-50         dark:bg-red-950/40       text-red-700     dark:text-red-300",
  warning: "border-amber-500/30  bg-amber-50       dark:bg-amber-950/40    text-amber-700   dark:text-amber-300",
  info:    "border-blue-500/30   bg-blue-50        dark:bg-blue-950/40      text-blue-700    dark:text-blue-300",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-emerald-500",
  error:   "text-red-500",
  warning: "text-amber-500",
  info:    "text-blue-500",
};

const DEFAULT_DURATION = 4000;

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = ICONS[toast.variant];
  const dur = toast.duration ?? DEFAULT_DURATION;

  useEffect(() => {
    if (dur === 0) return;
    const t = setTimeout(() => onDismiss(toast.id), dur);
    return () => clearTimeout(t);
  }, [toast.id, dur, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "relative flex items-start gap-3 w-full max-w-sm rounded-2xl border px-4 py-3.5 shadow-lg shadow-black/5 backdrop-blur-sm pointer-events-auto",
        STYLES[toast.variant]
      )}
      role="alert"
    >
      {/* Progress bar */}
      {dur > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: dur / 1000, ease: "linear" }}
          className={cn(
            "absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full opacity-40",
            toast.variant === "success" ? "bg-emerald-500" :
            toast.variant === "error"   ? "bg-red-500"     :
            toast.variant === "warning" ? "bg-amber-500"   : "bg-blue-500"
          )}
        />
      )}

      <Icon className={cn("size-5 shrink-0 mt-0.5", ICON_STYLES[toast.variant])} />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{toast.message}</p>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [{ id, ...opts }, ...prev].slice(0, 5)); // max 5
  }, []);

  const success = useCallback((title: string, message?: string) => toast({ variant: "success", title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ variant: "error",   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ variant: "warning", title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ variant: "info",    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast portal */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none w-full max-w-sm">
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

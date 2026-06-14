"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { DialogModal } from "@/components/ui/dialog-modal";
import { TriangleAlert, HelpCircle, Trash2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx.confirm;
}

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconColor: "text-red-500",
    btnCls: "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20",
  },
  warning: {
    icon: TriangleAlert,
    iconBg: "bg-amber-100 dark:bg-amber-950/50",
    iconColor: "text-amber-500",
    btnCls: "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20",
  },
  info: {
    icon: HelpCircle,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    btnCls: "bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20",
  },
} as const;

// ─── Provider ─────────────────────────────────────────────────────────────────

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  const variant = pending?.variant ?? "info";
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <DialogModal
        isOpen={!!pending}
        onClose={() => handleClose(false)}
        title={pending?.title ?? ""}
        size="sm"
      >
        <div className="space-y-5">
          {/* Icon + message */}
          <div className="flex gap-4 items-start">
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", config.iconBg)}>
              <Icon className={cn("size-5", config.iconColor)} />
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed pt-2">
              {pending?.message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-1 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="px-5 py-2.5 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
            >
              {pending?.cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => handleClose(true)}
              className={cn(
                "px-5 py-2.5 font-bold rounded-xl transition-all active:scale-95 text-sm",
                config.btnCls
              )}
            >
              {pending?.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </DialogModal>
    </ConfirmContext.Provider>
  );
}

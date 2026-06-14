"use client";

import React, { useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DialogModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Modal heading */
  title: string;
  /** Optional subtitle below the title */
  description?: string;
  /** Optional icon shown left of the title */
  icon?: React.ReactNode;
  /** Content rendered inside the modal body */
  children: React.ReactNode;
  /** Controls the max-width of the panel */
  size?: "sm" | "md" | "lg" | "xl";
  /** Extra className for the inner panel */
  className?: string;
}

// ─── Size map ────────────────────────────────────────────────────────────────

const sizeMap: Record<NonNullable<DialogModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// ─── Variants ────────────────────────────────────────────────────────────────

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const panelVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.94, y: 8 },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function DialogModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  size = "md",
  className,
}: DialogModalProps) {
  const titleId = useId();

  // Escape key closes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        /* ── Backdrop ── */
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          aria-modal="true"
          role="dialog"
          aria-labelledby={titleId}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Blurred dark overlay — click to close */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Panel ── */}
          <motion.div
            key="modal-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "relative z-10 w-full rounded-3xl overflow-hidden",
              "bg-white dark:bg-stone-900",
              "border border-stone-200/80 dark:border-stone-800",
              "shadow-2xl shadow-black/20",
              sizeMap[size],
              className
            )}
            // Stop clicks inside from closing
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-stone-100 dark:border-stone-800/80">
              <div className="flex items-start gap-3.5 min-w-0">
                {icon && (
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary">{icon}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="text-lg font-extrabold text-stone-900 dark:text-stone-100 leading-tight"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className={cn(
                  "shrink-0 flex items-center justify-center",
                  "w-8 h-8 rounded-xl",
                  "text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200",
                  "hover:bg-stone-100 dark:hover:bg-stone-800",
                  "transition-all duration-150",
                  "active:scale-90"
                )}
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5 overflow-y-auto max-h-[calc(100dvh-160px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggle = useCallback(() => {
    const next =
      theme === "light" ? "dark"
      : theme === "dark" ? "system"
      : "light";

    setTheme(next);
  }, [theme, setTheme]);

  if (!mounted) {
    return <div className="size-9" aria-hidden />;
  }

  const isDark   = resolvedTheme === "dark";
  const isSystem = theme === "system";

  const label =
    theme === "light"  ? "Switch to dark mode"
    : theme === "dark" ? "Switch to system theme"
    : "Switch to light mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="relative overflow-hidden size-9 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isSystem ? (
          <motion.span
            key="system"
            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Monitor className="size-4 text-stone-600 dark:text-stone-300" />
          </motion.span>
        ) : isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="size-4 text-stone-600 dark:text-stone-300" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -45, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="size-4 text-stone-600 dark:text-stone-300" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

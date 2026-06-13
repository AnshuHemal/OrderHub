"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AuthError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <motion.div
        className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <AlertTriangle className="size-8 text-destructive" />
      </motion.div>

      <motion.div
        className="flex flex-col gap-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An error occurred during authentication. Please try again.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>

      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
          <RotateCcw className="size-3.5" /> Try again
        </Button>
        <Button size="sm" asChild className="gap-2">
          <Link href="/"><Home className="size-3.5" /> Go home</Link>
        </Button>
      </motion.div>
    </div>
  );
}

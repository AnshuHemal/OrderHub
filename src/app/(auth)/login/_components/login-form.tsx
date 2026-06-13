"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, RotateCcw, XCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { FadeIn } from "@/components/motion/fade-in";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form     = e.currentTarget;
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const { error: authError } = await signIn.email({ email, password, callbackURL: next });

    if (authError) {
      setError(authError.message ?? "Invalid email or password.");
      setIsPending(false);
      return;
    }

    window.location.href = next;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Email */}
      <FadeIn delay={0.08} className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@cafe.com"
          autoComplete="email"
          required
          disabled={isPending}
          className="h-10"
        />
      </FadeIn>

      {/* Password */}
      <FadeIn delay={0.12} className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isPending}
            className="h-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isPending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FadeIn>

      {/* Error */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <XCircle className="size-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <FadeIn delay={0.16}>
        <Button type="submit" className="mt-1 h-10 w-full gap-2" disabled={isPending}>
          {isPending ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block"
              >
                <RotateCcw className="size-4" />
              </motion.span>
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Sign in
            </>
          )}
        </Button>
      </FadeIn>
    </form>
  );
}

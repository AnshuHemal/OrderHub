"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { LockKeyhole, Eye, EyeOff, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailOtp } from "@/lib/auth-client";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

function strength(pw: string): "empty" | "weak" | "fair" | "strong" {
  if (!pw)          return "empty";
  if (pw.length <  8) return "weak";
  if (pw.length < 12) return "fair";
  return "strong";
}

const strengthCfg = {
  empty:  { w: "0%",   color: "bg-border",      label: "" },
  weak:   { w: "33%",  color: "bg-destructive", label: "Weak" },
  fair:   { w: "66%",  color: "bg-yellow-500",  label: "Fair" },
  strong: { w: "100%", color: "bg-green-500",   label: "Strong" },
};

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const otp   = searchParams.get("otp")   ?? "";

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [showCf, setShowCf]             = useState(false);
  const [isPending, setIsPending]       = useState(false);
  const [status, setStatus]             = useState<"idle" | "success" | "error">("idle");
  const [error, setError]               = useState<string | null>(null);

  const s   = strength(password);
  const cfg = strengthCfg[s];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8)     { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm)    { setError("Passwords do not match."); return; }

    setIsPending(true);
    const { error: authErr } = await emailOtp.resetPassword({ email, otp, password });

    if (authErr) {
      setError(authErr.message ?? "Failed to reset password. Please try again.");
      setStatus("error");
      setIsPending(false);
      return;
    }

    setStatus("success");
    setTimeout(() => { window.location.href = "/login"; }, 1800);
  }

  const disabled = isPending || status === "success";

  return (
    <FadeIn className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-card px-8 py-9 shadow-lg shadow-black/5">

        {/* Icon + heading */}
        <FadeIn direction="down" delay={0.05} className="mb-7 flex flex-col items-center gap-3 text-center">
          <motion.div
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/10"
            animate={status === "success" ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === "success" ? (
                <motion.span key="ok"
                  initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <ShieldCheck className="size-7 text-primary" />
                </motion.span>
              ) : (
                <motion.span key="lock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LockKeyhole className="size-7 text-primary" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {status === "success" ? "Password reset!" : "Set new password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {status === "success" ? "Redirecting you to sign in…" : "Choose a strong password for your account."}
            </p>
          </div>
        </FadeIn>

        {/* Step indicator */}
        <FadeIn direction="none" delay={0.08} className="mb-6 flex items-center justify-center gap-2">
          {["Email", "Code", "Reset"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                i === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {i + 1}
              </div>
              <span className={cn("text-xs", i === 2 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {step}
              </span>
              {i < 2 && <div className="h-px w-6 bg-border" />}
            </div>
          ))}
        </FadeIn>

        {/* Success banner */}
        <AnimatePresence>
          {status === "success" && (
            <motion.div key="ok"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2.5 text-sm font-medium text-primary"
            >
              <ShieldCheck className="size-4 shrink-0" /> Password reset successfully.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        {status !== "success" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* New password */}
            <FadeIn delay={0.1} className="flex flex-col gap-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
                  autoComplete="new-password" required disabled={disabled}
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="h-10 pr-10"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} disabled={disabled}
                  aria-label={showPw ? "Hide" : "Show"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                    <motion.div className={cn("h-full rounded-full transition-colors duration-300", cfg.color)}
                      animate={{ width: cfg.w }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                  <span className={cn("text-xs font-medium", {
                    "text-destructive": s === "weak",
                    "text-yellow-500":  s === "fair",
                    "text-green-500":   s === "strong",
                  })}>{cfg.label}</span>
                </div>
              )}
            </FadeIn>

            {/* Confirm password */}
            <FadeIn delay={0.15} className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <div className="relative">
                <Input id="confirm" type={showCf ? "text" : "password"} placeholder="••••••••"
                  autoComplete="new-password" required disabled={disabled}
                  value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                  className={cn("h-10 pr-10", confirm && password && confirm !== password && "border-destructive/60")}
                />
                <button type="button" onClick={() => setShowCf(v => !v)} disabled={disabled}
                  aria-label={showCf ? "Hide" : "Show"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {showCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirm && password && confirm !== password && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </FadeIn>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div key="err"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  <XCircle className="size-4 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <FadeIn delay={0.2}>
              <Button type="submit" className="h-10 w-full gap-2" disabled={disabled}>
                {isPending ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="inline-block">
                      <RotateCcw className="size-4" />
                    </motion.span>
                    Resetting…
                  </>
                ) : "Reset password"}
              </Button>
            </FadeIn>
          </form>
        )}
      </div>

      <FadeIn direction="none" delay={0.25}>
        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </FadeIn>
    </FadeIn>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Mail, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emailOtp } from "@/lib/auth-client";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

const OTP_LEN        = 6;
const RESEND_COOLDOWN = 60;

export function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp]           = useState<string[]>(Array(OTP_LEN).fill(""));
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleProceed = useCallback((code: string) => {
    if (status === "loading") return;
    setStatus("loading");
    window.location.href = `/forgot-password/reset?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(code)}`;
  }, [email, status]);

  function handleChange(i: number, value: string) {
    const char = value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-1);
    const next = [...otp]; next[i] = char; setOtp(next); setErrorMsg(null);
    if (status === "error") setStatus("idle");
    if (char && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
    if (char && next.every(Boolean)) handleProceed(next.join(""));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otp[i]) { const n = [...otp]; n[i] = ""; setOtp(n); }
      else if (i > 0) refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft"  && i > 0)           refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, OTP_LEN);
    if (!text) return;
    const next = Array(OTP_LEN).fill("") as string[];
    text.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next); setErrorMsg(null);
    if (status === "error") setStatus("idle");
    const empty = next.findIndex((c) => !c);
    refs.current[empty === -1 ? OTP_LEN - 1 : empty]?.focus();
    if (text.length === OTP_LEN) handleProceed(text);
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true); setErrorMsg(null);
    const { error } = await emailOtp.sendVerificationOtp({ email, type: "forget-password" });
    setResending(false);
    if (error) { setErrorMsg("Failed to resend. Try again."); return; }
    setCooldown(RESEND_COOLDOWN);
    setOtp(Array(OTP_LEN).fill(""));
    refs.current[0]?.focus();
  }

  const filled = otp.filter(Boolean).length;

  return (
    <FadeIn className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-card px-8 py-9 shadow-lg shadow-black/5">

        {/* Icon + heading */}
        <FadeIn direction="down" delay={0.05} className="mb-7 flex flex-col items-center gap-3 text-center">
          <motion.div
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Mail className="size-7 text-primary" />
          </motion.div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a 6-character code to
            </p>
            <p className="text-sm font-semibold">{email || "your email"}</p>
          </div>
        </FadeIn>

        {/* Step indicator */}
        <FadeIn direction="none" delay={0.08} className="mb-6 flex items-center justify-center gap-2">
          {["Email", "Code", "Reset"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                i === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {i + 1}
              </div>
              <span className={cn("text-xs", i === 1 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {step}
              </span>
              {i < 2 && <div className="h-px w-6 bg-border" />}
            </div>
          ))}
        </FadeIn>

        {/* OTP inputs */}
        <FadeIn delay={0.12} className="mb-5">
          <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste} role="group" aria-label="Reset code">
            {otp.map((char, i) => (
              <motion.input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={char}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={status === "loading"}
                aria-label={`Code digit ${i + 1}`}
                animate={status === "error" ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.45 }}
                className={cn(
                  "h-12 w-11 rounded-xl border-2 text-center text-lg font-bold uppercase tracking-widest outline-none transition-all",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  char && status !== "error" ? "border-primary/50 bg-primary/5" : "border-border bg-background",
                  status === "error" && "border-destructive/60 bg-destructive/5 text-destructive",
                )}
              />
            ))}
          </div>

          <div className="mt-3.5 h-0.5 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              className={cn("h-full rounded-full", status === "error" ? "bg-destructive" : "bg-primary")}
              animate={{ width: `${(filled / OTP_LEN) * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </FadeIn>

        {/* Error */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div key="err"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <XCircle className="size-4 shrink-0" /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue button */}
        <FadeIn delay={0.16}>
          <Button
            className="h-10 w-full gap-2"
            disabled={filled < OTP_LEN || status === "loading"}
            onClick={() => handleProceed(otp.join(""))}
          >
            {status === "loading" ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="inline-block">
                  <RotateCcw className="size-4" />
                </motion.span>
                Continuing…
              </>
            ) : "Continue"}
          </Button>
        </FadeIn>

        {/* Resend */}
        <FadeIn direction="none" delay={0.2} className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t get the code?{" "}
            {cooldown > 0 ? (
              <span className="tabular-nums font-medium">Resend in {cooldown}s</span>
            ) : (
              <button type="button" onClick={handleResend}
                disabled={resending || status === "loading"}
                className="font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            )}
          </p>
        </FadeIn>
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

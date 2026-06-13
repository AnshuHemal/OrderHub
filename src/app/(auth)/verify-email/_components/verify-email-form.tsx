"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Mail, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emailOtp, signIn } from "@/lib/auth-client";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

const OTP_LEN        = 6;
const RESEND_COOLDOWN = 60;

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email    = searchParams.get("email")    ?? "";
  const password = searchParams.get("password") ?? "";

  const [otp, setOtp]           = useState<string[]>(Array(OTP_LEN).fill(""));
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
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

  const handleVerify = useCallback(async (code: string) => {
    if (status === "loading" || status === "success") return;
    setStatus("loading");
    setErrorMsg(null);

    const { error: verifyErr } = await emailOtp.verifyEmail({ email, otp: code });
    if (verifyErr) {
      setStatus("error");
      setErrorMsg(
        verifyErr.message === "TOO_MANY_ATTEMPTS"
          ? "Too many attempts. Request a new code."
          : "Invalid or expired code. Try again.",
      );
      setOtp(Array(OTP_LEN).fill(""));
      setTimeout(() => { setStatus("idle"); refs.current[0]?.focus(); }, 700);
      return;
    }

    if (password) {
      const { error: signInErr } = await signIn.email({ email, password, callbackURL: "/dashboard" });
      if (!signInErr) {
        setStatus("success");
        setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
        return;
      }
    }

    setStatus("success");
    setTimeout(() => { window.location.href = "/login"; }, 1000);
  }, [email, password, status]);

  function handleChange(i: number, value: string) {
    const char = value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-1);
    const next = [...otp]; next[i] = char; setOtp(next); setErrorMsg(null);
    if (char && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
    if (char && next.every(Boolean)) handleVerify(next.join(""));
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
    const empty = next.findIndex((c) => !c);
    refs.current[empty === -1 ? OTP_LEN - 1 : empty]?.focus();
    if (text.length === OTP_LEN) handleVerify(text);
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true); setErrorMsg(null);
    const { error } = await emailOtp.sendVerificationOtp({ email, type: "email-verification" });
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
                <motion.span key="mail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Mail className="size-7 text-primary" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {status === "success" ? "Email verified!" : "Check your email"}
            </h1>
            {status === "success" ? (
              <p className="text-sm text-muted-foreground">Signing you in…</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">We sent a 6-character code to</p>
                <p className="text-sm font-semibold">{email || "your email"}</p>
              </>
            )}
          </div>
        </FadeIn>

        {/* OTP inputs */}
        <FadeIn delay={0.1} className="mb-5">
          <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste} role="group" aria-label="Verification code">
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
                disabled={status === "loading" || status === "success"}
                aria-label={`Code digit ${i + 1}`}
                animate={
                  status === "error"   ? { x: [0, -8, 8, -5, 5, 0] } :
                  status === "success" ? { scale: [1, 1.12, 1], y: [0, -4, 0] } : {}
                }
                transition={{ duration: 0.45, delay: status === "success" ? i * 0.05 : 0 }}
                className={cn(
                  "h-12 w-11 rounded-xl border-2 text-center text-lg font-bold uppercase tracking-widest outline-none transition-all",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  char && status !== "error" && status !== "success"
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-background",
                  status === "error"   && "border-destructive/60 bg-destructive/5 text-destructive",
                  status === "success" && "border-primary bg-primary/10 text-primary",
                )}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-3.5 h-0.5 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              className={cn("h-full rounded-full", status === "error" ? "bg-destructive" : "bg-primary")}
              animate={{ width: `${(filled / OTP_LEN) * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </FadeIn>

        {/* Status banners */}
        <AnimatePresence mode="wait">
          {status === "success" && (
            <motion.div key="ok"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2.5 text-sm font-medium text-primary"
            >
              <ShieldCheck className="size-4 shrink-0" /> Verified! Signing you in…
            </motion.div>
          )}
          {errorMsg && status !== "success" && (
            <motion.div key="err"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <XCircle className="size-4 shrink-0" /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verify button */}
        <FadeIn delay={0.15}>
          <Button
            className="h-10 w-full gap-2"
            disabled={filled < OTP_LEN || status === "loading" || status === "success"}
            onClick={() => handleVerify(otp.join(""))}
          >
            {status === "loading" ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="inline-block">
                  <RotateCcw className="size-4" />
                </motion.span>
                Verifying…
              </>
            ) : status === "success" ? (
              <><ShieldCheck className="size-4" /> Verified!</>
            ) : "Verify email"}
          </Button>
        </FadeIn>

        {/* Resend */}
        <FadeIn direction="none" delay={0.2} className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t get the code?{" "}
            {cooldown > 0 ? (
              <span className="tabular-nums font-medium">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || status === "loading" || status === "success"}
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
          Wrong email?{" "}
          <Link href="/signup" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Go back
          </Link>
        </p>
      </FadeIn>
    </FadeIn>
  );
}

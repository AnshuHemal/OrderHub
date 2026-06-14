"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, RotateCcw, XCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordStrength(pw: string): "empty" | "weak" | "fair" | "strong" {
  if (!pw)           return "empty";
  if (pw.length <  8) return "weak";
  if (pw.length < 12) return "fair";
  return "strong";
}

const strengthConfig = {
  empty:  { width: "0%",   color: "bg-border",       label: ""       },
  weak:   { width: "33%",  color: "bg-destructive",  label: "Weak"   },
  fair:   { width: "66%",  color: "bg-yellow-500",   label: "Fair"   },
  strong: { width: "100%", color: "bg-green-500",    label: "Strong" },
};

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword]         = useState("");
  const [isPending, setIsPending]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Field-level errors
  const [firstNameErr, setFirstNameErr] = useState("");
  const [lastNameErr, setLastNameErr]   = useState("");
  const [emailErr, setEmailErr]         = useState("");
  const [passwordErr, setPasswordErr]   = useState("");

  const strength = passwordStrength(password);
  const sc       = strengthConfig[strength];

  function validate(firstName: string, lastName: string, email: string, pw: string) {
    const errors = {
      firstName: !firstName.trim() ? "First name is required." : "",
      lastName:  !lastName.trim()  ? "Last name is required."  : "",
      email:     !email.trim()            ? "Email is required."
               : !EMAIL_RE.test(email)    ? "Enter a valid email address."
               : "",
      password:  !pw               ? "Password is required."
               : pw.length < 8    ? "Password must be at least 8 characters."
               : "",
    };
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form      = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
    const lastName  = (form.elements.namedItem("lastName")  as HTMLInputElement).value.trim();
    const email     = (form.elements.namedItem("email")     as HTMLInputElement).value.trim();
    const pw        = (form.elements.namedItem("password")  as HTMLInputElement).value;

    const errs = validate(firstName, lastName, email, pw);
    setFirstNameErr(errs.firstName);
    setLastNameErr(errs.lastName);
    setEmailErr(errs.email);
    setPasswordErr(errs.password);
    if (Object.values(errs).some(Boolean)) return;

    setIsPending(true);
    const { error: authError } = await signUp.email({
      email,
      password: pw,
      name: `${firstName} ${lastName}`.trim(),
      callbackURL: "/dashboard",
    });

    if (authError) {
      setError(authError.message ?? "Something went wrong. Please try again.");
      setIsPending(false);
      return;
    }

    const params = new URLSearchParams({ email, password: pw });
    window.location.href = `/verify-email?${params.toString()}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name row */}
      <FadeIn delay={0.08} className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName" name="firstName" placeholder="Jane"
            autoComplete="given-name" disabled={isPending}
            onChange={() => setFirstNameErr("")}
            className={cn("h-11 border-border-color bg-background/30 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1 transition-all duration-200",
              firstNameErr && "border-destructive focus-visible:ring-destructive")}
          />
          {firstNameErr && <p className="text-xs text-destructive">{firstNameErr}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName" name="lastName" placeholder="Smith"
            autoComplete="family-name" disabled={isPending}
            onChange={() => setLastNameErr("")}
            className={cn("h-11 border-border-color bg-background/30 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1 transition-all duration-200",
              lastNameErr && "border-destructive focus-visible:ring-destructive")}
          />
          {lastNameErr && <p className="text-xs text-destructive">{lastNameErr}</p>}
        </div>
      </FadeIn>

      {/* Email */}
      <FadeIn delay={0.12} className="flex flex-col gap-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email" name="email" type="email" placeholder="you@cafe.com"
          autoComplete="email" disabled={isPending}
          onChange={() => setEmailErr("")}
          className={cn("h-11 border-border-color bg-background/30 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1 transition-all duration-200",
            emailErr && "border-destructive focus-visible:ring-destructive")}
        />
        {emailErr && <p className="text-xs text-destructive">{emailErr}</p>}
      </FadeIn>

      {/* Password + strength */}
      <FadeIn delay={0.16} className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            disabled={isPending}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordErr(""); setError(null); }}
            className={cn("h-11 pr-10 border-border-color bg-background/30 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1 transition-all duration-200",
              passwordErr && "border-destructive focus-visible:ring-destructive")}
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

        {/* Strength bar */}
        {password.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className={cn("h-full rounded-full transition-colors duration-300", sc.color)}
                animate={{ width: sc.width }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            <span className={cn("text-xs font-medium tabular-nums", {
              "text-destructive": strength === "weak",
              "text-yellow-500":  strength === "fair",
              "text-green-500":   strength === "strong",
            })}>
              {sc.label}
            </span>
          </div>
        )}
        {passwordErr && <p className="text-xs text-destructive">{passwordErr}</p>}
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
      <FadeIn delay={0.2}>
        <Button 
          type="submit" 
          className="mt-1 h-11 w-full gap-2 bg-gradient-to-r from-blue-600 to-primary text-white hover:from-blue-700 hover:to-primary-hover shadow-md shadow-blue-900/10 cursor-pointer transition-all duration-200" 
          disabled={isPending}
        >
          {isPending ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block"
              >
                <RotateCcw className="size-4" />
              </motion.span>
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              Create account
            </>
          )}
        </Button>
      </FadeIn>
    </form>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { FadeIn } from "@/components/motion/fade-in";
import { SignupForm } from "./_components/signup-form";
import { OAuthButtons } from "../_components/oauth-buttons";

export const metadata: Metadata = {
  title: "Create account",
  description: `Create your free ${siteConfig.name} account and start managing your cafe.`,
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <FadeIn className="flex flex-col gap-5">
      {/* Card */}
      <div className="glass-panel rounded-3xl px-8 py-9 shadow-xl relative overflow-hidden">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-accent opacity-90" />

        {/* Header */}
        <FadeIn direction="down" delay={0.05} className="mb-7 flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start managing your cafe terminal today
          </p>
        </FadeIn>

        {/* Form */}
        <SignupForm />

        {/* Terms */}
        <FadeIn direction="none" delay={0.32}>
          <p className="mt-5 text-center text-[10px] text-muted-foreground leading-normal">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </p>
        </FadeIn>
      </div>

      {/* Footer */}
      <FadeIn direction="none" delay={0.36}>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-accent underline-offset-4 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </FadeIn>
    </FadeIn>
  );
}

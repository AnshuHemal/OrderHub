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
      <div className="rounded-2xl border border-border bg-card px-8 py-9 shadow-lg shadow-black/5">

        {/* Header */}
        <FadeIn direction="down" delay={0.05} className="mb-7 flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Free to start — no credit card required
          </p>
        </FadeIn>


        {/* Form */}
        <SignupForm />

        {/* Terms */}
        <FadeIn direction="none" delay={0.32}>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </FadeIn>
      </div>

      {/* Footer */}
      <FadeIn direction="none" delay={0.36}>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </FadeIn>
    </FadeIn>
  );
}

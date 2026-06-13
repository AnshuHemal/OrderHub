import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { FadeIn } from "@/components/motion/fade-in";
import { LoginForm } from "./_components/login-form";
import { OAuthButtons } from "../_components/oauth-buttons";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${siteConfig.name} account.`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <FadeIn className="flex flex-col gap-5">
      {/* Card */}
      <div className="rounded-2xl border border-border bg-card px-8 py-9 shadow-lg shadow-black/5">

        {/* Header */}
        <FadeIn direction="down" delay={0.05} className="mb-7 flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your {siteConfig.name} account
          </p>
        </FadeIn>


        {/* Form */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer */}
      <FadeIn direction="none" delay={0.3}>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Create one free
          </Link>
        </p>
      </FadeIn>
    </FadeIn>
  );
}

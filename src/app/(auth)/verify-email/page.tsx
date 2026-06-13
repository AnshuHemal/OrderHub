import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { VerifyEmailForm } from "./_components/verify-email-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: `Enter the code sent to your email to activate your ${siteConfig.name} account.`,
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

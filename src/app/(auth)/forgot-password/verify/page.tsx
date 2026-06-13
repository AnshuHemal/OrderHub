import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { VerifyOtpForm } from "./_components/verify-otp-form";

export const metadata: Metadata = {
  title: "Enter reset code",
  description: `Enter the code sent to your email to reset your ${siteConfig.name} password.`,
  robots: { index: false, follow: false },
};

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: `Reset your ${siteConfig.name} password.`,
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}

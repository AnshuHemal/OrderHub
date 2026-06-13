import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/email";

const OTP_LENGTH   = 6;
const OTP_EXPIRES  = 600; // 10 minutes
// No ambiguous chars: 0/O, 1/I
const OTP_CHARSET  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOTP(): string {
  return Array.from({ length: OTP_LENGTH }, () =>
    OTP_CHARSET[Math.floor(Math.random() * OTP_CHARSET.length)],
  ).join("");
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret:  process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled:                  true,
    requireEmailVerification: true,
    minPasswordLength:        8,
  },

  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID     as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId:     process.env.GITHUB_CLIENT_ID     as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength:             OTP_LENGTH,
      expiresIn:             OTP_EXPIRES,
      generateOTP,
      sendVerificationOnSignUp: true,
      allowedAttempts:       5,
      resendStrategy:        "reuse",
      async sendVerificationOTP({ email, otp, type }) {
        // fire-and-forget — don't await so it doesn't block auth response
        sendOTPEmail({ to: email, otp, type });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User    = typeof auth.$Infer.Session.user;

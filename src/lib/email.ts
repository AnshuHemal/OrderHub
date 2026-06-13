import nodemailer from "nodemailer";
import { siteConfig } from "@/config/site";

const transporter = nodemailer.createTransport({
  host:   "smtp.gmail.com",
  port:   465,
  secure: true,
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? `${siteConfig.name} <noreply@orderhub.app>`;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await transporter.sendMail({ from: FROM, to, subject, html });
}

type OTPType = "email-verification" | "sign-in" | "forget-password" | "change-email";

export async function sendOTPEmail({
  to,
  otp,
  type,
}: {
  to: string;
  otp: string;
  type: OTPType;
}) {
  const subjects: Record<OTPType, string> = {
    "email-verification": `Verify your ${siteConfig.name} account`,
    "sign-in":            `Your ${siteConfig.name} sign-in code`,
    "forget-password":    `Reset your ${siteConfig.name} password`,
    "change-email":       `Confirm your new ${siteConfig.name} email`,
  };

  const headings: Record<OTPType, string> = {
    "email-verification": "Verify your email",
    "sign-in":            "Your sign-in code",
    "forget-password":    "Reset your password",
    "change-email":       "Confirm your new email",
  };

  const bodies: Record<OTPType, string> = {
    "email-verification": `Enter the code below to verify your email and activate your ${siteConfig.name} account.`,
    "sign-in":            `Enter the code below to sign in to ${siteConfig.name}.`,
    "forget-password":    `Enter the code below to reset your ${siteConfig.name} password.`,
    "change-email":       `Enter the code below to confirm your new email address.`,
  };

  await sendEmail({
    to,
    subject: subjects[type],
    html: buildOTPEmail({ otp, heading: headings[type], body: bodies[type] }),
  });
}

function buildOTPEmail({
  otp,
  heading,
  body,
}: {
  otp: string;
  heading: string;
  body: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr>
          <td style="padding:28px 36px 20px;border-bottom:1px solid #f4f4f5;">
            <span style="font-size:20px;font-weight:800;color:#0f172a;">Order<span style="color:#3b82f6;">Hub</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <h1 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#0f172a;">${heading}</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#71717a;">${body}</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:#f4f4f5;border-radius:12px;padding:16px 24px;">
                  <span style="font-size:28px;font-weight:800;letter-spacing:6px;color:#0f172a;font-family:'Courier New',monospace;">${otp}</span>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px;font-size:13px;color:#a1a1aa;">Expires in <strong style="color:#71717a;">10 minutes</strong>.</p>
            <p style="margin:0;font-size:13px;color:#a1a1aa;">If you didn't request this, ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 36px;border-top:1px solid #f4f4f5;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

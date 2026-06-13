import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { FadeIn } from "@/components/motion/fade-in";
import { getSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">

      {/* Subtle grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right,hsl(var(--border))1px,transparent 1px)," +
            "linear-gradient(to bottom,hsl(var(--border))1px,transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.4,
        }}
      />
      {/* Radial vignette to fade the grid at edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, hsl(var(--background)) 100%)",
        }}
      />

      {/* Accent glow — top center */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "hsl(214 100% 50%)" }}
      />

      {/* Logo top-left */}
      <FadeIn direction="down" className="absolute left-6 top-6 z-10">
        <Logo size={24} />
      </FadeIn>

      {/* Form content */}
      <main className="relative z-10 w-full max-w-[400px]">
        {children}
      </main>

      {/* Footer links */}
      <FadeIn
        direction="none"
        delay={0.4}
        className="relative z-10 mt-8 flex items-center gap-4 text-xs text-muted-foreground"
      >
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        <span aria-hidden>·</span>
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
      </FadeIn>
    </div>
  );
}

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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background font-sans text-foreground">

      {/* Grid background overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-color)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15"
      />

      {/* Radial glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_40%,var(--background)_100%)]"
      />

      {/* Glowing spotlight blobs for beautiful aesthetics */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-stone-900 to-stone-950 opacity-15">
        <div className="absolute top-[20%] left-[30%] h-[400px] w-[400px] rounded-full bg-primary/10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[20%] right-[20%] h-[350px] w-[350px] rounded-full bg-blue-900/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Logo */}
      <FadeIn direction="down" className="absolute left-6 top-6 z-10">
        <Logo size={24} />
      </FadeIn>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-sm">
        {children}
      </main>

      {/* Centered Footer */}
      <FadeIn direction="none" delay={0.35} className="relative z-10 mt-8 flex items-center gap-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <span aria-hidden>·</span>
        <Link href="/help" className="hover:text-foreground transition-colors">
          Help
        </Link>
      </FadeIn>

    </div>
  );
}

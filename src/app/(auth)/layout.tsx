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
    <div className="relative flex min-h-screen w-full bg-background font-sans text-foreground">
      {/* Grid container */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12">
        
        {/* Left column (Form container) */}
        <div className="relative col-span-1 lg:col-span-6 xl:col-span-5 flex min-h-screen flex-col justify-between px-6 py-10 sm:px-10 lg:px-12 z-10 bg-background/50 backdrop-blur-[2px]">
          {/* Subtle grid background for form side */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "linear-gradient(to right,var(--border-color) 1px,transparent 1px)," +
                "linear-gradient(to bottom,var(--border-color) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
              opacity: 0.15,
            }}
          />

          {/* Top Header */}
          <div className="flex items-center justify-between">
            <FadeIn direction="down" delay={0.05}>
              <div className="hover:opacity-90 transition-opacity">
                <Logo size={28} />
              </div>
            </FadeIn>
            <FadeIn direction="down" delay={0.05}>
              <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border-color px-3 py-1.5 rounded-full bg-background/50 hover:bg-card">
                Back Home
              </Link>
            </FadeIn>
          </div>

          {/* Form Content Wrapper */}
          <div className="my-auto flex w-full justify-center">
            <main className="w-full max-w-[420px] py-10">
              {children}
            </main>
          </div>

          {/* Footer links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-color/55 pt-6 text-xs text-muted-foreground">
            <FadeIn direction="none" delay={0.3}>
              <p>&copy; {new Date().getFullYear()} OrderHub. All rights reserved.</p>
            </FadeIn>
            <FadeIn direction="none" delay={0.35} className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </FadeIn>
          </div>
        </div>

        {/* Right column (Visual showcase - hidden on small viewports) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative flex-col items-center justify-center overflow-hidden border-l border-border-color bg-stone-950 p-12">
          {/* Glowing spotlights */}
          <div className="absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-stone-900 to-stone-950">
            <div className="absolute top-[20%] left-[30%] h-[400px] w-[400px] rounded-full bg-amber-900/10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[20%] right-[20%] h-[350px] w-[350px] rounded-full bg-amber-700/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
          </div>

          {/* Cafe dotted pattern layer */}
          <div className="absolute inset-0 -z-10 opacity-[0.03] cafe-pattern" />

          {/* Showcase Content */}
          <div className="relative flex flex-col items-center max-w-[480px] text-center z-10">
            
            {/* Visual ticket preview mockup */}
            <div className="relative w-full max-w-[340px] mb-12 rounded-2xl border border-stone-850 bg-stone-900/40 p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-semibold text-emerald-400 tracking-wider">KDS SYNC ACTIVE</span>
                </div>
                <span className="text-[9px] font-mono text-stone-500">TICKET #0482</span>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-300 font-medium">3x Double Espresso</span>
                  <span className="font-mono text-stone-400 font-medium">$10.50</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-300 font-medium">2x Flaky Croissant</span>
                  <span className="font-mono text-stone-400 font-medium">$6.40</span>
                </div>
                <div className="h-px bg-stone-800/80 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-400 font-medium">Table T-102</span>
                  <span className="text-amber-500 font-bold tracking-tight text-sm font-mono">$16.90</span>
                </div>
              </div>
              
              <div className="mt-5 flex gap-2">
                <div className="flex-1 h-7 rounded-lg bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-[9px] font-semibold text-emerald-400">
                  Paid
                </div>
                <div className="flex-1 h-7 rounded-lg bg-stone-800/40 border border-stone-700/30 flex items-center justify-center text-[9px] font-semibold text-stone-300">
                  Receipt Printed
                </div>
              </div>
            </div>

            {/* Typography */}
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-4">
              Designed for Speed. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Built for Elite Cafes.</span>
            </h2>
            
            <p className="text-sm text-stone-400 leading-relaxed mb-8">
              OrderHub consolidates real-time table layouts, automated promotions, and direct kitchen sync into a seamless browser-based POS terminal.
            </p>

            {/* Feature lists */}
            <div className="grid grid-cols-2 gap-4 text-left w-full">
              <div className="p-4 rounded-xl border border-stone-900 bg-stone-950/40">
                <div className="text-xs font-semibold text-amber-500 mb-1">⚡ 100ms Latency</div>
                <p className="text-[11px] text-stone-500 leading-normal">Optimized routes from terminal to cooking display.</p>
              </div>
              <div className="p-4 rounded-xl border border-stone-900 bg-stone-950/40">
                <div className="text-xs font-semibold text-amber-500 mb-1">📊 Auto Promotion</div>
                <p className="text-[11px] text-stone-500 leading-normal">Product quantities trigger item-level discounts instantly.</p>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/motion/fade-in";
import { Logo } from "@/components/shared/logo";
import { useTheme } from "next-themes";
import {
  Coffee, Plus, Minus, Check, LogOut, Settings,
  TrendingUp, Menu, X, ChefHat, ArrowRight, Sparkles,
  ShoppingBag, RotateCcw, Sun, Moon, LayoutGrid,
  Smartphone, BarChart3, Users, Zap, Star,
  IndianRupee, Activity, Store, ChevronRight, HelpCircle,
  CheckCircle2
} from "lucide-react";

// ── Simulator types ────────────────────────────────────────────────────────────
interface SimItem  { id: string; name: string; price: number; category: string; emoji: string }
interface CartItem { product: SimItem; quantity: number }

// ── Feature cards data ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: LayoutGrid,
    emoji: "🗺️",
    title: "Live Floor Plans",
    desc: "Visual table layouts with one-click status updates — Available, Occupied, Reserved, Dirty.",
    color: "text-amber-650 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20",
  },
  {
    icon: ChefHat,
    emoji: "🖥️",
    title: "Kitchen Display (KDS)",
    desc: "Live ticket columns for cook staff. Track prep times and advance cooking stages instantly.",
    color: "text-orange-655 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20",
  },
  {
    icon: Smartphone,
    emoji: "📱",
    title: "UPI QR Payments",
    desc: "Auto-generated QR codes with pre-filled order totals. No gateway needed — straight to your bank.",
    color: "text-violet-655 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/20",
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "Live Analytics",
    desc: "Daily revenue graphs, top-selling items, average bill value, and cashier register logs.",
    color: "text-emerald-655 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20",
  },
  {
    icon: Users,
    emoji: "👥",
    title: "Multi-Role Staff",
    desc: "Owner, Manager, Staff and Kitchen roles — each with scoped access and permissions.",
    color: "text-blue-655 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Instant Receipts",
    desc: "Thermal receipt preview with print support and email delivery at order completion.",
    color: "text-yellow-655 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/20",
  },
];

// ── Stats data ─────────────────────────────────────────────────────────────────
const STATS = [
  { value: 99,  suffix: "%",    label: "Session Uptime SLA"    },
  { value: 5,   suffix: "min",  label: "To First Sale Setup"   },
  { value: 200, suffix: "+",    label: "Cafes Onboarded"       },
  { value: 4,   suffix: ".9 ★",  label: "Staff Portal Rating"  },
];

// ── Simulator items ────────────────────────────────────────────────────────────
const SIM_CATS  = ["Coffee", "Cold Brews", "Snacks", "Pastries"];
const SIM_ITEMS: SimItem[] = [
  { id: "s1", name: "Double Espresso",   price: 180, category: "Coffee",     emoji: "☕" },
  { id: "s2", name: "Creamy Cappuccino", price: 220, category: "Coffee",     emoji: "🥛" },
  { id: "s3", name: "Nitro Cold Brew",   price: 260, category: "Cold Brews", emoji: "🧊" },
  { id: "s4", name: "Avocado Toast",     price: 380, category: "Snacks",     emoji: "🥑" },
  { id: "s5", name: "Warm Brownie",      price: 150, category: "Snacks",     emoji: "🍰" },
  { id: "s6", name: "Butter Croissant",  price: 140, category: "Pastries",   emoji: "🥐" },
];

// ── Pricing Plans ──────────────────────────────────────────────────────────────
const PRICING_PLANS = [
  {
    name: "Starter",
    price: "₹0",
    period: "forever",
    desc: "Perfect for single-counter local coffee stalls and kiosks.",
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
    features: [
      "1 Active POS Terminal Connection",
      "Dynamic UPI QR checkout codes",
      "Basic Table Status Layout",
      "Print Receipt support",
      "Email receipt delivery",
    ],
  },
  {
    name: "Pro Cafe",
    price: "₹1,499",
    period: "per month",
    desc: "For growing coffee shops that need full sync, KDS, and analytics.",
    cta: "Start Free Trial",
    href: "/signup",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Unlimited POS Terminal Connections",
      "Real-time KDS (Kitchen Display) sync",
      "Multi-Role Staff permissions",
      "Advanced Analytics dashboard & charts",
      "Role-restricted Coupons & Promotions",
      "Priority Email & Chat support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact sales",
    desc: "For multi-outlet cafe chains with custom system requirements.",
    cta: "Contact Sales",
    href: "mailto:hello@orderhub.com",
    highlighted: false,
    features: [
      "Everything in Pro Cafe",
      "Dedicated Database instances",
      "SLA system performance guarantee",
      "Custom ERP integration support",
      "Audit trail logs",
      "Dedicated accounts manager",
    ],
  },
];

// ── FAQs data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Do I need special hardware to run OrderHub?",
    a: "No special hardware is required! OrderHub POS runs smoothly in the web browser of any tablet, iPad, smartphone, laptop, or desktop computer. You can also print receipts using standard thermal printers.",
  },
  {
    q: "How do dynamic UPI QR payments work?",
    a: "When checking out, OrderHub generates a dynamic UPI QR code with your specific merchant UPI ID and the exact order total. The customer simply scans it with GPay, Paytm, or PhonePe, and the correct amount is automatically pre-filled. The payment goes directly to your bank account without any third-party gateway fees!",
  },
  {
    q: "Does the KDS sync instantly?",
    a: "Yes! The Kitchen Display System (KDS) and POS cashier screens communicate instantly. When cashiers add items or process checks, the kitchen screen displays the new tickets in real-time, helping cook staff prepare orders faster.",
  },
];

// ── Mockup KDS columns data ───────────────────────────────────────────────────
const MOCK_KDS_COLS = [
  {
    label: "Pending",
    color: "bg-muted-foreground/30",
    cards: [
      { title: "Double Espresso × 2", tag: "Table 104", priority: "medium" },
      { title: "Nitro Cold Brew × 1", tag: "Takeaway", priority: "low" },
    ],
  },
  {
    label: "Preparing",
    color: "bg-primary/30",
    cards: [
      { title: "Creamy Cappuccino × 1", tag: "Table 202", priority: "high" },
      { title: "Warm Brownie × 2", tag: "Table 101", priority: "medium" },
    ],
  },
  {
    label: "Ready",
    color: "bg-yellow-500/30",
    cards: [
      { title: "Avocado Toast × 1", tag: "Table 105", priority: "urgent" },
    ],
  },
  {
    label: "Served",
    color: "bg-emerald-500/30",
    cards: [
      { title: "Iced Latte × 2", tag: "Takeaway", priority: "low" },
    ],
  },
];

const MOCK_PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

// ── Count-up animation hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);

  return count;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { currentUser, activeSession, sessionsList, logout, openSession, closeSession } = useApp();

  const [isConsoleOpen,   setIsConsoleOpen]   = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openingBalance,  setOpeningBalance]  = useState("500.00");
  const [drawerError,     setDrawerError]     = useState("");
  const [drawerSuccess,   setDrawerSuccess]   = useState("");

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Simulator state ──────────────────────────────────────────────────────────
  const [simCat,      setSimCat]      = useState("Coffee");
  const [cart,        setCart]        = useState<CartItem[]>([]);
  const [coupon,      setCoupon]      = useState("");
  const [discount,    setDiscount]    = useState(0);
  const [simStep,     setSimStep]     = useState<"order" | "paying" | "done">("order");

  const addToCart = (p: SimItem) =>
    setCart(prev => {
      const ex = prev.find(i => i.product.id === p.id);
      return ex
        ? prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product: p, quantity: 1 }];
    });

  const updateQty = (id: string, d: number) =>
    setCart(prev =>
      prev.map(i => i.product.id === id ? { ...i, quantity: i.quantity + d } : i)
          .filter(i => i.quantity > 0),
    );

  const subtotal    = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tax         = subtotal * 0.05;
  const discountVal = (subtotal + tax) * (discount / 100);
  const total       = Math.max(0, subtotal + tax - discountVal);

  const handleCheckout = () => {
    setSimStep("paying");
    setTimeout(() => setSimStep("done"), 1500);
  };
  const resetSim = () => { setCart([]); setCoupon(""); setDiscount(0); setSimStep("order"); };

  // ── Drawer session ───────────────────────────────────────────────────────────
  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError(""); setDrawerSuccess("");
    const bal = parseFloat(openingBalance);
    if (isNaN(bal) || bal < 0) { setDrawerError("Enter a valid opening balance."); return; }
    openSession(bal);
    setDrawerSuccess("Session opened!");
    setTimeout(() => { setIsConsoleOpen(false); router.push("/terminal"); }, 900);
  };

  const closedSessions = sessionsList.filter(s => s.status === "closed" || s.status === "CLOSED");
  const lastSession    = closedSessions[closedSessions.length - 1] ?? null;

  // ── Filtered simulator items ─────────────────────────────────────────────────
  const visibleItems = SIM_ITEMS.filter(i => i.category === simCat);

  // ── Stats row visible check ──────────────────────────────────────────────────
  const [statsActive, setStatsActive] = useState(false);
  useEffect(() => {
    setStatsActive(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ══════════════════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

          {/* Logo */}
          <Logo size={26} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {[["#features", "Features"], ["#simulator", "Playground"], ["#pricing", "Pricing"], ["#faqs", "FAQs"]].map(([href, label]) => (
              <a key={href} href={href}
                className="relative py-1 transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all hover:after:w-full"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {!mounted ? <div className="size-4 animate-pulse rounded bg-muted" /> :
               resolvedTheme === "dark"
                ? <Sun  className="size-4 text-amber-400" />
                : <Moon className="size-4" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="size-2 animate-pulse rounded-full bg-green-500" />
                  {currentUser.name}
                </span>
                <button onClick={() => setIsConsoleOpen(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer">
                  Console
                </button>
              </div>
            ) : (
              <>
                <Link href="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Sign In
                </Link>
                <Link href="/signup"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button onClick={() => setIsMobileNavOpen(v => !v)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden">
            {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-1 border-t border-border bg-background px-6 py-4 md:hidden"
            >
              {[["#features","Features"],["#simulator","Playground"],["#pricing","Pricing"],["#faqs","FAQs"]].map(([href,label]) => (
                <a key={href} href={href} onClick={() => setIsMobileNavOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  {label}
                </a>
              ))}
              <div className="my-2 h-px bg-border" />
              <div className="flex items-center justify-between px-3">
                <span className="text-xs font-medium text-muted-foreground">Theme</span>
                <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                  {resolvedTheme === "dark" ? <><Sun className="size-3.5 text-amber-400" />Light</> : <><Moon className="size-3.5" />Dark</>}
                </button>
              </div>
              <div className="my-2 h-px bg-border" />
              {currentUser ? (
                <button onClick={() => { setIsMobileNavOpen(false); setIsConsoleOpen(true); }}
                  className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white">
                  Open Console
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMobileNavOpen(false)}
                    className="py-2 text-center text-sm font-medium text-muted-foreground">
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileNavOpen(false)}
                    className="rounded-lg bg-primary py-2 text-center text-xs font-semibold text-white">
                    Get Started Free
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>


      {/* ══════════════════════════════════════════════════════════════════════
          HERO (TREXO THEME)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative flex flex-col items-center overflow-hidden px-6 pb-0 pt-24 text-center lg:pt-32"
      >
        {/* Glow orb */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center pt-16">
          <div className="h-[500px] w-[900px] rounded-full bg-primary/8 blur-[120px]" />
        </div>

        {/* Grid lines layout strip */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,transparent_30%,var(--background)_100%)]" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm shadow-sm"
          >
            <Sparkles className="size-3.5 text-primary" />
            Modern cafe management — built for speed
          </motion.div>

          {/* Heading and sub text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Serve faster.{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Run better.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              A high-performance cafe checkout terminal. Instantly manage table visual maps, coordinate cooks using real-time KDS tickets, and accept dynamic UPI QR payments.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            {currentUser ? (
              <>
                <button onClick={() => setIsConsoleOpen(true)}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all min-w-44 gap-2 cursor-pointer">
                  Launch POS Session <ArrowRight className="size-4" />
                </button>
                <button onClick={() => router.push("/dashboard")}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-semibold text-foreground hover:bg-muted min-w-44 transition-colors cursor-pointer">
                  Admin Panel
                </button>
              </>
            ) : (
              <>
                <Link href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all min-w-44 gap-2">
                  Get Started Free <ArrowRight className="size-4" />
                </Link>
                <a href="#simulator"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-semibold text-foreground hover:bg-muted min-w-44 transition-colors">
                  POS Playground
                </a>
              </>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-xs text-muted-foreground"
          >
            No gateway fee required &middot; Free setup for single cash registers
          </motion.p>
        </div>

        {/* Mockup (TREXO 3D tilt style) */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 6 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ perspective: 1200, transformStyle: "preserve-3d" }}
          className="relative z-10 mt-16 w-full max-w-5xl"
        >
          {/* Mockup shadow */}
          <div aria-hidden className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl" />

          {/* Browser frame */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/10 ring-1 ring-border/50">
            {/* Dots */}
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-yellow-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <div className="mx-auto flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 py-1 text-[10px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary/60" />
                orderhub-pos.app/terminal/session/active
              </div>
            </div>

            {/* Simulated KDS board inside the terminal mockup */}
            <div className="flex h-[340px] sm:h-[390px]">
              {/* Sidebar */}
              <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-border bg-muted/20 p-3 sm:flex text-left">
                <div className="mb-2 flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5">
                  <div className="size-5 rounded bg-primary/20 flex items-center justify-center text-xs">☕</div>
                  <span className="text-[11px] font-semibold text-foreground">OrderHub terminal</span>
                </div>
                {["Floor Map", "Cook Feed (KDS)", "Transactions", "Promotions", "Settings"].map((item, i) => (
                  <div key={item}
                    className={`rounded-md px-2 py-1.5 text-[11px] font-medium ${
                      i === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Cook feed board container */}
              <div className="flex-1 overflow-x-auto p-4 text-left">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Active Kitchen Orders — Sync Live
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-4/5 rounded-full bg-primary" />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-bold">80% Ready</span>
                  </div>
                </div>

                {/* KDS Column Grid (Mirrors Trexo Hero Board) */}
                <div className="flex gap-3 min-w-0">
                  {MOCK_KDS_COLS.map((col, ci) => (
                    <div key={col.label} className="flex w-40 shrink-0 flex-col gap-2">
                      {/* Column Header */}
                      <div className="flex items-center gap-1.5 px-1">
                        <span className={`size-1.5 rounded-full ${col.color}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {col.label}
                        </span>
                        <span className="ml-auto text-[9px] text-muted-foreground/60 font-bold">
                          {col.cards.length}
                        </span>
                      </div>
                      {/* Column Tickets */}
                      {col.cards.map((card, ki) => (
                        <motion.div
                          key={card.title}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + ci * 0.1 + ki * 0.05, duration: 0.3 }}
                          className="rounded-lg border border-border bg-card p-2 shadow-sm space-y-1.5"
                        >
                          <p className="text-[10px] font-bold leading-snug text-foreground">
                            {card.title}
                          </p>
                          <div className="flex items-center justify-between text-[8px] font-semibold">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                              {card.tag}
                            </span>
                            <span className={`size-1.5 rounded-full ${MOCK_PRIORITY_COLORS[card.priority]}`} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>

          <div aria-hidden className="absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(to_top,var(--background)_25%,transparent_100%)] z-20 pointer-events-none" />
        </motion.div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          LOGOS STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-b border-border/40 bg-muted/5 py-8 text-center text-xs font-semibold text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-55">
          <span className="tracking-wide">TRUSTED BY LOCAL ROASTERS</span>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <span className="font-mono hover:text-foreground transition-colors">BLUE BOTTLE CAFE</span>
          <span className="font-mono hover:text-foreground transition-colors">STUMPTOWN COFFEE</span>
          <span className="font-mono hover:text-foreground transition-colors">THIRD WAVE ROASTERS</span>
          <span className="font-mono hover:text-foreground transition-colors">ESPRESSO HOUSE</span>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES GRID (TREXO STYLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="px-6 py-24 lg:py-32 relative z-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              System Capabilities
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Everything your cafe needs
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Designed for speed and checkout workflow optimization. Ditch complicated setup steps.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-black/5 flex flex-col justify-between"
                >
                  <div>
                    <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                      {feat.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          INTERACTIVE SANDBOX
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="simulator" className="relative z-10 border-y border-border/50 bg-muted/10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Interactive Sandbox
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Experience the POS Playground
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
              Add check items, apply coupons, and simulate cash drawer checkout. Try code <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold">WELCOME10</kbd> for 10% off.
            </p>
          </div>

          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-12">
              {/* Products list */}
              <div className="flex flex-col border-b border-border p-6 lg:col-span-7 lg:border-b-0 lg:border-r">
                <div className="mb-5 flex flex-wrap gap-2">
                  {SIM_CATS.map(cat => (
                    <button key={cat} onClick={() => setSimCat(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        simCat === cat
                          ? "bg-primary text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-primary/10"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 flex-1">
                  <AnimatePresence mode="wait">
                    {visibleItems.map((p, i) => (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => addToCart(p)}
                        className="group flex h-28 flex-col justify-between rounded-xl border border-border bg-background p-3 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{p.emoji}</span>
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-bold border border-border">₹{p.price}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{p.category}</p>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Cart checklist */}
              <div className="flex flex-col bg-muted/20 p-6 lg:col-span-5 border-t lg:border-t-0">
                <AnimatePresence mode="wait">
                  {simStep === "order" && (
                    <motion.div key="order" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex h-full flex-col gap-5">
                      <h3 className="flex items-center gap-2 border-b border-border pb-3 text-xs font-bold uppercase tracking-wider text-foreground">
                        <ShoppingBag className="size-4 text-primary" /> Active cart
                      </h3>

                      {cart.length > 0 ? (
                        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                          {cart.map(item => (
                            <motion.div key={item.product.id}
                              className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-xs shadow-2xs">
                              <div>
                                <p className="font-bold text-foreground">{item.product.name}</p>
                                <p className="text-[9px] text-muted-foreground font-semibold">₹{item.product.price} each</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => updateQty(item.product.id, -1)}
                                  className="size-6 rounded bg-muted hover:bg-primary/10 flex items-center justify-center cursor-pointer">
                                  <Minus className="size-2.5" />
                                </button>
                                <span className="w-4 text-center font-mono font-bold text-[11px]">{item.quantity}</span>
                                <button onClick={() => addToCart(item.product)}
                                  className="size-6 rounded bg-muted hover:bg-primary/10 flex items-center justify-center cursor-pointer">
                                  <Plus className="size-2.5" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground py-10">
                          <Coffee className="size-8 stroke-1 text-muted-foreground/60" />
                          <p className="text-xs font-semibold">Kiosk cart is empty</p>
                        </div>
                      )}

                      {cart.length > 0 && (
                        <div className="mt-auto space-y-4 border-t border-border pt-4">
                          <div className="flex gap-2">
                            <input value={coupon} onChange={e => setCoupon(e.target.value)}
                              placeholder="Code: WELCOME10"
                              className="h-8 flex-1 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs" />
                            <button onClick={() => {
                              if (coupon.toUpperCase() === "WELCOME10") setDiscount(10);
                              else alert("Invalid code. Try WELCOME10");
                            }} className="h-8 rounded-lg bg-muted px-4 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-border">
                              Apply
                            </button>
                          </div>

                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono font-bold text-foreground">₹{subtotal.toFixed(0)}</span></div>
                            <div className="flex justify-between"><span>GST &amp; Taxes (5%)</span><span className="font-mono font-bold text-foreground">₹{tax.toFixed(0)}</span></div>
                            {discount > 0 && (
                              <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Discount (WELCOME10)</span>
                                <span className="font-mono font-bold">−₹{discountVal.toFixed(0)}</span>
                              </div>
                            )}
                            <div className="my-1.5 h-px bg-border" />
                            <div className="flex justify-between text-sm font-bold text-foreground">
                              <span>Total check</span>
                              <span className="font-mono text-primary font-bold">₹{total.toFixed(0)}</span>
                            </div>
                          </div>

                          <button onClick={handleCheckout}
                            className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer">
                            Simulate Payment
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {simStep === "paying" && (
                    <motion.div key="paying" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-12">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="rounded-full border border-primary/20 bg-primary/10 p-3 text-primary">
                        <RotateCcw className="size-8" />
                      </motion.div>
                      <h4 className="text-sm font-semibold text-foreground">Settling check...</h4>
                      <p className="text-xs text-muted-foreground">Resolving transaction via backend gateway</p>
                    </motion.div>
                  )}

                  {simStep === "done" && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-1 flex-col items-center justify-center gap-5 text-center py-4">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 450, damping: 22 }}
                        className="rounded-full border border-green-500/20 bg-green-500/10 p-2.5 text-green-600">
                        <Check className="size-7" />
                      </motion.div>
                      <div>
                        <h4 className="text-sm font-bold text-green-600">Check Settled successfully!</h4>
                        <p className="mt-1 text-xs text-muted-foreground">Session cash reconciled · Invoice ready</p>
                      </div>

                      {/* Mini receipt */}
                      <div className="receipt-paper w-full max-w-[200px] space-y-1.5 rounded-lg border border-border p-4 text-[10px] text-stone-850 text-left shadow-md">
                        <p className="text-center font-bold text-stone-900 tracking-wider">** ORDERHUB CAFE **</p>
                        <p className="text-center font-mono text-[8px] text-stone-500">{new Date().toLocaleString()}</p>
                        <div className="my-1 border-t border-dashed border-stone-300" />
                        {cart.map(i => (
                          <div key={i.product.id} className="flex justify-between font-mono">
                            <span>{i.product.name.slice(0, 14)} ×{i.quantity}</span>
                            <span>₹{(i.product.price * i.quantity)}</span>
                          </div>
                        ))}
                        <div className="my-1.5 border-t border-dashed border-stone-300" />
                        <div className="flex justify-between font-bold font-mono text-stone-900">
                          <span>TOTAL CHECK</span><span>₹{total.toFixed(0)}</span>
                        </div>
                        <p className="text-center italic text-[8px] text-stone-500 mt-2">Thank you! Visit again ☕</p>
                      </div>

                      <button onClick={resetSim}
                        className="rounded-lg border border-border bg-card px-6 py-2 text-xs font-semibold transition-all hover:bg-primary hover:text-white cursor-pointer shadow-sm">
                        New simulated check
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          STATS ROW (TREXO STYLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="border-y border-border/50 bg-muted/10 px-6 py-16 relative z-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {STATS.map((stat, i) => {
              const count = useCountUp(stat.value, 1000, statsActive);
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex flex-col items-center gap-1 text-center"
                >
                  <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {count}
                    <span className="text-primary">{stat.suffix}</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          PRICING (TREXO STYLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative px-6 py-24 lg:py-32 z-10 border-b border-border/40">
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Pricing
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Simple, honest pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Start free. Upgrade when you need to. No setup fees.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.1,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className={`relative flex flex-col justify-between rounded-2xl border p-8 bg-card ${
                  plan.highlighted
                    ? "border-primary shadow-xl shadow-primary/5 ring-2 ring-primary"
                    : "border-border shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-white shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-6">
                    <h3 className="mb-1.5 text-lg font-bold text-foreground">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        / {plan.period}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="my-6 h-px bg-border" />

                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link href={plan.href}
                    className={`inline-flex h-10 w-full items-center justify-center rounded-lg text-xs font-bold transition-colors shadow-2xs ${
                      plan.highlighted
                        ? "bg-primary text-white hover:opacity-90"
                        : "border border-border bg-card text-foreground hover:bg-muted"
                    }`}>
                    {plan.cta}
                  </Link>
                </div>

              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          FAQs (TREXO STYLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="faqs" className="relative px-6 py-24 lg:py-32 z-10 bg-muted/10 border-b border-border/40">
        <div className="mx-auto max-w-4xl">
          <FadeIn direction="up" className="mb-14 text-center">
            <span className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary block">
              FAQs
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">Frequently Asked Questions</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Quick answers to common questions about setting up and printing receipts.
            </p>
          </FadeIn>

          <div className="space-y-4 max-w-2xl mx-auto">
            {FAQS.map((faq, idx) => (
              <FadeIn key={faq.q} delay={idx * 0.05} direction="up">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-left">
                  <h3 className="text-sm font-bold text-foreground flex items-start gap-2.5">
                    <span className="text-primary">Q.</span>
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium pl-5 border-l border-primary/20">
                    {faq.a}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          CTA BANNER (TREXO STYLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 py-24 lg:py-32 z-10 bg-background">
        {/* Glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[800px] rounded-full bg-primary/8 blur-[100px]" />
        </div>

        {/* Grid lines */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,var(--background)_100%)]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center gap-6"
          >
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Ready to{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                serve faster?
              </span>
            </h2>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground font-medium">
              Join cafes and coffee roasters that have already accelerated checkout. Set up your active cashier register session in minutes.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all min-w-44 gap-2">
                Get Started Free <ArrowRight className="size-4" />
              </Link>
              <a href="#simulator"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-semibold text-foreground hover:bg-muted min-w-44 transition-colors">
                Try Simulator
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              No credit card required &middot; Free setup for single terminals
            </p>
          </motion.div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER (TREXO STYLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-border bg-background py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <Logo size={22} />
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} OrderHub POS &middot; Styled with speed.
          </p>
          <div className="flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#simulator" className="hover:text-foreground transition-colors">Playground</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            {currentUser
              ? <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              : <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            }
          </div>
        </div>
      </footer>


      {/* ══════════════════════════════════════════════════════════════════════
          SESSION CONSOLE SLIDE-OVER
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isConsoleOpen && currentUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsConsoleOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workspace Control</p>
                  <h3 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-foreground">
                    <Settings className="size-5 text-primary" /> Session Console
                  </h3>
                </div>
                <button onClick={() => setIsConsoleOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted cursor-pointer">
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 space-y-6 px-6 py-5 text-left">
                {/* User badge */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-base font-bold">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{currentUser.name}</p>
                    <p className="truncate text-xs text-muted-foreground font-semibold">{currentUser.email}</p>
                  </div>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                    {currentUser.role}
                  </span>
                </div>

                {/* Messages */}
                <AnimatePresence>
                  {drawerError && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                      ⚠️ {drawerError}
                    </motion.div>
                  )}
                  {drawerSuccess && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm font-medium text-green-600">
                      ✅ {drawerSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Session area */}
                {activeSession ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
                      <p className="text-sm font-bold text-green-600 flex items-center justify-center gap-1.5">
                        <span className="size-2 animate-pulse rounded-full bg-green-500" />
                        Session Active
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground font-semibold">Opening balance: ₹{activeSession.openingBalance.toFixed(2)}</p>
                    </div>
                    <button onClick={() => { setIsConsoleOpen(false); router.push("/terminal"); }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer">
                      Resume Terminal
                    </button>
                    <button onClick={async () => {
                      const amountStr = prompt("Enter counted cash in drawer (₹):", "1000");
                      if (amountStr !== null) {
                        const amt = parseFloat(amountStr) || 0;
                        try {
                          await closeSession(amt);
                          setDrawerSuccess("Session closed successfully!");
                        } catch (err: any) {
                          setDrawerError(err.message || "Failed to close session");
                        }
                      }
                    }}
                      className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-bold text-stone-750 hover:bg-muted transition-all cursor-pointer">
                      Close Cash Register
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleOpenSession} className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Create POS Cash Drawer Session</p>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-stone-750">Opening Float Balance (₹)</label>
                      <input type="number" step="0.01" min="0" required
                        value={openingBalance}
                        onChange={e => setOpeningBalance(e.target.value)}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs" />
                    </div>
                    <button type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer">
                      🚀 Open POS Session
                    </button>
                  </form>
                )}

                {/* Last session */}
                {lastSession && (
                  <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5 shadow-2xs">
                    <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Last Closed Session</p>
                    <p className="text-xs text-stone-500 font-semibold">{new Date(lastSession.closedAt || "").toLocaleString()}</p>
                    <div className="h-px bg-border my-1" />
                    <p className="font-bold text-foreground text-base">Closing Balance: ₹{(lastSession.closingFloat ?? lastSession.openingBalance).toFixed(2)}</p>
                  </div>
                )}

                {/* Quick nav */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Access Modules</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsConsoleOpen(false); router.push("/kitchen"); }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-sm font-bold transition-all hover:bg-muted cursor-pointer shadow-2xs">
                      <ChefHat className="size-4 text-primary" /> Kitchen Display
                    </button>
                    {(["admin","OWNER","MANAGER"] as string[]).includes(currentUser.role) && (
                      <button onClick={() => { setIsConsoleOpen(false); router.push("/backend"); }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-sm font-bold transition-all hover:bg-muted cursor-pointer shadow-2xs">
                        <Settings className="size-4 text-primary" /> Admin Panel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="border-t border-border px-6 py-4">
                <button onClick={() => { logout(); setIsConsoleOpen(false); }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/5 cursor-pointer">
                  <LogOut className="size-4" /> Sign Out of Account
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, User, PosSession } from "@/app/context/AppContext";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/motion/fade-in";
import { useTheme } from "next-themes";
import {
  Coffee,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Check,
  LogOut,
  User as UserIcon,
  Settings,
  CreditCard,
  TrendingUp,
  Menu,
  X,
  Lock,
  Layers,
  ChefHat,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Sun,
  Moon
} from "lucide-react";

// Types for the Interactive POS Simulator
interface SimulatorItem {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

interface CartItem {
  product: SimulatorItem;
  quantity: number;
}

export default function Home() {
  const router = useRouter();
  const {
    currentUser,
    activeSession,
    sessionsList,
    login,
    signup,
    logout,
    openSession,
    closeSession,
    orders
  } = useApp();

  // Navigation and Slide-over states
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("50.00");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==========================================
  // Interactive Simulator States & Logic
  // ==========================================
  const SIMULATOR_CATEGORIES = ["Coffee", "Cold Brews", "Snacks", "Pastries"];
  const SIMULATOR_ITEMS: SimulatorItem[] = [
    { id: "s1", name: "Double Espresso", price: 3.50, category: "Coffee", emoji: "☕" },
    { id: "s2", name: "Creamy Cappuccino", price: 4.50, category: "Coffee", emoji: "🥛" },
    { id: "s3", name: "Nitro Cold Brew", price: 5.00, category: "Cold Brews", emoji: "🧊" },
    { id: "s4", name: "Avocado Toast", price: 7.50, category: "Snacks", emoji: "🥑" },
    { id: "s5", name: "Warm Brownie", price: 3.80, category: "Desserts", emoji: "🍰" },
    { id: "s6", name: "Butter Croissant", price: 3.20, category: "Pastries", emoji: "🥐" }
  ];

  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [simulatorStep, setSimulatorStep] = useState<"order" | "paying" | "completed">("order");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | "upi">("cash");

  const addToCart = (product: SimulatorItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "WELCOME10") {
      setAppliedDiscount(10); // 10% discount
    } else {
      alert("Invalid Code! Try 'WELCOME10' for 10% off.");
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const discountVal = (subtotal + tax) * (appliedDiscount / 100);
  const total = Math.max(0, subtotal + tax - discountVal);

  const handleSimulatedCheckout = () => {
    setSimulatorStep("paying");
    setTimeout(() => {
      setSimulatorStep("completed");
    }, 1500);
  };

  const resetSimulator = () => {
    setCart([]);
    setCouponCode("");
    setAppliedDiscount(0);
    setSimulatorStep("order");
  };

  // ==========================================
  // Session Drawer Functions
  // ==========================================
  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const bal = parseFloat(openingBalance);
    if (isNaN(bal) || bal < 0) {
      setError("Please enter a valid positive balance.");
      return;
    }
    openSession(bal);
    setSuccess("Cash register session opened successfully!");
    setTimeout(() => {
      setIsConsoleOpen(false);
      router.push("/terminal");
    }, 1000);
  };

  // Find last closed session
  const closedSessions = sessionsList.filter((s) => s.status === "closed");
  const lastSession = closedSessions.length > 0
    ? closedSessions[closedSessions.length - 1]
    : null;

  return (
    <div className="flex-1 min-h-screen bg-[#faf8f5] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 font-sans relative overflow-x-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute left-1/3 top-12 w-[600px] h-[600px] rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-3xl pointer-events-none z-0" />
      <div className="absolute right-10 top-1/2 w-[400px] h-[400px] rounded-full bg-amber-800/5 dark:bg-amber-900/5 blur-3xl pointer-events-none z-0" />

      {/* ==========================================
          DYNAMIC GLASS NAVBAR
          ========================================== */}
      <header className="sticky top-0 z-40 border-b border-stone-200/50 dark:border-stone-800/50 bg-[#faf8f5]/80 dark:bg-[#0c0a09]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white text-xl font-bold shadow-md group-hover:scale-105 transition-transform duration-300">
              ☕
            </span>
            <div>
              <span className="font-black text-base tracking-tight text-primary dark:text-amber-500 block">
                Odoo Cafe
              </span>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest block -mt-1">
                POS System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600 dark:text-stone-400">
            <a href="#features" className="hover:text-primary dark:hover:text-amber-500 transition-colors">Features</a>
            <a href="#simulator" className="hover:text-primary dark:hover:text-amber-500 transition-colors">Interactive Playground</a>
            <a href="#stats" className="hover:text-primary dark:hover:text-amber-500 transition-colors">Platform Stats</a>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl border border-stone-200/50 dark:border-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {!mounted ? (
                <div className="size-4 animate-pulse rounded bg-stone-200" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-stone-600" />
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-500 font-medium bg-stone-100 dark:bg-stone-900 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentUser.name}
                </span>
                <button
                  onClick={() => setIsConsoleOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  App Control Console
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Register Staff
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-lg"
          >
            {isMobileNavOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-stone-200/50 dark:border-stone-800/50 bg-[#faf8f5] dark:bg-[#0c0a09] px-4 py-6 space-y-4 flex flex-col font-bold"
            >
              <a href="#features" onClick={() => setIsMobileNavOpen(false)} className="text-stone-600 dark:text-stone-400 py-2">Features</a>
              <a href="#simulator" onClick={() => setIsMobileNavOpen(false)} className="text-stone-600 dark:text-stone-400 py-2">Interactive Playground</a>
              <a href="#stats" onClick={() => setIsMobileNavOpen(false)} className="text-stone-600 dark:text-stone-400 py-2">Platform Stats</a>
              <div className="h-px bg-stone-200 dark:bg-stone-800" />
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Appearance Theme</span>
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-xl border border-stone-200/50 dark:border-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors cursor-pointer flex items-center gap-2"
                >
                  {!mounted ? (
                    <div className="size-4 animate-pulse rounded bg-stone-200" />
                  ) : resolvedTheme === "dark" ? (
                    <>
                      <Sun className="size-4 text-amber-400" />
                      <span className="text-[10px] font-bold">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="size-4 text-stone-600" />
                      <span className="text-[10px] font-bold">Dark Mode</span>
                    </>
                  )}
                </button>
              </div>
              <div className="h-px bg-stone-200 dark:bg-stone-800" />
              {currentUser ? (
                <div className="space-y-3">
                  <p className="text-xs text-stone-500">Logged in as {currentUser.name}</p>
                  <button
                    onClick={() => { setIsMobileNavOpen(false); setIsConsoleOpen(true); }}
                    className="w-full py-2.5 bg-primary text-white text-xs rounded-xl"
                  >
                    Open Console
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMobileNavOpen(false)} className="text-center py-2 text-sm text-stone-600 dark:text-stone-400">Sign In</Link>
                  <Link href="/signup" onClick={() => setIsMobileNavOpen(false)} className="text-center py-2.5 bg-primary text-white text-xs rounded-xl">Register Staff</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ==========================================
          HERO SECTION
          ========================================== */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Intro copy */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <FadeIn direction="down" duration={0.5}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-bold mb-2 border border-amber-500/20">
              <Sparkles className="size-3.5 animate-pulse" />
              Next-Gen Restaurant Management
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
              The Modern OS for <br />
              <span className="text-primary dark:text-amber-500 bg-gradient-to-r from-amber-800 to-amber-600 dark:from-amber-500 dark:to-amber-300 bg-clip-text text-transparent">
                Elite Coffee Shops.
              </span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.2} className="max-w-xl mx-auto lg:mx-0">
            <p className="text-stone-500 dark:text-stone-400 text-base md:text-lg font-medium">
              A high-performance full stack REST POS tailored for café speed. Real-time table layout planning, interactive kitchen display feeds, custom analytics audits, and secure local register controls.
            </p>
          </FadeIn>

          {/* Action CTAs */}
          <FadeIn direction="up" delay={0.3} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => setIsConsoleOpen(true)}
                  className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Launch Drawer Session
                  <ArrowRight className="size-4" />
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl transition-all text-center"
                >
                  Enter App Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Register Workspace Free
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#simulator"
                  className="px-6 py-3.5 bg-white/80 dark:bg-stone-900/80 backdrop-blur border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-center flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="size-4 text-amber-600" />
                  Try POS Simulator
                </a>
              </>
            )}
          </FadeIn>
        </div>

        {/* Dashboard floating Mockup */}
        <div className="lg:col-span-6 relative flex justify-center">
          <FadeIn direction="left" delay={0.3} className="relative w-full max-w-[480px]">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="glass-panel border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
            >
              <div className="h-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-1.5 pb-3 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-[10px] text-stone-400 font-mono ml-2">odoo-cafe-terminal-v1.0.app</span>
              </div>
              
              {/* Mockup POS Interface */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">☕</span>
                    <div>
                      <h4 className="text-xs font-black">Hot Beverages</h4>
                      <p className="text-[8px] text-stone-400">Order queue active</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">KDS Sync: 100%</span>
                </div>
                
                {/* Floating stat card overlay inside mockup */}
                <div className="p-3 bg-stone-100/50 dark:bg-stone-950/50 rounded-2xl border border-stone-200/30 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-400">Double Espresso x3</span>
                    <span className="font-bold">$10.50</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-400">Flaky Croissant x2</span>
                    <span className="font-bold">$6.40</span>
                  </div>
                  <div className="h-px bg-stone-200 dark:bg-stone-800 my-1.5" />
                  <div className="flex justify-between text-[10px] font-black">
                    <span>Total Sales</span>
                    <span className="text-amber-800 dark:text-amber-500">$17.75</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="flex-1 py-1.5 bg-amber-800/20 text-amber-800 dark:text-amber-400 rounded-lg text-[10px] text-center font-bold">Dine-In T-102</span>
                  <span className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] text-center font-bold">Print Receipt</span>
                </div>
              </div>
            </motion.div>

            {/* Micro floating badge 1 */}
            <motion.div
              animate={{ y: [0, 8, 0], x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
              className="absolute -top-6 -left-6 glass-panel rounded-2xl p-3 shadow-lg flex items-center gap-2 border border-stone-200/50 dark:border-stone-800/50"
            >
              <TrendingUp className="size-4 text-emerald-500" />
              <div>
                <p className="text-[8px] text-stone-400">Today Sales</p>
                <p className="text-xs font-bold text-emerald-500">+$1,240.50</p>
              </div>
            </motion.div>

            {/* Micro floating badge 2 */}
            <motion.div
              animate={{ y: [0, -8, 0], x: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -right-6 glass-panel rounded-2xl p-3 shadow-lg flex items-center gap-2 border border-stone-200/50 dark:border-stone-800/50"
            >
              <ChefHat className="size-4 text-amber-500" />
              <div>
                <p className="text-[8px] text-stone-400">KDS Active Queue</p>
                <p className="text-xs font-bold text-amber-600">3 Orders Cooking</p>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* ==========================================
          INTERACTIVE POS TERMINAL SIMULATOR
          ========================================== */}
      <section id="simulator" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-stone-200/40 dark:border-stone-800/40 z-10 relative">
        <div className="text-center space-y-4 mb-12 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-bold">
            💻 Interactive Sandbox
          </div>
          <h2 className="text-3xl font-black tracking-tight">Experience Odoo POS Feel</h2>
          <p className="text-sm text-stone-500">
            Play with this live interactive widget. Add delicious beverages, apply mock discount coupons, and complete simulated transactions.
          </p>
        </div>

        {/* Simulator Grid Container */}
        <div className="glass-panel border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 max-w-4xl mx-auto min-h-[500px]">
          
          {/* Left: Product List (8 columns) */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-stone-200/50 dark:border-stone-800/50 flex flex-col justify-between">
            <div>
              {/* Category selector tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {SIMULATOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-primary text-white shadow"
                        : "bg-stone-100 dark:bg-stone-900 text-stone-500 hover:text-stone-800 hover:bg-stone-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-2 gap-4">
                {SIMULATOR_ITEMS.filter(it => it.category === selectedCategory || selectedCategory === "Coffee" && (it.category === "Coffee" || it.category === "Desserts" && it.name === "Warm Brownie") || selectedCategory === it.category).map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-500/10 dark:bg-stone-950 dark:hover:bg-amber-500/10 border border-stone-200/50 dark:border-stone-800/50 text-left transition-all active:scale-[0.98] flex flex-col justify-between h-32 group cursor-pointer"
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{prod.emoji}</span>
                      <span className="text-xs font-black bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2 py-0.5 rounded-lg">${prod.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-primary dark:group-hover:text-amber-400 transition-colors">{prod.name}</h4>
                      <p className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-wider font-semibold">{prod.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-stone-400 text-center mt-6 uppercase tracking-wider font-semibold">
              Tip: Click any coffee card above to fill your check cart
            </p>
          </div>

          {/* Right: Cart list, math calculations (5 columns) */}
          <div className="lg:col-span-5 p-6 bg-stone-50/50 dark:bg-stone-900/30 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {simulatorStep === "order" ? (
                <div className="flex flex-col justify-between h-full space-y-6">
                  {/* Cart Header */}
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-2 pb-3 border-b border-stone-200/50 dark:border-stone-800/50">
                      <ShoppingBag className="size-4 text-primary" />
                      POS Cart Tickets
                    </h3>

                    {/* Cart list list */}
                    {cart.length > 0 ? (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 mt-4">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex items-center justify-between text-xs bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200/30">
                            <div>
                              <p className="font-bold">{item.product.name}</p>
                              <p className="text-[9px] text-stone-400">${item.product.price.toFixed(2)} per unit</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQty(item.product.id, -1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700">
                                <Minus className="size-3" />
                              </button>
                              <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => addToCart(item.product)} className="p-1 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700">
                                <Plus className="size-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center space-y-2 text-stone-400">
                        <Coffee className="size-8 mx-auto stroke-1 text-stone-300 dark:text-stone-700" />
                        <p className="text-xs">Your terminal cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Calculations & Checkout */}
                  {cart.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-stone-200/50 dark:border-stone-800/50">
                      {/* Promo entry */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Promo: WELCOME10"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                        />
                        <button onClick={applyCoupon} className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-xs font-bold cursor-pointer">
                          Apply
                        </button>
                      </div>

                      {/* Calculations List */}
                      <div className="space-y-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-mono text-stone-800 dark:text-stone-200">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (5%)</span>
                          <span className="font-mono text-stone-800 dark:text-stone-200">${tax.toFixed(2)}</span>
                        </div>
                        {appliedDiscount > 0 && (
                          <div className="flex justify-between text-emerald-500">
                            <span>Promo Discount (-10%)</span>
                            <span className="font-mono">-${discountVal.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="h-px bg-stone-200 dark:bg-stone-800 my-2" />
                        <div className="flex justify-between text-sm font-black text-stone-800 dark:text-stone-100">
                          <span>Total</span>
                          <span className="font-mono text-primary dark:text-amber-500">${total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Checkout button */}
                      <button
                        onClick={handleSimulatedCheckout}
                        className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Simulate Payment Processing
                      </button>
                    </div>
                  )}
                </div>
              ) : simulatorStep === "paying" ? (
                <motion.div
                  key="paying"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="inline-block p-3 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    <RotateCcw className="size-8" />
                  </motion.div>
                  <h4 className="text-sm font-black">Processing Digital Sale...</h4>
                  <p className="text-xs text-stone-400">Verifying secure receipt payload via simulated API callback</p>
                </motion.div>
              ) : (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-10 text-center space-y-6"
                >
                  <div className="p-3 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    <Check className="size-10" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-500">Transaction Settled!</h4>
                    <p className="text-xs text-stone-400 mt-1">Receipt Printed & Drawer register ledger reconciled</p>
                  </div>

                  {/* Simulated Receipt Preview */}
                  <div className="receipt-paper rounded-xl p-4 w-full max-w-[240px] text-[10px] text-stone-800 space-y-2 border border-stone-200">
                    <p className="font-bold text-center">** ODOO CAFE **</p>
                    <p className="text-center font-mono">Date: {new Date().toLocaleDateString()}</p>
                    <div className="h-px border-t border-dashed border-stone-400 my-1" />
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between font-mono">
                        <span>{item.product.name} x{item.quantity}</span>
                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="h-px border-t border-dashed border-stone-400 my-1" />
                    <div className="flex justify-between font-bold font-mono">
                      <span>TOTAL:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <p className="text-center italic mt-2">Thank you! Come again.</p>
                  </div>

                  <button
                    onClick={resetSimulator}
                    className="px-6 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Start New Sale
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ==========================================
          FEATURES SOLUTION HOVER CARD GRID
          ========================================== */}
      <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-stone-200/40 dark:border-stone-800/40 z-10 relative">
        <div className="text-center space-y-4 mb-16 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-400 rounded-full text-xs font-bold">
            💼 Complete Feature Matrix
          </div>
          <h2 className="text-3xl font-black tracking-tight">Built for Speed and Reliability</h2>
          <p className="text-sm text-stone-500">
            Engineered with a modern client state engine and responsive web structures. Complete with live reporting dashboard capabilities.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-panel border-stone-200/60 dark:border-stone-800/60 rounded-3xl p-6 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group h-64 hover:border-primary/30 dark:hover:border-amber-500/30">
            <div className="space-y-4">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                🗺️
              </span>
              <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">Live Dining Floors</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Dynamic visual layouts for table placements. Toggle available statuses (OCCUPIED, RESERVED, DIRTY) in one-click.
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary dark:text-amber-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Explore Floorplan <ChevronRight className="size-3" />
            </span>
          </div>

          {/* Card 2 */}
          <div className="glass-panel border-stone-200/60 dark:border-stone-800/60 rounded-3xl p-6 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group h-64 hover:border-primary/30 dark:hover:border-amber-500/30">
            <div className="space-y-4">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                🖥️
              </span>
              <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">Kitchen Display (KDS)</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Live interactive ticket columns for orders sent to the cook staff. Track preparation times and update cooking stages instantly.
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary dark:text-amber-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Explore KDS <ChevronRight className="size-3" />
            </span>
          </div>

          {/* Card 3 */}
          <div className="glass-panel border-stone-200/60 dark:border-stone-800/60 rounded-3xl p-6 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group h-64 hover:border-primary/30 dark:hover:border-amber-500/30">
            <div className="space-y-4">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                🏷️
              </span>
              <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">Dynamic Product Catalog</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Instantly adjust categories, taxes, pricing indexes, UoM types, and product items. Fully integrated back office module controls.
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary dark:text-amber-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Manage Items <ChevronRight className="size-3" />
            </span>
          </div>

          {/* Card 4 */}
          <div className="glass-panel border-stone-200/60 dark:border-stone-800/60 rounded-3xl p-6 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group h-64 hover:border-primary/30 dark:hover:border-amber-500/30">
            <div className="space-y-4">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                📊
              </span>
              <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">Live Growth Reports</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Check daily revenue graphs, average bill value indicators, top-selling items metrics, and cashier register logs dynamically.
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary dark:text-amber-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View Analytics <ChevronRight className="size-3" />
            </span>
          </div>
        </div>
      </section>

      {/* ==========================================
          STATS BAR
          ========================================== */}
      <section id="stats" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-stone-200/40 dark:border-stone-800/40 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center bg-white/50 dark:bg-stone-900/50 backdrop-blur rounded-3xl p-8 border border-stone-200/40 dark:border-stone-800/40">
          <div className="space-y-1">
            <p className="text-3xl font-black text-primary dark:text-amber-500">4.9/5 ★</p>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">App Store Staff Rating</p>
          </div>
          <div className="space-y-1 border-y md:border-y-0 md:border-x border-stone-200/50 dark:border-stone-800/50 py-4 md:py-0">
            <p className="text-3xl font-black text-primary dark:text-amber-500">99.99%</p>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Session Uptime SLA</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-primary dark:text-amber-500">15k+</p>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Transactions Synced Daily</p>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <footer className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-stone-200/40 dark:border-stone-800/40 text-center space-y-4 z-10 relative text-stone-400">
        <p className="text-xs font-semibold">
          © {new Date().getFullYear()} Odoo Cafe POS System. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 text-xs font-bold">
          <a href="#features" className="hover:text-stone-700 dark:hover:text-stone-200">Features</a>
          <span>·</span>
          <a href="#simulator" className="hover:text-stone-700 dark:hover:text-stone-200">Playground</a>
          <span>·</span>
          {currentUser ? (
            <Link href="/dashboard" className="hover:text-stone-700 dark:hover:text-stone-200">Go to Dashboard</Link>
          ) : (
            <Link href="/login" className="hover:text-stone-700 dark:hover:text-stone-200">Staff Portal</Link>
          )}
        </div>
      </footer>

      {/* ==========================================
          AUTHENTICATED DRAWER CONTROL SHEET (SLIDE OVER)
          ========================================== */}
      <AnimatePresence>
        {isConsoleOpen && currentUser && (
          <>
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConsoleOpen(false)}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            />

            {/* Slide-over panel sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-200/50 dark:border-stone-800/50 mb-6">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-stone-400">Workspace Management</span>
                    <h3 className="font-black text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-0.5">
                      <Settings className="size-5 text-primary" />
                      App Control Console
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsConsoleOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Profile detail */}
                <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200/30 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-base">
                    👤
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{currentUser.name}</p>
                    <p className="text-[10px] text-stone-400">{currentUser.email}</p>
                  </div>
                  <span className="text-[9px] uppercase font-black tracking-wider bg-primary/10 text-primary dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                </div>

                {/* Form Message notifications */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-danger text-xs font-medium">
                    ⚠️ {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-success text-xs font-medium">
                    ✅ {success}
                  </div>
                )}

                {/* Session management section */}
                <div className="space-y-6">
                  {activeSession ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                        <p className="text-sm font-semibold text-success">Active POS Drawer Session is Open</p>
                        <p className="text-xs text-stone-500 mt-1">Opened balance: ${activeSession.openingBalance.toFixed(2)}</p>
                      </div>

                      <button
                        onClick={() => { setIsConsoleOpen(false); router.push("/terminal"); }}
                        className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Resume POS Terminal View
                      </button>

                      <button
                        onClick={() => { closeSession(); setSuccess("Session closed!"); }}
                        className="w-full py-3 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Close Register Session
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleOpenSession} className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">Open Cash Drawer Session</h4>
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                          Opening Register Balance ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={openingBalance}
                          onChange={(e) => setOpeningBalance(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        🚀 Open POS Cash Session
                      </button>
                    </form>
                  )}

                  {/* Previous closed summary */}
                  {lastSession && (
                    <div className="p-4 bg-stone-100 dark:bg-stone-950 rounded-2xl border border-stone-200/20 text-xs space-y-1">
                      <p className="font-bold text-stone-600 dark:text-stone-400">Last Closed Session:</p>
                      <p className="text-[10px]">Closed Date: {new Date(lastSession.closedAt || "").toLocaleString()}</p>
                      <p className="text-[10px] font-black">Closing Balance: ${lastSession.closingBalance.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* Exits viewports */}
                <div className="mt-8 pt-6 border-t border-stone-200/50 dark:border-stone-800/50 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">System Core Viewports</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setIsConsoleOpen(false); router.push("/kitchen"); }}
                      className="flex-1 py-2.5 text-xs font-bold border border-stone-200 hover:bg-stone-100 rounded-xl transition-colors dark:border-stone-800 dark:hover:bg-stone-900 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="size-3.5 text-amber-600" />
                      Kitchen KDS
                    </button>
                    {(currentUser.role === "admin" || currentUser.role === "OWNER" || currentUser.role === "MANAGER") && (
                      <button
                        onClick={() => { setIsConsoleOpen(false); router.push("/backend"); }}
                        className="flex-1 py-2.5 text-xs font-bold border border-stone-200 hover:bg-stone-100 rounded-xl transition-colors dark:border-stone-800 dark:hover:bg-stone-900 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Settings className="size-3.5 text-primary" />
                        Admin Panel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <div className="pt-6 border-t border-stone-200/50 dark:border-stone-800/50">
                <button
                  onClick={() => { logout(); setIsConsoleOpen(false); }}
                  className="w-full py-2.5 border border-red-500/20 text-red-500 hover:bg-red-500/5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

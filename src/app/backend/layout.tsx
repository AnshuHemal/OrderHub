"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/app/context/AppContext";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FadeIn } from "@/components/motion/fade-in";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Package,
  Tags,
  Map,
  Ticket,
  CreditCard,
  Users,
  Calendar,
  Contact,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  FlaskConical,
  ChefHat
} from "lucide-react";

function getInitials(name: string) {
  if (!name) return "👤";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function BackendLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loading, logout } = useApp();

  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.role === "OWNER" ||
    currentUser?.role === "MANAGER";

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push("/");
    } else if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [currentUser, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background font-sans">
        {/* Background mesh */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-35"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,transparent_40%,var(--background)_100%)]"
        />
        <div className="relative z-10 text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto"
          />
          <p className="text-xs font-bold tracking-tight text-muted-foreground">Synchronizing backend...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) return null;

  const menuItems = [
    { href: "/backend/analytics", label: "Analytics Dashboard", icon: BarChart3 },
    { href: "/backend/products", label: "Products Catalog", icon: Package },
    { href: "/backend/categories", label: "Product Categories", icon: Tags },
    { href: "/backend/tables", label: "Floors & Tables", icon: Map },
    { href: "/backend/promos", label: "Coupons & Promotions", icon: Ticket },
    { href: "/backend/payments", label: "Payment Settings", icon: CreditCard },
    { href: "/backend/users", label: "Employee Registry", icon: Users },
    { href: "/backend/bookings", label: "Bookings Log", icon: Calendar },
    { href: "/backend/customers", label: "Guest Registry", icon: Contact },
  ];

  const inventoryItems = [
    { href: "/backend/inventory", label: "Ingredient Inventory", icon: FlaskConical },
    { href: "/backend/recipes", label: "Recipe Manager", icon: ChefHat },
  ];

  return (
    <div className="relative flex min-h-screen md:h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary md:overflow-hidden">
      {/* Background Grid Mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,transparent_40%,var(--background)_100%)]"
      />

      {/* TOPBAR NAVIGATION */}
      <FadeIn
        direction="down"
        className="relative z-10 flex shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 py-3.5 backdrop-blur-sm shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Logo size={24} />
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold text-primary">
            <Sparkles className="size-3" /> Admin Suite
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary select-none">
              {getInitials(currentUser.name)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{currentUser.role.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* DASHBOARD WORKSPACE GRID */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-8 px-6 py-8 flex-col md:flex-row md:overflow-hidden">
        
        {/* SIDEBAR LINKS */}
        <FadeIn direction="down" delay={0.05} className="w-full md:w-60 shrink-0 md:h-full md:overflow-y-auto pr-1">
          <nav className="flex flex-col gap-1.5" aria-label="Backend navigation">
            <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="size-3 text-primary" /> Configurations
            </div>
            
            {menuItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/10"
                      : "text-muted-foreground hover:bg-stone-100 dark:hover:bg-stone-850 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={cn("size-4 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                    {label}
                  </span>
                  <ChevronRight className={cn("size-3 opacity-0 transition-all transform translate-x-1", isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-40 group-hover:translate-x-0")} />
                </Link>
              );
            })}

            <div className="my-2 h-px bg-border" />

            <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FlaskConical className="size-3 text-violet-400" /> Inventory & Recipes
            </div>

            {inventoryItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 group",
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-900/20"
                      : "text-muted-foreground hover:bg-stone-100 dark:hover:bg-stone-850 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={cn("size-4 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-violet-400")} />
                    {label}
                  </span>
                  <ChevronRight className={cn("size-3 opacity-0 transition-all transform translate-x-1", isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-40 group-hover:translate-x-0")} />
                </Link>
              );
            })}

            <div className="my-3 h-px bg-border" />

            <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Exits
            </div>

            <Link
              href="/terminal"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-stone-100 dark:hover:bg-stone-850 hover:text-foreground transition-all"
            >
              <ArrowLeft className="size-4" /> POS Terminal
            </Link>

            <button
              onClick={() => logout()}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5 transition-all text-left cursor-pointer"
            >
              <LogOut className="size-4" /> Sign Out
            </button>
          </nav>
        </FadeIn>

        {/* WORKSPACE AREA WITH ANIMATION CONTAINER */}
        <main className="flex flex-1 flex-col min-w-0 md:h-full md:overflow-y-auto pr-1">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex flex-1 flex-col gap-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

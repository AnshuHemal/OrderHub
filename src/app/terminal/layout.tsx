"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutGrid, ShoppingCart, ClipboardList, Users,
  Settings, ChefHat, LogOut, Menu, X, Search,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Logo } from "@/components/shared/logo";
import ZReportDialog from "@/components/shared/ZReportDialog";

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: "tables",    label: "Floor Plan",   icon: LayoutGrid },
  { key: "order",     label: "POS Order",    icon: ShoppingCart },
  { key: "orders",    label: "Orders Log",   icon: ClipboardList },
  { key: "customers", label: "Guests",       icon: Users },
] as const;

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const confirm  = useConfirm();
  const {
    currentUser, activeSession, currentOrder,
    tables, loading,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [zReportOpen, setZReportOpen] = useState(false);

  // Security redirect
  useEffect(() => {
    if (loading) return;
    if (!currentUser || (!activeSession && !zReportOpen)) router.push("/");
  }, [currentUser, activeSession, loading, router, zReportOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-stone-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-stone-500 dark:text-stone-400">Synchronizing session…</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !activeSession) return null;

  const isActive = (key: string) => pathname === `/terminal/${key}`;

  const activeTable = currentOrder?.tableId
    ? tables.find((t) => t.id === currentOrder.tableId)
    : null;

  const roleLabel =
    currentUser.role === "OWNER"   ? "Owner"   :
    currentUser.role === "MANAGER" ? "Manager" :
    currentUser.role === "KITCHEN" ? "Kitchen" : "Cashier";

  const isAdmin = ["admin", "OWNER", "MANAGER"].includes(currentUser.role);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-100 dark:bg-stone-950 font-sans">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 lg:px-6 py-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800/80 shadow-sm">

        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-5 min-w-0">
          <Logo size={24} />

          {/* Desktop pill nav */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
              const active = isActive(key);
              return (
                <button
                  key={key}
                  onClick={async () => {
                    if (key === "order" && !currentOrder) {
                      const ok = await confirm({
                        title: "No Active Order",
                        message: "There is no active order. Would you like to go to the Floor Plan to select a table?",
                        confirmLabel: "Go to Floor Plan",
                        variant: "info",
                      });
                      if (ok) router.push("/terminal/tables");
                      return;
                    }
                    router.push(`/terminal/${key}`);
                  }}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                    active
                      ? "bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-700/50"
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-primary dark:text-white" : "")} />
                  <span>{label}</span>
                  {key === "order" && currentOrder && currentOrder.items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {currentOrder.items.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xs lg:max-w-sm hidden lg:block">
          <Suspense fallback={<div className="h-9" />}>
            <TerminalSearchBar pathname={pathname} />
          </Suspense>
        </div>

        {/* Right: Table badge + User + Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Active table indicator */}
          {activeTable ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 rounded-xl text-xs font-black uppercase tracking-wide">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <MapPin className="size-3" />
              {activeTable.tableNumber}
            </div>
          ) : currentOrder ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-xl text-xs font-bold uppercase tracking-wide">
              Takeaway
            </div>
          ) : null}

          <div className="h-6 w-px bg-stone-200 dark:bg-stone-700 hidden sm:block" />

          {/* User chip */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-sm text-primary">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="leading-none">
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider">{roleLabel}</p>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200 max-w-[100px] truncate">{currentUser.name}</p>
            </div>
          </div>

          {/* Hamburger */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "p-2 rounded-xl transition-all border",
                menuOpen
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-transparent hover:bg-stone-200 dark:hover:bg-stone-700"
              )}
              aria-label="Open menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen ? (
                  <motion.span key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="size-5" />
                  </motion.span>
                ) : (
                  <motion.span key="open" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="size-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute right-0 mt-2 w-60 z-50 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden"
                  >
                    {/* User info row (mobile) */}
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3 sm:hidden">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-800 dark:text-stone-200">{currentUser.name}</p>
                        <p className="text-xs text-stone-400">{roleLabel}</p>
                      </div>
                    </div>

                    {/* Go To Views */}
                    <div className="py-1.5">
                      <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">Go to Views</p>
                      <MenuButton icon={ChefHat} label="Kitchen Display (KDS)" onClick={() => router.push("/kitchen")} />
                      {isAdmin && (
                        <MenuButton icon={Settings} label="Admin Settings Panel" onClick={() => router.push("/backend")} />
                      )}
                    </div>

                    <div className="h-px bg-stone-100 dark:bg-stone-800 mx-3" />

                    {/* Navigation */}
                    <div className="py-1.5">
                      <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">Navigation</p>
                      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                        <MenuButton key={key} icon={Icon} label={label} onClick={() => router.push(`/terminal/${key}`)} active={isActive(key)} />
                      ))}
                    </div>

                    <div className="h-px bg-stone-100 dark:bg-stone-800 mx-3" />

                    {/* Close Session */}
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setZReportOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/5 transition-colors"
                      >
                        <LogOut className="size-4" />
                        Close Shift Session
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile search bar (below header on searchable pages) */}
      <Suspense fallback={null}>
        <TerminalSearchBar pathname={pathname} mobile />
      </Suspense>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden pb-16 md:pb-0">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────── */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200/80 dark:border-stone-800/80 grid grid-cols-4 py-1.5 safe-area-pb">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = isActive(key);
          return (
            <button
              key={key}
              onClick={() => router.push(`/terminal/${key}`)}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 text-[10px] font-bold transition-colors",
                active ? "text-primary" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                active ? "bg-primary/10" : ""
              )}>
                <Icon className="size-5" />
              </div>
              {label}
            </button>
          );
        })}
      </footer>

      {/* Z-Report Dialog */}
      <ZReportDialog isOpen={zReportOpen} onClose={() => setZReportOpen(false)} />
    </div>
  );
}

// ─── Menu button helper ───────────────────────────────────────────────────────

function MenuButton({
  icon: Icon, label, onClick, active,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "text-primary bg-primary/5"
          : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
      )}
    >
      <Icon className={cn("size-4", active ? "text-primary" : "text-stone-400")} />
      {label}
    </button>
  );
}

// ─── Search Bar ──────────────────────────────────────────────────────────────

function TerminalSearchBar({ pathname, mobile }: { pathname: string; mobile?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSearch = searchParams.get("search") || "";

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set("search", value); } else { params.delete("search"); }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const placeholderMap: Record<string, string> = {
    "/terminal/order":     "Search products…",
    "/terminal/orders":    "Search orders by # or customer…",
    "/terminal/customers": "Search by name, email, or phone…",
  };
  const placeholder = placeholderMap[pathname];
  if (!placeholder) return null;

  if (mobile) {
    return (
      <div className="px-4 py-2.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 lg:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-stone-400"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
      <input
        type="text"
        value={currentSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm text-stone-900 dark:text-white placeholder:text-stone-400 transition-all"
      />
    </div>
  );
}

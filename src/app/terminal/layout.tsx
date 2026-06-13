"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/app/context/AppContext";

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    activeSession,
    currentOrder,
    tables,
    closeSession,
    loading
  } = useApp();

  const [showHamburger, setShowHamburger] = useState(false);

  // Security Check: Redirect to home page if no user or no active session (skip while loading)
  useEffect(() => {
    if (loading) return;
    if (!currentUser || !activeSession) {
      router.push("/");
    }
  }, [currentUser, activeSession, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-stone-950 font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-stone-600 dark:text-stone-300">Synchronizing session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !activeSession) return null;

  // Find active table details
  const activeTable = currentOrder?.tableId
    ? tables.find((t) => t.id === currentOrder.tableId)
    : null;

  const isActive = (tab: string) => {
    return pathname === `/terminal/${tab}`;
  };

  const getNavButtonClass = (tab: string) => {
    return `px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
      isActive(tab)
        ? "bg-white dark:bg-stone-700 shadow-sm text-primary dark:text-white"
        : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
    }`;
  };

  const getMobileNavClass = (tab: string) => {
    return `flex flex-col items-center gap-0.5 ${isActive(tab) ? "text-primary font-bold" : ""}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100 dark:bg-stone-955 font-sans">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => router.push("/")}
            className="text-xl font-extrabold text-primary dark:text-amber-500 flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span>☕</span>
            <span>Cafe POS</span>
          </div>
          
          {/* Quick Nav Options */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl">
            <button
              onClick={() => router.push("/terminal/tables")}
              className={getNavButtonClass("tables")}
            >
              🗺️ Floor Plan
            </button>
            <button
              onClick={() => {
                if (!currentOrder) {
                  if (confirm("No active order. Create a Quick Counter Order (no table)?")) {
                    router.push("/terminal/order");
                  }
                } else {
                  router.push("/terminal/order");
                }
              }}
              className={getNavButtonClass("order")}
            >
              🛒 POS Order
            </button>
            <button
              onClick={() => router.push("/terminal/orders")}
              className={getNavButtonClass("orders")}
            >
              📋 Orders Log
            </button>
            <button
              onClick={() => router.push("/terminal/customers")}
              className={getNavButtonClass("customers")}
            >
              👥 Customers
            </button>
          </nav>
        </div>

        {/* Search Bar / Context Panel */}
        <div className="flex-1 max-w-md mx-6 hidden lg:block">
          <Suspense fallback={<div className="h-9" />}>
            <TerminalSearchBar pathname={pathname} />
          </Suspense>
        </div>

        {/* Current Table Indicator, Employee and Hamburger Menu */}
        <div className="flex items-center gap-3">
          {activeTable ? (
            <div className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              {activeTable.tableNumber}
            </div>
          ) : currentOrder ? (
            <div className="px-3 py-1 bg-stone-100 dark:bg-stone-850 text-stone-500 text-xs font-bold rounded-lg uppercase tracking-wider">
              Takeaway
            </div>
          ) : (
            <div className="px-3 py-1 bg-stone-100 dark:bg-stone-850 text-stone-400 text-xs font-semibold rounded-lg italic">
              No Table
            </div>
          )}

          <div className="h-8 w-px bg-stone-200 dark:bg-stone-800"></div>

          {/* User Profile display */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 text-primary dark:text-amber-500 flex items-center justify-center font-bold text-sm shadow-inner">
              👤
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="text-xs text-stone-400">Cashier</p>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{currentUser.name}</p>
            </div>
          </div>

          {/* Hamburger Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowHamburger(!showHamburger)}
              className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors text-stone-600 dark:text-stone-300"
            >
              ☰
            </button>
            {showHamburger && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-sm text-[#1c1917] dark:text-[#f5f5f4]">
                <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">Go to Views</p>
                <button
                  onClick={() => { setShowHamburger(false); router.push("/kitchen"); }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                >
                  🖥️ Kitchen Display (KDS)
                </button>
                {(currentUser.role === "admin" || currentUser.role === "OWNER" || currentUser.role === "MANAGER") && (
                  <button
                    onClick={() => { setShowHamburger(false); router.push("/backend"); }}
                    className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                  >
                    ⚙️ Admin Settings panel
                  </button>
                )}
                
                <div className="h-px bg-stone-200 dark:bg-stone-800 my-2"></div>
                <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-400">Navigation</p>
                <button onClick={() => { router.push("/terminal/tables"); setShowHamburger(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800">🗺️ Floor Selector</button>
                <button onClick={() => { router.push("/terminal/orders"); setShowHamburger(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800">📋 Session Orders</button>
                <button onClick={() => { router.push("/terminal/customers"); setShowHamburger(false); }} className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold">👥 Customers Directory</button>
                
                <div className="h-px bg-stone-200 dark:bg-stone-800 my-2"></div>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to CLOSE this POS Shift Session and review summary?")) {
                      closeSession();
                      router.push("/");
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-danger hover:bg-red-550 dark:hover:bg-red-950/20 font-semibold"
                >
                  🔒 Close shift session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE PRODUCT SEARCH / FILTER OVERLAY FOR SEARCHABLE PATHS */}
      <Suspense fallback={null}>
        <TerminalSearchBar pathname={pathname} mobile />
      </Suspense>

      {/* MOBILE NAV (Bottom Bar for small viewports) */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 grid grid-cols-4 py-2 text-center text-xs text-stone-500">
        <button onClick={() => router.push("/terminal/tables")} className={getMobileNavClass("tables")}>
          <span className="text-lg">🗺️</span> Floor Plan
        </button>
        <button onClick={() => router.push("/terminal/order")} className={getMobileNavClass("order")}>
          <span className="text-lg">🛒</span> POS Order
        </button>
        <button onClick={() => router.push("/terminal/orders")} className={getMobileNavClass("orders")}>
          <span className="text-lg">📋</span> Log
        </button>
        <button onClick={() => router.push("/terminal/customers")} className={getMobileNavClass("customers")}>
          <span className="text-lg">👥</span> Guests
        </button>
      </footer>

      {/* MAIN BODY LAYOUT */}
      <main className="flex-1 flex overflow-hidden pb-12 md:pb-0">
        {children}
      </main>
    </div>
  );
}

function TerminalSearchBar({ pathname, mobile }: { pathname: string; mobile?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSearch = searchParams.get("search") || "";

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  let searchPlaceholder = "";
  let showSearchInput = false;

  if (pathname === "/terminal/order") {
    searchPlaceholder = "Quick search products by name...";
    showSearchInput = true;
  } else if (pathname === "/terminal/orders") {
    searchPlaceholder = "Search orders (by order #, customer name)...";
    showSearchInput = true;
  } else if (pathname === "/terminal/customers") {
    searchPlaceholder = "Search customer by name, email or phone...";
    showSearchInput = true;
  }

  if (!showSearchInput) return null;

  if (mobile) {
    return (
      <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 lg:hidden flex gap-2 animate-fade-in">
        <input
          type="text"
          value={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search..."
          className="flex-1 px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">🔍</span>
      <input
        type="text"
        value={currentSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full pl-9 pr-4 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-sm text-stone-900 dark:text-white"
      />
    </div>
  );
}


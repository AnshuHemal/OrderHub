"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/app/context/AppContext";

export default function BackendLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loading } = useApp();

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";

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
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] dark:bg-[#0c0a09] font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-stone-600 dark:text-stone-300">Synchronizing dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) return null;

  // Helper to determine if a sub-path is currently active
  const isActive = (tab: string) => {
    if (tab === "dashboard" && pathname === "/backend/analytics") return true;
    return pathname === `/backend/${tab}`;
  };

  const getButtonClass = (tab: string) => {
    return `w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2.5 ${
      isActive(tab)
        ? "bg-primary text-white shadow-md"
        : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
    }`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#faf8f5] text-[#1c1917] dark:bg-[#0c0a09] dark:text-[#f5f5f4] font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Brand header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white text-xl font-bold flex items-center justify-center shadow-md">
            ⚙️
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-primary dark:text-amber-500">Cafe POS Backend</h1>
            <p className="text-[10px] text-stone-500">Configurations & Reports</p>
          </div>
        </div>

        {/* Tab Items */}
        <nav className="flex-1 p-4 space-y-1.5 text-xs">
          <button
            onClick={() => router.push("/backend/analytics")}
            className={getButtonClass("dashboard")}
          >
            📊 Analytics Dashboard
          </button>
          <button
            onClick={() => router.push("/backend/products")}
            className={getButtonClass("products")}
          >
            📦 Products List
          </button>
          <button
            onClick={() => router.push("/backend/categories")}
            className={getButtonClass("categories")}
          >
            🏷️ Product Categories
          </button>
          <button
            onClick={() => router.push("/backend/tables")}
            className={getButtonClass("tables")}
          >
            🗺️ Floors & Tables
          </button>
          <button
            onClick={() => router.push("/backend/promos")}
            className={getButtonClass("promos")}
          >
            🎁 Coupons & Promotions
          </button>
          <button
            onClick={() => router.push("/backend/payments")}
            className={getButtonClass("payments")}
          >
            💳 Payment Setup
          </button>
          <button
            onClick={() => router.push("/backend/users")}
            className={getButtonClass("users")}
          >
            👥 Cashier Employees
          </button>
          <button
            onClick={() => router.push("/backend/bookings")}
            className={getButtonClass("bookings")}
          >
            📅 Bookings log
          </button>
          <button
            onClick={() => router.push("/backend/customers")}
            className={getButtonClass("customers")}
          >
            👥 Customer Registry
          </button>

          <div className="h-px bg-stone-200 dark:bg-stone-800 my-4"></div>

          {/* Quick exits */}
          <button
            onClick={() => router.push("/terminal")}
            className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-500 font-semibold"
          >
            ← POS Terminal View
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full text-left px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-500 font-semibold"
          >
            ⚙️ POS Sessions
          </button>
        </nav>

        {/* Footer profile log */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 text-xs bg-stone-50 dark:bg-stone-900/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center font-black">
            👤
          </div>
          <div>
            <p className="font-bold text-stone-800 dark:text-stone-200">{currentUser.name}</p>
            <p className="text-[10px] text-stone-400 capitalize">{currentUser.role}</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE PANEL */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}

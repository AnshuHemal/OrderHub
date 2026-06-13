"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";

export default function TablesPage() {
  const router = useRouter();
  const {
    floors,
    tables,
    orders,
    activeSession,
    loadTableOrder,
    createNewOrder,
    toggleTableStatus
  } = useApp();

  const [selectedFloorId, setSelectedFloorId] = useState<string>("");

  // Initialize first floor as default selected
  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  if (!activeSession) return null;

  return (
    <section className="flex-1 p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Restaurant Floor Selection</h2>
          <p className="text-sm text-stone-500">Pick an occupied table to continue, or tap an available table to seat guests.</p>
        </div>

        {/* Floor Tabs Selector */}
        <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-xl w-fit">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloorId(floor.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedFloorId === floor.id
                  ? "bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              }`}
            >
              🏢 {floor.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {tables
          .filter((t) => t.floorId === selectedFloorId)
          .map((table) => {
            // Check if table has an active draft order
            const activeOrder = orders.find(
              (o) => o.tableId === table.id && o.status === "draft" && o.sessionId === activeSession.id
            );
            const isOccupied = !!activeOrder;

            return (
              <button
                key={table.id}
                onClick={() => {
                  if (table.status === "DIRTY") {
                    if (confirm(`Table ${table.tableNumber} requires cleaning. Mark as Cleaned & Available?`)) {
                      toggleTableStatus(table.id);
                    }
                    return;
                  }
                  loadTableOrder(table.id);
                  router.push("/terminal/order");
                }}
                className={`relative flex flex-col items-center justify-between p-6 rounded-3xl border text-center transition-all duration-300 transform hover:scale-[1.03] shadow-md group ${
                  !table.isActive
                    ? "bg-stone-100/50 border-stone-200 text-stone-400 cursor-not-allowed opacity-50"
                    : table.status === "DIRTY"
                    ? "bg-amber-500/15 border-amber-500 hover:border-amber-600 dark:bg-amber-950/20 text-stone-850 dark:text-stone-200 shadow-amber-500/5 glow-primary animate-pulse"
                    : isOccupied
                    ? "bg-red-500/10 border-danger hover:border-danger dark:bg-red-950/20 text-stone-800 dark:text-stone-200 shadow-red-500/5 glow-primary"
                    : "bg-white border-stone-200 hover:border-primary dark:bg-stone-900 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                }`}
                disabled={!table.isActive}
              >
                {/* Seat indicator */}
                <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                  👥 {table.seats} seats
                </span>

                {/* Icon */}
                <span className="text-3xl mt-4 mb-2 group-hover:scale-110 transition-transform">
                  {table.status === "DIRTY" ? "🧹" : "🍽️"}
                </span>

                {/* Info */}
                <div>
                  <p className="font-extrabold text-lg leading-tight">{table.tableNumber}</p>
                  {isOccupied ? (
                    <div className="mt-2 space-y-0.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-white bg-danger rounded-full">
                        Occupied
                      </span>
                      <p className="text-sm font-black text-danger mt-1">
                        ${activeOrder.total.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-stone-550">
                        {activeOrder.items.reduce((s, i) => s + i.quantity, 0)} items
                      </p>
                    </div>
                  ) : table.status === "DIRTY" ? (
                    <div className="mt-2 space-y-1">
                      <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-500/20 rounded-full dark:text-amber-350">
                        Dirty
                      </span>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Tap to Clean
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-success bg-green-500/10 dark:bg-green-500/20 rounded-full">
                        Available
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
      </div>

      {/* Quick checkout option */}
      <div className="pt-8 border-t border-stone-200 dark:border-stone-800 text-center">
        <button
          onClick={() => {
            createNewOrder(null); // quick takeaway order
            router.push("/terminal/order");
          }}
          className="px-6 py-3 bg-stone-950 hover:bg-stone-900 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
        >
          🛍️ Start Counter / Takeaway Order
        </button>
      </div>
    </section>
  );
}

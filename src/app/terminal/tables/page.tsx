"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { DialogModal } from "@/components/ui/dialog-modal";
import { motion, AnimatePresence } from "motion/react";
import {
  Users2, Banknote, ShoppingBag,
  ChevronRight, Plus, Calendar, Clock, Phone, StickyNote, CheckCircle2, XCircle, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function TablesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const {
    floors, tables, bookings, customers, orders, activeSession,
    loadTableOrder, createNewOrder, toggleTableStatus, updateBookingStatus, linkCustomerToOrder,
  } = useApp();

  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [isResModalOpen, setIsResModalOpen] = useState(false);

  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) setSelectedFloorId(floors[0].id);
  }, [floors, selectedFloorId]);

  if (!activeSession) return null;

  const getTableReservation = (tableId: string) => {
    const now = new Date();
    return bookings.find((b) => {
      if (b.status === "cancelled") return false;
      const bTime = new Date(b.bookingTime);
      const diffMins = (bTime.getTime() - now.getTime()) / 60000;
      
      // Proximity check: starts between 30 mins in future and 2 hours in past
      return b.tableId === tableId && diffMins >= -120 && diffMins <= 30;
    });
  };

  const floorTables = tables.filter((t) => t.floorId === selectedFloorId);

  return (
    <section className="flex-1 p-5 lg:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Restaurant Floor Plan
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
            Select an occupied table to continue, or tap an available table to seat new guests.
          </p>
        </div>

        {/* Floor selector */}
        {floors.length > 1 && (
          <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800/80 p-1 rounded-2xl w-fit shrink-0">
            {floors.map((floor) => {
              const active = selectedFloorId === floor.id;
              return (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloorId(floor.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                    active
                      ? "bg-white dark:bg-stone-700 text-primary dark:text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                  )}
                >
                  {floor.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Table Grid ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedFloorId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {floorTables.map((table) => {
            const activeOrder = orders.find(
              (o) => o.tableId === table.id && o.status === "draft" && o.sessionId === activeSession.id
            );
            const isOccupied = !!activeOrder;
            const isDirty = table.status === "DIRTY";
            const isDisabled = !table.isActive;
            const reservation = getTableReservation(table.id);
            const isReserved = !!reservation && !isOccupied;

            // Status config
            const statusConfig = isDirty
              ? { ring: "ring-amber-400/60", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300/60 dark:border-amber-700/40", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300", badgeText: "Needs Cleaning" }
              : isOccupied
              ? { ring: "ring-red-400/50", bg: "bg-red-50 dark:bg-red-950/15", border: "border-red-300/50 dark:border-red-800/40", badge: "bg-red-500/15 text-red-600 dark:text-red-400", badgeText: "Occupied" }
              : isReserved
              ? { ring: "ring-yellow-500/50", bg: "bg-yellow-50/50 dark:bg-yellow-950/10", border: "border-yellow-300/60 dark:border-yellow-800/40", badge: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300", badgeText: `Reserved at ${new Date(reservation.bookingTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` }
              : { ring: "ring-emerald-400/40", bg: "bg-white dark:bg-stone-900", border: "border-stone-200 dark:border-stone-800", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", badgeText: "Available" };

            return (
              <motion.button
                key={table.id}
                whileHover={isDisabled ? {} : { scale: 1.03, y: -2 }}
                whileTap={isDisabled ? {} : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={async () => {
                  if (isDisabled) return;
                  if (isDirty) {
                    const ok = await confirm({
                      title: "Table Needs Cleaning",
                      message: `Table ${table.tableNumber} is marked as dirty. Mark it as available and proceed?`,
                      confirmLabel: "Mark Available",
                      variant: "warning",
                    });
                    if (ok) toggleTableStatus(table.id);
                    return;
                  }
                  
                  if (isReserved && reservation) {
                    setActiveReservation(reservation);
                    setIsResModalOpen(true);
                    return;
                  }

                  loadTableOrder(table.id);
                  router.push("/terminal/order");
                }}
                disabled={isDisabled}
                className={cn(
                  "relative flex flex-col items-center text-center p-5 rounded-3xl border-2 ring-2 shadow-sm transition-all duration-300",
                  statusConfig.ring, statusConfig.bg, statusConfig.border,
                  isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"
                )}
              >
                {/* Seats badge */}
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-full">
                  <Users2 className="size-2.5" />
                  {table.seats}
                </span>

                {/* Status icon */}
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-xl",
                  isDirty
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : isOccupied
                    ? "bg-red-100 dark:bg-red-900/30"
                    : isReserved
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-emerald-50 dark:bg-emerald-900/20"
                )}>
                  {isDirty ? "🧹" : isOccupied ? "🍽️" : isReserved ? "🗓️" : "🪑"}
                </div>

                {/* Table number */}
                <p className="font-extrabold text-lg leading-tight text-stone-800 dark:text-stone-100">
                  {table.tableNumber}
                </p>

                {/* Status pill */}
                <span className={cn(
                  "mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                  statusConfig.badge
                )}>
                  {!isDirty && !isOccupied && !isReserved && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {statusConfig.badgeText}
                </span>

                {/* Occupied details */}
                {isOccupied && activeOrder && (
                  <div className="mt-2 space-y-0.5">
                    <p className="font-black text-sm text-red-605 dark:text-red-400 flex items-center gap-1 justify-center">
                      <Banknote className="size-3.5" />
                      ₹{activeOrder.total.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-stone-505">
                      {activeOrder.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* ── Takeaway CTA ── */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-center">
        <button
          onClick={() => { createNewOrder(null); router.push("/terminal/order"); }}
          className="flex items-center gap-2.5 px-6 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.97] hover:shadow-xl cursor-pointer"
        >
          <ShoppingBag className="size-4.5" />
          Start Counter / Takeaway Order
          <ChevronRight className="size-4 opacity-60" />
        </button>
      </div>

      {/* ── Dialog Modal: Reservation Check-In ── */}
      <DialogModal
        isOpen={isResModalOpen}
        onClose={() => setIsResModalOpen(false)}
        title="Table Reserved"
        description="This table has an upcoming guest reservation."
        icon={<Calendar className="size-5 text-yellow-500" />}
        size="md"
      >
        {activeReservation && (() => {
          const cust = customers.find(c => c.id === activeReservation.customerId);
          const bTime = new Date(activeReservation.bookingTime);
          
          return (
            <div className="space-y-5">
              <div className="p-4 bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-650 dark:text-yellow-400">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                      {cust ? cust.name : "Reserved Guest"}
                    </h4>
                    <span className="text-[10px] uppercase font-black text-yellow-600 dark:text-yellow-405 block tracking-wider">
                      Expected at {bTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {cust && cust.phone && (
                  <p className="text-xs text-stone-500 font-semibold border-t border-stone-200/55 dark:border-stone-850 pt-2 flex items-center gap-1.5">
                    <Phone className="size-3.5" /> Contact: {cust.phone}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl">
                  <span className="text-[10px] text-stone-400 block font-bold uppercase">Table Capacity</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{tables.find(t => t.id === activeReservation.tableId)?.seats || 4} Seats</span>
                </div>
                <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl">
                  <span className="text-[10px] text-stone-400 block font-bold uppercase">Reserved For</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{activeReservation.guestsCount} Guests</span>
                </div>
              </div>

              {activeReservation.notes && (
                <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-800 rounded-xl flex gap-2 items-start">
                  <StickyNote className="size-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] uppercase font-black text-stone-450 block">Special Requests</span>
                    <p className="text-xs text-stone-605 dark:text-stone-300 font-medium italic">{activeReservation.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-3 border-t border-stone-150 dark:border-stone-800">
                <button
                  onClick={async () => {
                    setIsResModalOpen(false);
                    if (activeReservation.status === "pending") {
                      await updateBookingStatus(activeReservation.id, "confirmed");
                    }
                    loadTableOrder(activeReservation.tableId);
                    linkCustomerToOrder(activeReservation.customerId);
                    router.push("/terminal/order");
                  }}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-97"
                >
                  <CheckCircle2 className="size-4" /> Seat Guest &amp; Start Order
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Cancel Booking",
                        message: "Are you sure you want to cancel this guest reservation?",
                        confirmLabel: "Cancel Booking",
                        variant: "danger"
                      });
                      if (ok) {
                        await updateBookingStatus(activeReservation.id, "cancelled");
                        setIsResModalOpen(false);
                      }
                    }}
                    className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel Booking
                  </button>

                  <button
                    onClick={() => {
                      setIsResModalOpen(false);
                      loadTableOrder(activeReservation.tableId);
                      router.push("/terminal/order");
                    }}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-250 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-750 dark:text-stone-300 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-colors cursor-pointer border border-stone-250 dark:border-stone-750"
                  >
                    Walk-in Override
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </DialogModal>
    </section>
  );
}

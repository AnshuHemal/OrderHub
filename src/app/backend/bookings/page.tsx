"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";
import { DialogModal } from "@/components/ui/dialog-modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Plus, CheckCircle2, XCircle, Clock,
  MapPin, Users2, StickyNote, Grid, List, ChevronLeft, ChevronRight, Trash2, Info, User, Mail, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 9:00 AM to 10:00 PM (hour 22)

export default function BookingsPage() {
  const {
    customers, tables, bookings, createBooking, updateBookingStatus, deleteBooking
  } = useApp();
  const { success, error } = useToast();
  const confirm = useConfirm();

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingCustId, setBookingCustId] = useState("");
  const [bookingTableId, setBookingTableId] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingGuests, setBookingGuests] = useState("2");
  const [bookingNotes, setBookingNotes] = useState("");

  // Detailed view state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, viewMode]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [bookings.length, totalPages, currentPage]);

  useEffect(() => {
    if (customers.length > 0 && !bookingCustId) setBookingCustId(String(customers[0].id));
    if (tables.length > 0 && !bookingTableId) setBookingTableId(String(tables[0].id));
  }, [customers, tables, bookingCustId, bookingTableId]);

  const openNewModal = () => {
    setBookingNotes("");
    setBookingGuests("2");
    
    // Set default booking time to today at 7:00 PM
    const now = new Date(selectedDate);
    now.setHours(19, 0, 0, 0);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setBookingTime(`${year}-${month}-${day}T19:00`);

    if (tables.length > 0) setBookingTableId(tables[0].id);
    if (customers.length > 0) setBookingCustId(customers[0].id);

    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCustId || !bookingTableId || !bookingTime || !bookingGuests) return;

    try {
      const created = await createBooking({
        customerId: bookingCustId,
        tableId: bookingTableId,
        bookingTime: new Date(bookingTime).toISOString(),
        guestsCount: parseInt(bookingGuests) || 2,
        status: "pending",
        notes: bookingNotes,
      });
      if (created) {
        success("Booking Created", "The reservation has been logged successfully.");
      }
    } catch (err) {
      error("Failed", "Could not complete booking registration.");
    }

    closeModal();
  };

  const handleCellClick = (tableId: string, hour: number) => {
    setBookingTableId(tableId);
    
    const time = new Date(selectedDate);
    time.setHours(hour, 0, 0, 0);
    
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, "0");
    const day = String(time.getDate()).padStart(2, "0");
    const hours = String(time.getHours()).padStart(2, "0");
    
    setBookingTime(`${year}-${month}-${day}T${hours}:00`);
    setBookingNotes("");
    setBookingGuests("2");
    
    if (customers.length > 0) setBookingCustId(customers[0].id);
    setIsModalOpen(true);
  };

  const openDetailsModal = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsOpen(false);
    setSelectedBooking(null);
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  };

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Filters bookings that match selected date (for scheduler grid)
  const currentGridBookings = bookings.filter((b) => {
    const bTime = new Date(b.bookingTime);
    return isSameDay(bTime, new Date(selectedDate));
  });

  const getBookingForSlot = (tableId: string, hour: number) => {
    return currentGridBookings.find((b) => {
      if (b.status === "cancelled") return false;
      const bTime = new Date(b.bookingTime);
      return b.tableId === tableId && bTime.getHours() === hour;
    });
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-405";
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  const statusConfig = {
    confirmed: { icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20", label: "Confirmed" },
    pending:   { icon: Clock, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20", label: "Pending" },
    cancelled: { icon: XCircle, cls: "bg-red-500/10 text-red-500 border border-red-500/20", label: "Cancelled" },
  };

  return (
    <div className="space-y-6 animate-fade-in text-sm text-stone-850 dark:text-stone-200">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-stone-200 dark:border-stone-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Table Reservations Scheduler
          </h2>
          <p className="text-stone-500 dark:text-stone-405 mt-1">
            Visual timetable grid syncs reservations with the restaurant floor plan table status cards.
          </p>
        </div>

        {/* View switcher & Create Trigger */}
        <div className="flex items-center flex-wrap gap-3 self-start lg:self-auto select-none">
          <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-2xl border border-stone-200 dark:border-stone-850 gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "grid"
                  ? "bg-white dark:bg-stone-850 text-primary dark:text-white shadow-sm border border-stone-200/80 dark:border-stone-800"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-305"
              )}
            >
              <Grid className="size-3.5" /> Timeline Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === "list"
                  ? "bg-white dark:bg-stone-850 text-primary dark:text-white shadow-sm border border-stone-200/80 dark:border-stone-800"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-305"
              )}
            >
              <List className="size-3.5" /> Table List Log
            </button>
          </div>

          <button
            id="btn-log-booking"
            onClick={openNewModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus className="size-4" /> Book Table
          </button>
        </div>
      </div>

      {/* ── Date Navigator Panel ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-850 p-4 rounded-3xl backdrop-blur-sm select-none">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <span className="font-extrabold text-stone-800 dark:text-stone-200 text-sm md:text-base">
            {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-stone-400 dark:text-stone-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* ── View: Visual Grid Scheduler ── */}
      {viewMode === "grid" && (
        <div className="bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[1200px]">
              
              {/* Header slot timeline */}
              <div className="grid grid-cols-[130px_repeat(14,_1fr)] border-b border-stone-200 dark:border-stone-800 select-none">
                <div className="sticky left-0 bg-stone-50 dark:bg-stone-950 p-4 font-black text-xs uppercase tracking-wider text-stone-400 dark:text-stone-500 border-r border-stone-200 dark:border-stone-800 z-10">
                  Tables
                </div>
                {HOURS.map((hour) => (
                  <div key={hour} className="p-4 text-center font-bold text-xs text-stone-500 dark:text-stone-400 bg-stone-50/50 dark:bg-stone-900/60 border-r border-stone-150 dark:border-stone-800 last:border-0">
                    {formatHour(hour)}
                  </div>
                ))}
              </div>

              {/* Rows matching Dining Tables */}
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {tables.map((table) => (
                  <div key={table.id} className="grid grid-cols-[130px_repeat(14,_1fr)] group">
                    
                    {/* Row header table detail */}
                    <div className="sticky left-0 bg-white dark:bg-stone-900 p-4 border-r border-stone-200 dark:border-stone-800 flex items-center justify-between gap-1 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                      <div className="min-w-0">
                        <span className="font-extrabold text-stone-800 dark:text-stone-100 text-sm block truncate">{table.tableNumber}</span>
                        <span className="text-[10px] text-stone-450 dark:text-stone-500 font-bold block">{table.seats} Seats</span>
                      </div>
                      <span className="text-[9px] bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-750 px-1.5 py-0.5 rounded-lg text-stone-455 font-mono">
                        #{table.id.slice(-4)}
                      </span>
                    </div>

                    {/* Hourly cells */}
                    {HOURS.map((hour) => {
                      const slotBooking = getBookingForSlot(table.id, hour);
                      
                      return (
                        <div
                          key={hour}
                          className="h-20 border-r border-stone-150 dark:border-stone-800/60 last:border-0 p-1.5 relative flex flex-col justify-center select-none"
                        >
                          {slotBooking ? (
                            // Render Booking Block
                            (() => {
                              const cust = customers.find(c => c.id === slotBooking.customerId);
                              const cfg = statusConfig[slotBooking.status as keyof typeof statusConfig] ?? statusConfig.pending;
                              return (
                                <motion.div
                                  onClick={() => openDetailsModal(slotBooking)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={cn(
                                    "w-full h-full rounded-2xl p-2 flex flex-col justify-between cursor-pointer shadow-sm text-left transition-all z-0",
                                    cfg.cls
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-black truncate leading-none">
                                      {cust ? cust.name : "Guest"}
                                    </span>
                                    <span className="text-[9px] font-black opacity-80 shrink-0 uppercase tracking-wider">
                                      {cfg.label}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-1 mt-auto">
                                    <span className="text-[10px] opacity-75 font-mono font-bold flex items-center gap-0.5 shrink-0">
                                      <Users2 className="size-3" /> {slotBooking.guestsCount}
                                    </span>
                                    {slotBooking.notes && (
                                      <StickyNote className="size-3 text-stone-400 shrink-0" />
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })()
                          ) : (
                            // Render Empty Cell trigger click
                            <div
                              onClick={() => handleCellClick(table.id, hour)}
                              className="w-full h-full rounded-2xl border border-dashed border-transparent hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50/60 dark:hover:bg-stone-950/20 cursor-pointer flex items-center justify-center text-transparent hover:text-stone-350 dark:hover:text-stone-600 transition-all font-black text-[10px] uppercase tracking-wider"
                            >
                              + Book
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── View: List Table Log ── */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/60 border-b border-stone-150 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-xs select-none">
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Table</th>
                  <th className="px-6 py-4">Reservation Time</th>
                  <th className="px-6 py-4">Guests</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {paginatedBookings.map((booking) => {
                  const cust = customers.find((c) => c.id === booking.customerId);
                  const table = tables.find((t) => t.id === booking.tableId);
                  const status = statusConfig[booking.status as keyof typeof statusConfig] ?? statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={booking.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-850 dark:text-stone-200">
                        {cust ? cust.name : (
                          <span className="font-mono text-stone-400 cursor-help text-xs" title={booking.customerId}>
                            Guest #{booking.customerId.slice(-8)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                          <MapPin className="size-3.5" />
                          {table ? table.tableNumber : (
                            <span className="font-mono text-stone-400 text-xs">#{booking.tableId.slice(-8)}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-500">
                        {new Date(booking.bookingTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 font-mono font-bold">
                          <Users2 className="size-3.5 text-stone-450" />
                          {booking.guestsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-400 italic max-w-[160px] truncate">
                        {booking.notes ? (
                          <span className="inline-flex items-center gap-1.5" title={booking.notes}>
                            <StickyNote className="size-3 shrink-0" />{booking.notes}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.cls}`}>
                          <StatusIcon className="size-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openDetailsModal(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Info className="size-3" /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center text-stone-450 italic z-0">
                      No table bookings logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {bookings.length > 20 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 font-sans">
              <span className="text-xs text-stone-500 font-medium">
                Showing <span className="font-bold text-stone-800 dark:text-stone-200">{Math.min(bookings.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(bookings.length, currentPage * itemsPerPage)}</span> of <span className="font-bold text-stone-800 dark:text-stone-200">{bookings.length}</span> reservations
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-300 disabled:opacity-40 transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  if (totalPages > 5) {
                    if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                      if (pageNum === 2 && currentPage > 3) {
                        return <span key="ellipsis-left" className="px-2 text-stone-400">...</span>;
                      }
                      if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                        return <span key="ellipsis-right" className="px-2 text-stone-400">...</span>;
                      }
                      return null;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95",
                        currentPage === pageNum
                          ? "bg-primary text-white shadow-sm"
                          : "border border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-300 disabled:opacity-40 transition-all cursor-pointer active:scale-95"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dialog Modal: Log Table Booking ── */}
      <DialogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Log Table Booking"
        description="Create a dining reservation for a registered guest."
        icon={<CalendarDays className="size-5" />}
        size="lg"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Select Guest Customer <span className="text-red-500">*</span></label>
              <select
                value={bookingCustId}
                onChange={(e) => setBookingCustId(e.target.value)}
                className={inputCls}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || "No Phone"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Select Dining Table <span className="text-red-500">*</span></label>
              <select
                value={bookingTableId}
                onChange={(e) => setBookingTableId(e.target.value)}
                className={inputCls}
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} ({t.seats} seats)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Booking Date &amp; Time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Number of Guests <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                value={bookingGuests}
                onChange={(e) => setBookingGuests(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className={labelCls}>
                Special Notes / Requests{" "}
                <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Anniversary celebration, window seat preferred, nut allergy..."
                className={inputCls + " resize-none"}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-stone-150 dark:border-stone-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </DialogModal>

      {/* ── Dialog Modal: Reservation Details & Actions ── */}
      <DialogModal
        isOpen={isDetailsOpen}
        onClose={closeDetailsModal}
        title="Reservation Details"
        description="View details and manage table booking logs."
        icon={<Info className="size-5 text-primary" />}
        size="md"
      >
        {selectedBooking && (() => {
          const cust = customers.find(c => c.id === selectedBooking.customerId);
          const table = tables.find(t => t.id === selectedBooking.tableId);
          const cfg = statusConfig[selectedBooking.status as keyof typeof statusConfig] ?? statusConfig.pending;

          return (
            <div className="space-y-6">
              
              {/* Guest Card Panel */}
              <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                      {cust ? cust.name : "Walk-in Guest"}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                      Customer Profile
                    </span>
                  </div>
                </div>

                {cust && (
                  <div className="pt-2.5 border-t border-stone-200/60 dark:border-stone-850 grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-500 text-xs font-semibold">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5 text-stone-400 shrink-0" />
                      <span>{cust.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-stone-400 shrink-0" />
                      <span>{cust.phone || "No Phone Registered"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Table / Date details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-black text-stone-450 tracking-wider">Reserved Table</span>
                  <div className="flex items-center gap-2 text-primary font-extrabold text-sm">
                    <MapPin className="size-4" />
                    <span>{table ? table.tableNumber : "Table"} ({table ? table.seats : 2} Seats)</span>
                  </div>
                </div>

                <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-black text-stone-450 tracking-wider">Expected Guests</span>
                  <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-extrabold text-sm">
                    <Users2 className="size-4 text-stone-400" />
                    <span>{selectedBooking.guestsCount} People</span>
                  </div>
                </div>

                <div className="col-span-2 p-3 border border-stone-200 dark:border-stone-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-black text-stone-450 tracking-wider">Reservation Time</span>
                  <div className="flex items-center gap-2 text-stone-750 dark:text-stone-200 font-extrabold text-sm">
                    <Clock className="size-4 text-stone-400" />
                    <span>{new Date(selectedBooking.bookingTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Special Instructions Notes */}
              <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 dark:border-amber-500/20 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                  <StickyNote className="size-3" /> Special Requests
                </span>
                <p className="text-xs font-semibold leading-relaxed text-amber-800 dark:text-amber-350 italic">
                  {selectedBooking.notes || "No special requests mentioned by client."}
                </p>
              </div>

              {/* Status Section */}
              <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500">Current Status:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Actions Button Row */}
                <div className="flex items-center gap-2 select-none">
                  {selectedBooking.status === "pending" && (
                    <button
                      onClick={async () => {
                        await updateBookingStatus(selectedBooking.id, "confirmed");
                        success("Booking Confirmed", "Guest booking status is set to confirmed.");
                        closeDetailsModal();
                      }}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="size-3.5" /> Confirm
                    </button>
                  )}
                  {selectedBooking.status !== "cancelled" && (
                    <button
                      onClick={async () => {
                        await updateBookingStatus(selectedBooking.id, "cancelled");
                        success("Booking Cancelled", "Guest booking status has been set to cancelled.");
                        closeDetailsModal();
                      }}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="size-3.5" /> Cancel
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Delete Reservation",
                        message: "Are you sure you want to remove this table booking? This action is permanent.",
                        confirmLabel: "Delete",
                        variant: "danger"
                      });
                      if (ok) {
                        await deleteBooking(selectedBooking.id);
                        success("Booking Deleted", "Table booking has been removed from database log.");
                        closeDetailsModal();
                      }
                    }}
                    className="p-2 bg-stone-100 hover:bg-red-500/10 hover:text-red-500 text-stone-500 dark:bg-stone-850 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                    title="Delete Booking"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })()}
      </DialogModal>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";

export default function BookingsPage() {
  const {
    customers,
    tables,
    bookings,
    createBooking,
    updateBookingStatus
  } = useApp();

  // Booking states
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingCustId, setBookingCustId] = useState("");
  const [bookingTableId, setBookingTableId] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingGuests, setBookingGuests] = useState("2");
  const [bookingNotes, setBookingNotes] = useState("");

  // Select defaults on load/change
  useEffect(() => {
    if (customers.length > 0 && !bookingCustId) {
      setBookingCustId(String(customers[0].id));
    }
    if (tables.length > 0 && !bookingTableId) {
      setBookingTableId(String(tables[0].id));
    }
  }, [customers, tables, bookingCustId, bookingTableId]);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCustId || !bookingTableId || !bookingTime || !bookingGuests) return;

    createBooking({
      customerId: bookingCustId,
      tableId: bookingTableId,
      bookingTime,
      guestsCount: parseInt(bookingGuests) || 2,
      status: "pending",
      notes: bookingNotes
    });

    setBookingNotes("");
    setShowBookingForm(false);
    alert("Table reservation booking logged successfully!");
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-855 pb-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Table Reservations & Booking Log</h2>
          <p className="text-stone-500 mt-0.5">Schedule guest bookings for specific dining tables.</p>
        </div>
        <button
          onClick={() => setShowBookingForm(!showBookingForm)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-colors"
        >
          + Log Table Booking
        </button>
      </div>

      {showBookingForm && (
        <form onSubmit={handleBookingSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-xl animate-fade-in">
          <h3 className="font-extrabold text-sm border-b border-stone-100 pb-2">Create Dining Reservation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-550 dark:text-stone-400 mb-1">Select Guest Customer</label>
              <select
                value={bookingCustId}
                onChange={(e) => setBookingCustId(e.target.value)}
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || "No Phone"})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-stone-550 dark:text-stone-400 mb-1">Select Dining Table</label>
              <select
                value={bookingTableId}
                onChange={(e) => setBookingTableId(e.target.value)}
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
              >
                {tables.map(t => (
                  <option key={t.id} value={t.id}>{t.tableNumber} ({t.seats} seats)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-stone-550 dark:text-stone-400 mb-1">Booking Date & Time</label>
              <input
                type="datetime-local"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                required
              />
            </div>
            <div>
              <label className="block text-stone-550 dark:text-stone-400 mb-1">Guests Count</label>
              <input
                type="number"
                min="1"
                value={bookingGuests}
                onChange={(e) => setBookingGuests(e.target.value)}
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-200"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-stone-550 dark:text-stone-400 mb-1">Special Notes / Requests</label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Anniversary celebration, birthday cake, window seat preferred"
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-955 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow">
              Log Booking
            </button>
            <button
              type="button"
              onClick={() => setShowBookingForm(false)}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bookings table representation */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-150 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Guest Customer</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Reservation Time</th>
                <th className="px-6 py-4">Guests</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {bookings.map((booking) => {
                const cust = customers.find(c => c.id === booking.customerId);
                const table = tables.find(t => t.id === booking.tableId);
                
                return (
                  <tr key={booking.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-800 dark:text-stone-200">
                      {cust ? cust.name : `Guest ID #${booking.customerId}`}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary dark:text-amber-500">
                      {table ? table.tableNumber : `Table ID #${booking.tableId}`}
                    </td>
                    <td className="px-6 py-4 text-stone-500">
                      {new Date(booking.bookingTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">{booking.guestsCount} guests</td>
                    <td className="px-6 py-4 text-stone-400 italic font-light truncate max-w-xs">{booking.notes || "None"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-green-500/10 text-success"
                          : booking.status === "pending"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-red-500/10 text-danger"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {booking.status === "pending" && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-success rounded font-bold text-[10px] transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      {booking.status !== "cancelled" && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded font-bold text-[10px] transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

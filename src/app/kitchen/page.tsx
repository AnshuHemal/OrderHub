"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, Order, OrderItem, KitchenStage } from "@/app/context/AppContext";

export default function KitchenDisplay() {
  const router = useRouter();
  const { orders, categories, products, updateKdsStage, toggleKdsItemComplete } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Time ticker to update "minutes elapsed" dynamically
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Filter orders containing items belonging to the selected category (if any) and matching search
  const filteredOrders = orders
    .filter((order) => {
      // KDS only cares about active orders (draft/paid that are not fully completed/cancelled on KDS)
      // Actually, standard POS sends orders to kitchen as "draft" or "paid".
      // We will show all orders that are NOT cancelled, and have items in the kitchen
      if (order.status === "cancelled") return false;
      if (order.items.length === 0) return false;

      // Filter by category
      if (selectedCategoryId !== null) {
        const hasItemInCat = order.items.some((item) => {
          const prod = products.find((p) => p.id === item.productId);
          return prod?.categoryId === selectedCategoryId;
        });
        if (!hasItemInCat) return false;
      }

      // Filter by search query (order number, product name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesOrderNum = order.orderNumber.toLowerCase().includes(query);
        const matchesProdName = order.items.some((it) => it.name.toLowerCase().includes(query));
        return matchesOrderNum || matchesProdName;
      }

      return true;
    })
    .map((order) => {
      // If category filter is applied, only show matching products inside the ticket
      if (selectedCategoryId !== null) {
        return {
          ...order,
          items: order.items.filter((item) => {
            const prod = products.find((p) => p.id === item.productId);
            return prod?.categoryId === selectedCategoryId;
          })
        };
      }
      return order;
    });

  // Distribute tickets based on their items' kitchen stage
  // If items have mixed stages, we classify the ticket by its lowest stage:
  // e.g. if any item is 'to_cook', the ticket is in 'To Cook'
  // else if any item is 'preparing', the ticket is in 'Preparing'
  // else it is 'Completed'
  const getTicketStage = (order: Order): KitchenStage => {
    if (order.items.every((it) => it.status === "completed")) {
      return "completed";
    }
    if (order.items.some((it) => it.status === "to_cook")) {
      return "to_cook";
    }
    return "preparing";
  };

  const toCookTickets = filteredOrders.filter((o) => getTicketStage(o) === "to_cook");
  const preparingTickets = filteredOrders.filter((o) => getTicketStage(o) === "preparing");
  const completedTickets = filteredOrders.filter((o) => getTicketStage(o) === "completed");

  const getElapsedTime = (isoString: string): string => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins < 1) return "Just now";
    return `${elapsedMins}m ago`;
  };

  const advanceTicketStage = (order: Order, currentStage: KitchenStage) => {
    if (currentStage === "to_cook") {
      updateKdsStage(order.id, "preparing");
    } else if (currentStage === "preparing") {
      updateKdsStage(order.id, "completed");
    } else if (currentStage === "completed") {
      // Kitchen archive / hide completed tickets
      alert(`Archiving Ticket ${order.orderNumber} from KDS screen.`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-950 text-stone-100 font-sans">
      
      {/* KDS Header */}
      <header className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-amber-500 flex items-center gap-2">
            <span>🖥️</span>
            <span>Cafe Kitchen KDS</span>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-bold bg-green-500/10 text-green-400 rounded-full animate-pulse border border-green-500/20">
            Realtime Live
          </span>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-1 max-w-2xl items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket # or product..."
              className="w-full pl-9 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-200"
            />
          </div>

          {/* Quick exit */}
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-all"
          >
            ← POS Sessions
          </button>
        </div>
      </header>

      {/* Categories Horizontal Tabs */}
      <div className="bg-stone-900/40 px-6 py-2 border-b border-stone-900/80 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategoryId === null
              ? "bg-amber-500 text-black shadow-md"
              : "bg-stone-800 text-stone-400 hover:bg-stone-700"
          }`}
        >
          All Stations
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all bg-stone-800 hover:bg-stone-700 text-stone-300 border-l-4`}
            style={{ borderLeftColor: cat.color }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ========================================================
          THREE STAGE TICKET COLUMNS
      ======================================================== */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 p-6 gap-6 overflow-hidden">
        
        {/* COLUMN 1: TO COOK */}
        <section className="flex flex-col bg-stone-900/50 rounded-3xl border border-stone-800/80 p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h2 className="font-extrabold text-stone-200 text-sm uppercase tracking-wider">To Cook / Queue</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full font-bold text-xs">
              {toCookTickets.length} tickets
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {toCookTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-stone-900 border-l-4 border-red-500 rounded-2xl p-4 shadow-lg space-y-3 animate-fade-in"
              >
                {/* Ticket Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-amber-500 text-sm">Ticket: {ticket.orderNumber}</h3>
                    <span className="text-[10px] text-stone-500 block">Ordered {getElapsedTime(ticket.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => advanceTicketStage(ticket, "to_cook")}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors"
                  >
                    Start Cook →
                  </button>
                </div>

                {/* Ticket Items list */}
                <ul className="divide-y divide-stone-800 text-xs">
                  {ticket.items.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => toggleKdsItemComplete(ticket.id, item.id)}
                      className={`py-2 flex items-center justify-between cursor-pointer group hover:bg-stone-800/20 px-1 rounded transition-colors ${
                        item.status === "completed" ? "line-through text-stone-600 font-normal" : "font-semibold text-stone-300"
                      }`}
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-stone-500 font-bold transition-opacity">
                        {item.status === "completed" ? "Re-open" : "Done"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {toCookTickets.length === 0 && (
              <div className="h-40 flex items-center justify-center text-stone-600 text-xs italic">
                No orders waiting to cook.
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 2: PREPARING */}
        <section className="flex flex-col bg-stone-900/50 rounded-3xl border border-stone-800/80 p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="font-extrabold text-stone-200 text-sm uppercase tracking-wider">Preparing / Cooking</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-bold text-xs">
              {preparingTickets.length} tickets
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {preparingTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-stone-900 border-l-4 border-amber-500 rounded-2xl p-4 shadow-lg space-y-3 animate-fade-in"
              >
                {/* Ticket Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-amber-500 text-sm">Ticket: {ticket.orderNumber}</h3>
                    <span className="text-[10px] text-stone-500 block">Started {getElapsedTime(ticket.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => advanceTicketStage(ticket, "preparing")}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors"
                  >
                    Finish Order →
                  </button>
                </div>

                {/* Ticket Items list */}
                <ul className="divide-y divide-stone-800 text-xs">
                  {ticket.items.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => toggleKdsItemComplete(ticket.id, item.id)}
                      className={`py-2 flex items-center justify-between cursor-pointer group hover:bg-stone-800/20 px-1 rounded transition-colors ${
                        item.status === "completed" ? "line-through text-stone-600 font-normal" : "font-semibold text-stone-300"
                      }`}
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-stone-500 font-bold transition-opacity">
                        {item.status === "completed" ? "Re-open" : "Done"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {preparingTickets.length === 0 && (
              <div className="h-40 flex items-center justify-center text-stone-600 text-xs italic">
                No orders currently in prep.
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 3: COMPLETED */}
        <section className="flex flex-col bg-stone-900/50 rounded-3xl border border-stone-800/80 p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <h2 className="font-extrabold text-stone-200 text-sm uppercase tracking-wider">Completed / Ready</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-green-500/10 text-green-400 rounded-full font-bold text-xs">
              {completedTickets.length} tickets
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {completedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-stone-900 border-l-4 border-green-500 rounded-2xl p-4 shadow-lg space-y-3 opacity-75 animate-fade-in hover:opacity-100 transition-opacity"
              >
                {/* Ticket Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-amber-500 text-sm">Ticket: {ticket.orderNumber}</h3>
                    <span className="text-[10px] text-stone-500 block">Completed {getElapsedTime(ticket.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => advanceTicketStage(ticket, "completed")}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors"
                  >
                    Archive ✓
                  </button>
                </div>

                {/* Ticket Items list */}
                <ul className="divide-y divide-stone-800 text-xs">
                  {ticket.items.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => toggleKdsItemComplete(ticket.id, item.id)}
                      className="py-2 flex items-center justify-between cursor-pointer group hover:bg-stone-800/20 px-1 rounded line-through text-stone-500 font-normal transition-colors"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-stone-400 font-bold transition-opacity">
                        Re-open
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {completedTickets.length === 0 && (
              <div className="h-40 flex items-center justify-center text-stone-600 text-xs italic">
                No orders ready for pickup.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

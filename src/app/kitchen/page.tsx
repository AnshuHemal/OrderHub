"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, Order, OrderItem, KitchenStage } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "motion/react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import {
  Monitor,
  Clock,
  ArrowLeft,
  Search,
  ChefHat,
  CheckCircle2,
  Archive,
  Filter,
  Sparkles,
  Flame,
  Utensils,
  User,
  ListChecks,
  AlertTriangle,
  Play,
  ShoppingBag,
  Inbox,
  GripVertical,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";

type StageFilter = "all" | "to_cook" | "preparing" | "completed";

// ==========================================
// 1. Droppable Column Component
// ==========================================
interface DroppableColumnProps {
  id: KitchenStage;
  title: string;
  count: number;
  selectedStage: StageFilter;
  children: React.ReactNode;
}

function DroppableColumn({ id, title, count, selectedStage, children }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-stone-100/40 dark:bg-stone-900/30 rounded-3xl border border-stone-200/60 dark:border-stone-900 p-4 overflow-hidden h-full flex flex-col gap-4 transition-all duration-300",
        isOver && (
          id === "to_cook" ? "border-rose-500/50 bg-rose-500/5 shadow-lg shadow-rose-500/5" :
          id === "preparing" ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/5" :
          "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/5"
        ),
        selectedStage !== "all" && "max-w-xl mx-auto"
      )}
    >
      {/* Column Title */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-850 shrink-0">
        <div className="flex items-center gap-2">
          {id === "to_cook" && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
          {id === "preparing" && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />}
          {id === "completed" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
          <h2 className="font-extrabold text-stone-700 dark:text-stone-200 text-sm uppercase tracking-wider">{title}</h2>
        </div>
        <span className={cn(
          "px-2.5 py-0.5 rounded-full font-black text-xs border",
          id === "to_cook" ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455" :
          id === "preparing" ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-455" :
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-605 dark:text-emerald-455"
        )}>
          {count}
        </span>
      </div>

      {/* Column Tickets list */}
      <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-none pb-4">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// 2. Draggable Ticket Card Component
// ==========================================
// ==========================================
// 2. Pure Visual Ticket Card Component
// ==========================================
interface TicketCardProps {
  ticket: Order;
  stage: KitchenStage;
  tableLabel: string | null;
  guestName: string | null;
  elapsedMins: number;
  getElapsedTimeLabel: (isoString: string) => string;
  getStageStyles: (stage: KitchenStage) => any;
  toggleKdsItemComplete: (orderId: string, itemId: string) => void;
  advanceTicketStage: (order: Order, stage: KitchenStage) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

function TicketCard({
  ticket,
  stage,
  tableLabel,
  guestName,
  elapsedMins,
  getElapsedTimeLabel,
  getStageStyles,
  toggleKdsItemComplete,
  advanceTicketStage,
  isDragging,
  isOverlay
}: TicketCardProps) {
  const { printOrder } = useApp();
  const cfg = getStageStyles(stage);

  return (
    <div
      className={cn(
        "bg-white dark:bg-stone-900/90 border-t-4 border border-stone-200 dark:border-stone-850/85 rounded-2xl p-4 shadow-sm transition-all duration-205 flex flex-col gap-3.5",
        isDragging && "opacity-25 border-dashed border-stone-300 dark:border-stone-800 shadow-none",
        isOverlay && "shadow-2xl ring-2 ring-primary/20 cursor-grabbing rotate-2 scale-[1.02] border-t-primary border-primary/45",
        !isOverlay && !isDragging && "hover:shadow-md",
        cfg.border,
        cfg.shadow
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 select-none">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Grip handle container is just visual now */}
            <div className="p-1 rounded shrink-0 text-stone-450 dark:text-stone-500">
              <GripVertical className="size-3.5" />
            </div>
            <span className="font-black text-stone-900 dark:text-stone-100 text-sm">#{ticket.orderNumber}</span>
            <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-lg border tracking-wider", cfg.badgeBg)}>
              {cfg.badgeText}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {tableLabel ? (
              <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-black px-1.5 py-0.5 rounded-lg uppercase">
                {tableLabel}
              </span>
            ) : (
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-455 text-[10px] font-black px-1.5 py-0.5 rounded-lg uppercase flex items-center gap-1">
                <ShoppingBag className="size-2.5" /> Takeaway
              </span>
            )}
            {guestName && (
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-extrabold flex items-center gap-1">
                <User className="size-3 text-stone-400" />
                {guestName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => printOrder(ticket, true)}
            title="Print Kitchen Ticket"
            className="p-1.5 text-stone-500 hover:text-stone-850 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-800"
          >
            <Printer className="size-3.5" />
          </button>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 select-none",
            elapsedMins > 15
              ? "bg-rose-500/15 text-rose-600 dark:text-rose-455 border border-rose-500/25 animate-pulse font-extrabold"
              : elapsedMins > 8
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-455 border border-amber-500/25"
              : "bg-stone-105 dark:bg-stone-955/60 text-stone-505 dark:text-stone-400 border border-stone-200/60 dark:border-stone-800"
          )}>
            <Clock className="size-3" />
            {getElapsedTimeLabel(ticket.createdAt)}
          </span>
        </div>
      </div>

      {/* Decorative divider */}
      <div className="border-t border-dashed border-stone-200 dark:border-stone-800/80 -mx-4" />

      {/* Note Box */}
      {ticket.notes && (
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 dark:border-amber-500/20 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2 items-start shrink-0">
          <Sparkles className="size-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase tracking-wide block text-[9px] text-amber-600 dark:text-amber-400 mb-0.5">Instruction:</span>
            <p className="font-semibold leading-relaxed">{ticket.notes}</p>
          </div>
        </div>
      )}

      {/* Checklist */}
      <ul className="flex-1 divide-y divide-stone-200 dark:divide-stone-850/80 bg-stone-55 dark:bg-stone-955/40 rounded-xl border border-stone-200/60 dark:border-stone-850/60 overflow-hidden">
        {ticket.items.map((item) => (
          <li
            key={item.id}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => toggleKdsItemComplete(ticket.id, item.id)}
            className={cn(
              "py-2 px-3 flex items-center justify-between cursor-pointer group hover:bg-stone-100/50 dark:hover:bg-stone-900/60 transition-colors select-none",
              (item.status === "completed" || item.status === "served") ? "text-stone-400 dark:text-stone-500" : "text-stone-800 dark:text-stone-200"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "size-4.5 rounded-lg border flex items-center justify-center transition-all duration-200 shrink-0",
                (item.status === "completed" || item.status === "served")
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-450 scale-95"
                  : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-955 text-transparent group-hover:border-stone-400 dark:group-hover:border-stone-500"
              )}>
                <CheckCircle2 className="size-3 stroke-[3]" />
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-xs font-semibold tracking-tight transition-all duration-200",
                  (item.status === "completed" || item.status === "served") ? "line-through opacity-50 font-normal" : "font-bold"
                )}>
                  <span className="text-primary font-black mr-1">{item.quantity}x</span> {item.name}
                </span>
                
                {/* Modifiers List */}
                {item.selectedModifiers && (item.selectedModifiers as any).length > 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-500 font-extrabold mt-0.5 leading-snug">
                    + {(item.selectedModifiers as any).map((m: any) => m.name).join(", ")}
                  </span>
                )}
                
                {/* Line Item Notes */}
                {item.notes && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 italic mt-0.5">
                    &ldquo;{item.notes}&rdquo;
                  </span>
                )}
              </div>
            </div>
            <span className="opacity-0 group-hover:opacity-100 text-[9px] text-stone-400 dark:text-stone-500 font-extrabold transition-opacity uppercase tracking-wider shrink-0 pl-1">
              {(item.status === "completed" || item.status === "served") ? "Re-open" : "Done"}
            </span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      <div className="mt-auto shrink-0">
        {stage === "to_cook" && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => advanceTicketStage(ticket, "to_cook")}
            className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-97"
          >
            <Play className="size-3 stroke-[3]" /> Start Cook
          </button>
        )}
        {stage === "preparing" && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => advanceTicketStage(ticket, "preparing")}
            className="w-full py-2 bg-amber-500 hover:opacity-90 text-stone-955 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-97 font-black"
          >
            <CheckCircle2 className="size-3.5 stroke-[3] text-stone-955" /> Finish Prep
          </button>
        )}
        {stage === "completed" && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => advanceTicketStage(ticket, "completed")}
            className="w-full py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-750 dark:text-stone-300 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-stone-250 dark:border-stone-750 active:scale-97 shadow-sm"
          >
            <Archive className="size-3.5" /> Archive ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2b. Draggable Wrapper
// ==========================================
interface DraggableTicketCardProps {
  ticket: Order;
  stage: KitchenStage;
  tableLabel: string | null;
  guestName: string | null;
  elapsedMins: number;
  getElapsedTimeLabel: (isoString: string) => string;
  getStageStyles: (stage: KitchenStage) => any;
  toggleKdsItemComplete: (orderId: string, itemId: string) => void;
  advanceTicketStage: (order: Order, stage: KitchenStage) => void;
}

function DraggableTicketCard({
  ticket,
  stage,
  tableLabel,
  guestName,
  elapsedMins,
  getElapsedTimeLabel,
  getStageStyles,
  toggleKdsItemComplete,
  advanceTicketStage
}: DraggableTicketCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="outline-none touch-none select-none cursor-grab active:cursor-grabbing"
    >
      <TicketCard
        ticket={ticket}
        stage={stage}
        tableLabel={tableLabel}
        guestName={guestName}
        elapsedMins={elapsedMins}
        getElapsedTimeLabel={getElapsedTimeLabel}
        getStageStyles={getStageStyles}
        toggleKdsItemComplete={toggleKdsItemComplete}
        advanceTicketStage={advanceTicketStage}
        isDragging={isDragging}
      />
    </div>
  );
}

// ==========================================
// 3. Main KitchenDisplay Component
// ==========================================
export default function KitchenDisplay() {
  const router = useRouter();
  const { info } = useToast();
  const {
    currentUser,
    orders,
    categories,
    products,
    tables,
    customers,
    updateKdsStage,
    toggleKdsItemComplete,
    socketConnected,
    loading
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<StageFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>("All Stations");

  // Time ticker to update "minutes elapsed" dynamically
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Security warning: redirect to home if not logged in (skip while loading)
  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-955 font-sans relative overflow-hidden cafe-pattern">
        <div className="text-center space-y-4 relative z-10">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-stone-605 dark:text-stone-300">Synchronizing KDS session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  // Helper to resolve the station of any product
  const getStationForItem = React.useCallback((productId: string): string => {
    const prod = products.find(p => p.id === productId);
    const cat = categories.find(c => c.id === prod?.categoryId);
    return cat?.preparationStation || "General Kitchen";
  }, [products, categories]);

  // Extract all unique preparation stations from seeded categories
  const stationsList = React.useMemo(() => {
    const stations = new Set<string>();
    categories.forEach((c) => {
      if (c.preparationStation) {
        stations.add(c.preparationStation);
      }
    });
    return Array.from(stations);
  }, [categories]);

  // Filter and map orders containing items belonging to the selected station and matching search
  const filteredOrders = React.useMemo(() => {
    return orders
      .filter((order) => {
        if (order.status === "cancelled") return false;
        if (order.items.length === 0) return false;
        return true;
      })
      .map((order) => {
        // Filter items inside the ticket to only match the selected station (if filtered)
        const stationItems = order.items.filter((item) => {
          const itemStation = getStationForItem(item.productId);
          return selectedStation === "All Stations" || itemStation === selectedStation;
        });
        return {
          ...order,
          items: stationItems
        };
      })
      // Filter out orders that have no items belonging to this station, or whose station items are all served
      .filter((order) => {
        if (order.items.length === 0) return false;
        if (order.items.every((it) => it.status === "served")) return false;

        // Apply search query (ticket number or item name matching)
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesOrderNum = order.orderNumber.toLowerCase().includes(query);
          const matchesProdName = order.items.some((it) => it.name.toLowerCase().includes(query));
          return matchesOrderNum || matchesProdName;
        }
        return true;
      });
  }, [orders, selectedStation, searchQuery, getStationForItem]);

  const getTicketStage = (order: Order): KitchenStage => {
    if (order.items.every((it) => it.status === "completed" || it.status === "served")) {
      return "completed";
    }
    if (order.items.some((it) => it.status === "to_cook")) {
      return "to_cook";
    }
    return "preparing";
  };

  const getElapsedTimeMins = (isoString: string): number => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  const getElapsedTimeLabel = (isoString: string): string => {
    const mins = getElapsedTimeMins(isoString);
    if (mins < 1) return "Just now";
    return `${mins}m ago`;
  };

  const getTableLabel = (tableId: string | null) => {
    if (!tableId) return null;
    const t = tables.find((x) => x.id === tableId);
    return t ? `Table ${t.tableNumber}` : "Table";
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return null;
    const c = customers.find((x) => x.id === customerId);
    return c ? c.name : null;
  };

  const advanceTicketStage = (order: Order, currentStage: KitchenStage) => {
    const stationFilter = selectedStation === "All Stations" ? undefined : selectedStation;
    if (currentStage === "to_cook") {
      updateKdsStage(order.id, "preparing", stationFilter);
    } else if (currentStage === "preparing") {
      updateKdsStage(order.id, "completed", stationFilter);
    } else if (currentStage === "completed") {
      updateKdsStage(order.id, "SERVED", stationFilter);
      info("Ticket Archived", `Order #${order.orderNumber} has been cleared from this KDS station.`);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // dnd-kit Drag End Action Handler
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const targetStage = over.id as KitchenStage;

    const ticket = orders.find((o) => o.id === ticketId);
    if (!ticket) return;

    const sourceStage = getTicketStage(ticket);
    if (sourceStage === targetStage) return;

    // Execute stage update
    const stationFilter = selectedStation === "All Stations" ? undefined : selectedStation;
    updateKdsStage(ticketId, targetStage, stationFilter);

    const stageNames: Record<KitchenStage, string> = {
      to_cook: "Queue / To Cook",
      preparing: "Preparing / Cooking",
      completed: "Ready / Completed",
      PENDING: "Pending",
      PREPARING: "Preparing",
      READY: "Ready",
      SERVED: "Served",
      served: "Served"
    };
    info("Ticket Moved", `Order #${ticket.orderNumber} moved to ${stageNames[targetStage]}.`);
  };

  // Group tickets by stage
  const toCookTickets = filteredOrders
    .filter((o) => getTicketStage(o) === "to_cook")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const preparingTickets = filteredOrders
    .filter((o) => getTicketStage(o) === "preparing")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const completedTickets = filteredOrders
    .filter((o) => getTicketStage(o) === "completed")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const toCookCount = toCookTickets.length;
  const preparingCount = preparingTickets.length;
  const completedCount = completedTickets.length;

  const getStageStyles = (stage: KitchenStage) => {
    switch (stage) {
      case "to_cook":
        return {
          border: "border-t-rose-500",
          shadow: "shadow-rose-500/5 dark:shadow-rose-500/5 hover:shadow-rose-500/10 hover:border-rose-500/30",
          badgeBg: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455",
          badgeText: "Queue",
        };
      case "preparing":
        return {
          border: "border-t-amber-500",
          shadow: "shadow-amber-500/5 dark:shadow-amber-500/5 hover:shadow-amber-500/10 hover:border-amber-500/30",
          badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-455",
          badgeText: "Cooking",
        };
      case "completed":
        return {
          border: "border-t-emerald-500",
          shadow: "shadow-emerald-500/5 dark:shadow-emerald-500/5 hover:shadow-emerald-500/10 hover:border-emerald-500/30",
          badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-606 dark:text-emerald-455",
          badgeText: "Ready",
        };
      default:
        return {
          border: "border-t-stone-500",
          shadow: "shadow-stone-500/5 dark:shadow-stone-500/5 hover:shadow-stone-500/10 hover:border-stone-500/30",
          badgeBg: "bg-stone-500/10 border-stone-500/20 text-stone-505 dark:text-stone-405",
          badgeText: "Pending",
        };
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-stone-55 dark:bg-stone-955 text-stone-900 dark:text-stone-100 font-sans relative overflow-hidden cafe-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-stone-50/10 dark:from-stone-950/20 via-stone-50/80 dark:via-stone-950/80 to-stone-50/95 dark:to-stone-950/95 pointer-events-none" />

      {/* KDS Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/85 backdrop-blur-md border-b border-stone-200 dark:border-stone-850 px-6 py-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 relative z-10 shadow-sm shrink-0">
        <div className="flex flex-wrap items-center justify-between xl:justify-start gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-750 dark:text-stone-300 border border-stone-200 dark:border-stone-750 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
              title="Go back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <ChefHat className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
                Kitchen Display System
              </h1>
              <p className="text-xs text-stone-555 dark:text-stone-405 font-bold mt-0.5">Realtime Chef Station Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-stone-200/50 dark:bg-stone-955/50 border border-stone-300 dark:border-stone-800 rounded-2xl p-1 px-2.5">
            {socketConnected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-500/25" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-555 dark:text-stone-400">Live Connect</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping border border-amber-500/25" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">Reconnecting…</span>
              </>
            )}
          </div>
        </div>

        {/* Live Load Counters */}
        <div className="grid grid-cols-3 sm:flex items-center gap-3 xl:mx-auto">
          <div className="bg-white dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 flex flex-col sm:flex-row items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-xs text-stone-505 dark:text-stone-400 font-bold">Queue:</span>
            <span className="text-sm font-black text-rose-600 dark:text-rose-455">{toCookCount}</span>
          </div>
          <div className="bg-white dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 flex flex-col sm:flex-row items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs text-stone-505 dark:text-stone-400 font-bold">Prep:</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-455">{preparingCount}</span>
          </div>
          <div className="bg-white dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-2 flex flex-col sm:flex-row items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs text-stone-505 dark:text-stone-400 font-bold">Ready:</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-455">{completedCount}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 max-w-full xl:max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-3.5 my-auto size-4 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket # or product..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm text-stone-900 dark:text-stone-250 placeholder:text-stone-405 dark:placeholder:text-stone-500 transition-all font-semibold"
            />
          </div>
        </div>
      </header>

      {/* Dual Filters Panel */}
      <div className="bg-white/50 dark:bg-stone-900/30 backdrop-blur-sm border-b border-stone-200 dark:border-stone-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 px-6 relative z-10 select-none shrink-0">
        
        {/* Station Filter (Preparation Station) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-stone-550 dark:text-stone-400 text-xs font-bold uppercase tracking-wider shrink-0 mr-1">
            <Filter className="size-3.5 text-primary" />
            <span>Station:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStation("All Stations")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95",
                selectedStation === "All Stations"
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                  : "bg-white dark:bg-stone-955/60 border-stone-200 dark:border-stone-850 text-stone-500 dark:text-stone-405 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-stone-800 dark:hover:text-stone-300"
              )}
            >
              All Stations
            </button>
            {stationsList.map((station) => (
              <button
                key={station}
                onClick={() => setSelectedStation(station)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center gap-2",
                  selectedStation === station
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 shadow-sm"
                    : "bg-white dark:bg-stone-955/60 border-stone-200 dark:border-stone-850/80 text-stone-500 dark:text-stone-405 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-stone-800 dark:hover:text-stone-300"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {station}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Focus Filters */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-405 text-xs font-bold uppercase tracking-wider shrink-0 mr-1">
            <ListChecks className="size-3.5 text-primary" />
            <span>KDS Kanban Column:</span>
          </div>
          <div className="flex bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-850 p-1 rounded-2xl gap-1">
            {[
              { id: "all", label: "Show All Columns", color: "text-stone-700 dark:text-stone-300" },
              { id: "to_cook", label: "Queue ⏳", color: "text-rose-600 dark:text-rose-455" },
              { id: "preparing", label: "Preparing 🍳", color: "text-amber-600 dark:text-amber-455" },
              { id: "completed", label: "Ready 🍽️", color: "text-emerald-600 dark:text-emerald-455" }
            ].map((stage) => (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id as any)}
                className={cn(
                  "px-3.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 border border-transparent",
                  selectedStage === stage.id
                    ? "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm"
                    : cn("text-stone-505 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200", stage.color)
                )}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KANBAN BOARD WRAPPER (Bound within dnd-kit context) */}
      <DndContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <main className={cn(
          "flex-1 p-6 relative z-10 overflow-hidden h-[calc(100vh-140px)] min-h-0",
          selectedStage === "all" ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "block"
        )}>
          
          {/* COLUMN 1: QUEUE / TO COOK */}
          {(selectedStage === "all" || selectedStage === "to_cook") && (
            <DroppableColumn
              id="to_cook"
              title="To Cook / Queue"
              count={toCookTickets.length}
              selectedStage={selectedStage}
            >
              <AnimatePresence mode="popLayout">
                {toCookTickets.map((ticket) => (
                  <DraggableTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    stage="to_cook"
                    tableLabel={getTableLabel(ticket.tableId)}
                    guestName={getCustomerName(ticket.customerId)}
                    elapsedMins={getElapsedTimeMins(ticket.createdAt)}
                    getElapsedTimeLabel={getElapsedTimeLabel}
                    getStageStyles={getStageStyles}
                    toggleKdsItemComplete={toggleKdsItemComplete}
                    advanceTicketStage={advanceTicketStage}
                  />
                ))}
              </AnimatePresence>
              {toCookTickets.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-stone-400 dark:text-stone-605 gap-2.5 border border-dashed border-stone-200 dark:border-stone-850 rounded-2xl">
                  <Inbox className="size-7" />
                  <p className="text-xs font-semibold italic">No tickets in Queue.</p>
                </div>
              )}
            </DroppableColumn>
          )}

          {/* COLUMN 2: PREPARING / COOKING */}
          {(selectedStage === "all" || selectedStage === "preparing") && (
            <DroppableColumn
              id="preparing"
              title="Preparing"
              count={preparingTickets.length}
              selectedStage={selectedStage}
            >
              <AnimatePresence mode="popLayout">
                {preparingTickets.map((ticket) => (
                  <DraggableTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    stage="preparing"
                    tableLabel={getTableLabel(ticket.tableId)}
                    guestName={getCustomerName(ticket.customerId)}
                    elapsedMins={getElapsedTimeMins(ticket.createdAt)}
                    getElapsedTimeLabel={getElapsedTimeLabel}
                    getStageStyles={getStageStyles}
                    toggleKdsItemComplete={toggleKdsItemComplete}
                    advanceTicketStage={advanceTicketStage}
                  />
                ))}
              </AnimatePresence>
              {preparingTickets.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-stone-400 dark:text-stone-605 gap-2.5 border border-dashed border-stone-200 dark:border-stone-850 rounded-2xl">
                  <Utensils className="size-7" />
                  <p className="text-xs font-semibold italic">No tickets in Prep.</p>
                </div>
              )}
            </DroppableColumn>
          )}

          {/* COLUMN 3: COMPLETED / READY */}
          {(selectedStage === "all" || selectedStage === "completed") && (
            <DroppableColumn
              id="completed"
              title="Ready / Completed"
              count={completedTickets.length}
              selectedStage={selectedStage}
            >
              <AnimatePresence mode="popLayout">
                {completedTickets.map((ticket) => (
                  <DraggableTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    stage="completed"
                    tableLabel={getTableLabel(ticket.tableId)}
                    guestName={getCustomerName(ticket.customerId)}
                    elapsedMins={getElapsedTimeMins(ticket.createdAt)}
                    getElapsedTimeLabel={getElapsedTimeLabel}
                    getStageStyles={getStageStyles}
                    toggleKdsItemComplete={toggleKdsItemComplete}
                    advanceTicketStage={advanceTicketStage}
                  />
                ))}
              </AnimatePresence>
              {completedTickets.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-stone-400 dark:text-stone-605 gap-2.5 border border-dashed border-stone-200 dark:border-stone-850 rounded-2xl">
                  <CheckCircle2 className="size-7" />
                  <p className="text-xs font-semibold italic">No ready tickets.</p>
                </div>
              )}
            </DroppableColumn>
          )}
        </main>

        <DragOverlay adjustScale={false}>
          {activeId ? (() => {
            const ticket = orders.find((o) => o.id === activeId);
            if (!ticket) return null;
            const stage = getTicketStage(ticket);
            return (
              <TicketCard
                ticket={ticket}
                stage={stage}
                tableLabel={getTableLabel(ticket.tableId)}
                guestName={getCustomerName(ticket.customerId)}
                elapsedMins={getElapsedTimeMins(ticket.createdAt)}
                getElapsedTimeLabel={getElapsedTimeLabel}
                getStageStyles={getStageStyles}
                toggleKdsItemComplete={toggleKdsItemComplete}
                advanceTicketStage={advanceTicketStage}
                isOverlay
              />
            );
          })() : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

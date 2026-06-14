"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
  RefreshCcw,
  FlaskConical,
  TrendingDown,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp, Ingredient } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DialogModal } from "@/components/ui/dialog-modal";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStockStatus(ingredient: Ingredient): "ok" | "low" | "critical" {
  if (ingredient.quantity <= 0) return "critical";
  if (ingredient.quantity < ingredient.minThreshold) return "low";
  return "ok";
}

function StockBar({ ingredient }: { ingredient: Ingredient }) {
  const pct =
    ingredient.minThreshold > 0
      ? Math.min(100, (ingredient.quantity / (ingredient.minThreshold * 3)) * 100)
      : 100;
  const status = getStockStatus(ingredient);
  const barColor =
    status === "critical"
      ? "bg-red-500"
      : status === "low"
      ? "bg-amber-500"
      : "bg-emerald-500";
  const trackColor = "bg-stone-200 dark:bg-stone-700";

  return (
    <div className={`h-1.5 w-full rounded-full ${trackColor} overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`h-full rounded-full ${barColor}`}
      />
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalMode = "create" | "edit" | "restock";

interface IngredientModalProps {
  mode: ModalMode;
  ingredient?: Ingredient;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function IngredientModal({ mode, ingredient, isOpen, onClose, onSave }: IngredientModalProps) {
  const [form, setForm] = useState({
    name: ingredient?.name ?? "",
    quantity: ingredient?.quantity ?? 0,
    unit: ingredient?.unit ?? "g",
    minThreshold: ingredient?.minThreshold ?? 0,
    restockAmount: 0,
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setForm({
        name: ingredient?.name ?? "",
        quantity: ingredient?.quantity ?? 0,
        unit: ingredient?.unit ?? "g",
        minThreshold: ingredient?.minThreshold ?? 0,
        restockAmount: 0,
      });
    }
  }, [isOpen, ingredient]);

  const title =
    mode === "create" ? "Add Ingredient" :
    mode === "edit" ? "Edit Ingredient" :
    "Restock Ingredient";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "restock") {
        await onSave({ quantity: (ingredient?.quantity ?? 0) + form.restockAmount });
      } else if (mode === "edit") {
        await onSave({ name: form.name, unit: form.unit, minThreshold: form.minThreshold, quantity: form.quantity });
      } else {
        await onSave({ name: form.name, quantity: form.quantity, unit: form.unit, minThreshold: form.minThreshold });
      }
      onClose();
    } catch {
      // error handled in parent
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-400 text-sm";
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={
        mode === "restock"
          ? `Add stock to "${ingredient?.name}". Current quantity: ${ingredient?.quantity} ${ingredient?.unit}`
          : mode === "edit"
          ? "Update the ingredient details below."
          : "Add a new raw ingredient to track inventory."
      }
      icon={<FlaskConical className="size-5" />}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "restock" ? (
          <div>
            <label className={labelCls}>
              Restock Amount ({ingredient?.unit})
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.restockAmount || ""}
              onChange={(e) => setForm({ ...form, restockAmount: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              placeholder="Enter quantity to add..."
              autoFocus
              required
            />
          </div>
        ) : (
          <>
            <div>
              <label className={labelCls}>Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. Espresso Beans"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.quantity || ""}
                  onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Unit <span className="text-red-500">*</span></label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className={inputCls}
                >
                  {["g", "kg", "ml", "L", "pcs", "oz", "tbsp", "tsp", "cups"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Low Stock Threshold ({form.unit})</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.minThreshold || ""}
                onChange={(e) => setForm({ ...form, minThreshold: parseFloat(e.target.value) || 0 })}
                className={inputCls}
                placeholder="Alert when stock falls below..."
              />
              <p className="text-xs text-stone-400 mt-1">System alerts manager when stock drops below this level</p>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "restock" ? "Restock" : mode === "edit" ? "Save Changes" : "Add Ingredient"}
          </button>
        </div>
      </form>
    </DialogModal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { ingredients, createIngredient, updateIngredient, deleteIngredient, fetchIngredients } = useApp();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "critical">("all");
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filtered = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch = ing.name.toLowerCase().includes(search.toLowerCase());
      const status = getStockStatus(ing);
      const matchesFilter =
        filter === "all" ? true :
        filter === "critical" ? status === "critical" :
        status === "low" || status === "critical";
      return matchesSearch && matchesFilter;
    });
  }, [ingredients, search, filter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedIngredients = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [search, filter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filtered.length, totalPages, currentPage]);

  const stats = useMemo(() => ({
    total:    ingredients.length,
    okCount:  ingredients.filter((i) => getStockStatus(i) === "ok").length,
    lowCount: ingredients.filter((i) => getStockStatus(i) === "low").length,
    criticalCount: ingredients.filter((i) => getStockStatus(i) === "critical").length,
  }), [ingredients]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIngredients();
    setRefreshing(false);
  };

  const openCreate = () => { setSelectedIngredient(undefined); setModalMode("create"); setModalOpen(true); };
  const openEdit = (ing: Ingredient) => { setSelectedIngredient(ing); setModalMode("edit"); setModalOpen(true); };
  const openRestock = (ing: Ingredient) => { setSelectedIngredient(ing); setModalMode("restock"); setModalOpen(true); };

  const handleSave = async (data: any) => {
    if (modalMode === "create") {
      await createIngredient(data);
      success("Ingredient Added", `${data.name} has been added to inventory.`);
    } else if (modalMode === "edit" && selectedIngredient) {
      await updateIngredient(selectedIngredient.id, data);
      success("Updated", `${selectedIngredient.name} has been updated.`);
    } else if (modalMode === "restock" && selectedIngredient) {
      await updateIngredient(selectedIngredient.id, data);
      success("Restocked!", `${selectedIngredient.name} has been restocked.`);
    }
  };

  const handleDelete = async (ing: Ingredient) => {
    const confirmed = await confirm({
      title: "Delete Ingredient?",
      message: `This will permanently remove "${ing.name}" from inventory and all linked recipes.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteIngredient(ing.id);
      success("Deleted", `${ing.name} removed from inventory.`);
    } catch {
      toastError("Failed to delete", "Could not remove ingredient. Please try again.");
    }
  };

  const STAT_CARDS = [
    { label: "Total Ingredients", value: stats.total,        icon: Package,      colorClass: "text-primary",      bgClass: "bg-primary/10 dark:bg-primary/15",      borderClass: "border-primary/20" },
    { label: "Healthy Stock",     value: stats.okCount,      icon: CheckCircle2, colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/20" },
    { label: "Low Stock",         value: stats.lowCount,     icon: TrendingDown, colorClass: "text-amber-600 dark:text-amber-400",   bgClass: "bg-amber-500/10",   borderClass: "border-amber-500/20"   },
    { label: "Critical / Empty",  value: stats.criticalCount,icon: AlertTriangle, colorClass: "text-red-600 dark:text-red-400",       bgClass: "bg-red-500/10",     borderClass: "border-red-500/20"     },
  ];

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: "all",      label: "All Items",  count: stats.total },
    { key: "low",      label: "Low Stock",  count: stats.lowCount },
    { key: "critical", label: "Critical",   count: stats.criticalCount },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-sm text-stone-800 dark:text-stone-200">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Ingredient Inventory
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm md:text-base">
            Track raw material stock levels, thresholds and restock history.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            <RefreshCcw className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="size-4" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl border ${card.borderClass} ${card.bgClass} p-4 flex items-center gap-3`}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${card.borderClass} ${card.bgClass}`}>
              <card.icon className={`size-5 ${card.colorClass}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-stone-800 dark:text-stone-100">{card.value}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-400 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all border whitespace-nowrap",
                filter === f.key
                  ? f.key === "critical"
                    ? "bg-red-500 border-red-500 text-white shadow"
                    : f.key === "low"
                    ? "bg-amber-500 border-amber-500 text-white shadow"
                    : "bg-primary border-primary text-white shadow"
                  : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              )}
            >
              {f.label}
              {f.count > 0 && <span className="ml-1.5 opacity-70">({f.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ingredient Grid ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 flex items-center justify-center mb-4">
            <FlaskConical className="size-8 text-stone-400" />
          </div>
          <p className="text-stone-500 dark:text-stone-400 font-semibold">No ingredients found</p>
          <p className="text-xs text-stone-400 mt-1">
            {search ? "Try a different search term" : "Add your first ingredient to get started"}
          </p>
          {!search && (
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all"
            >
              <Plus className="size-4" /> Add Ingredient
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {paginatedIngredients.map((ing, i) => {
                const status = getStockStatus(ing);
                const isLow = status === "low";
                const isCritical = status === "critical";
                const isWarning = isLow || isCritical;

                return (
                  <motion.div
                    key={ing.id}
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "relative rounded-2xl border p-4 flex flex-col gap-3 group bg-white dark:bg-stone-900 transition-all hover:shadow-md",
                      isCritical ? "border-red-300 dark:border-red-800/60" :
                      isLow ? "border-amber-300 dark:border-amber-800/60" :
                      "border-stone-200 dark:border-stone-800 hover:border-primary/30"
                    )}
                  >
                    {/* Pulsing indicator */}
                    {isWarning && (
                      <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", isCritical ? "bg-red-500" : "bg-amber-500")} />
                        <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isCritical ? "bg-red-500" : "bg-amber-500")} />
                      </span>
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-xl border",
                      isCritical ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" :
                      isLow ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" :
                      "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                    )}>
                      <FlaskConical className={cn("size-5", isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-primary")} />
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm leading-tight">{ing.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={cn("text-2xl font-black", isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-stone-800 dark:text-stone-100")}>
                          {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(1)}
                        </span>
                        <span className="text-sm text-stone-400">{ing.unit}</span>
                      </div>
                    </div>

                    {/* Stock bar */}
                    <StockBar ingredient={ing} />

                    {/* Status + threshold */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("flex items-center gap-1 font-bold", isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400")}>
                        {isCritical ? <><AlertTriangle className="size-3" />Critical</> :
                         isLow ?     <><TrendingDown className="size-3" />Low Stock</> :
                                     <><CheckCircle2 className="size-3" />Healthy</>}
                      </span>
                      <span className="text-stone-400">min: {ing.minThreshold}{ing.unit}</span>
                    </div>

                    {/* Action row — revealed on hover */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => openRestock(ing)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all"
                      >
                        <Plus className="size-3" /> Restock
                      </button>
                      <button
                        onClick={() => openEdit(ing)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs transition-all"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(ing)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 text-xs transition-all"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {filtered.length > 20 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900/40">
              <span className="text-xs text-stone-500 font-medium">
                Showing <span className="font-bold text-stone-800 dark:text-stone-200">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}</span> of <span className="font-bold text-stone-800 dark:text-stone-200">{filtered.length}</span> ingredients
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-40 transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  if (totalPages > 5) {
                    if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                      if (pageNum === 2 && currentPage > 3) return <span key="ellipsis-left" className="px-2 text-stone-400">...</span>;
                      if (pageNum === totalPages - 1 && currentPage < totalPages - 2) return <span key="ellipsis-right" className="px-2 text-stone-400">...</span>;
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
                  className="p-2 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-40 transition-all cursor-pointer active:scale-95"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      <IngredientModal
        mode={modalMode}
        ingredient={selectedIngredient}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedIngredient(undefined); }}
        onSave={handleSave}
      />
    </div>
  );
}

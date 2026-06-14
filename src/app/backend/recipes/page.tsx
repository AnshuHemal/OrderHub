"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChefHat,
  Search,
  Plus,
  Trash2,
  FlaskConical,
  UtensilsCrossed,
  Loader2,
  CheckCircle2,
  ChevronRight,
  X,
  Save,
  BookOpen,
} from "lucide-react";
import { useApp, Product, Ingredient, RecipeIngredient } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipeRow {
  ingredientId: string;
  quantityRequired: number;
}

// ─── Ingredient Row Component ─────────────────────────────────────────────────

function RecipeIngredientRow({
  row,
  ingredients,
  onChange,
  onRemove,
}: {
  row: RecipeRow;
  ingredients: Ingredient[];
  onChange: (updated: RecipeRow) => void;
  onRemove: () => void;
}) {
  const selectedIng = ingredients.find((i) => i.id === row.ingredientId);
  const inputCls = "px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-center gap-3"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
        <FlaskConical className="size-3.5 text-primary" />
      </div>

      {/* Ingredient selector */}
      <select
        value={row.ingredientId}
        onChange={(e) => onChange({ ...row, ingredientId: e.target.value })}
        className={cn(inputCls, "flex-1 min-w-0")}
      >
        <option value="">Select ingredient…</option>
        {ingredients.map((ing) => (
          <option key={ing.id} value={ing.id}>
            {ing.name} ({ing.unit})
          </option>
        ))}
      </select>

      {/* Quantity */}
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min={0.01}
          step="0.01"
          value={row.quantityRequired || ""}
          onChange={(e) => onChange({ ...row, quantityRequired: parseFloat(e.target.value) || 0 })}
          className={cn(inputCls, "w-20 text-center")}
          placeholder="Qty"
        />
        <span className="text-xs text-stone-400 w-7 truncate">{selectedIng?.unit || ""}</span>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="flex items-center justify-center w-7 h-7 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-all shrink-0"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const { products, ingredients, fetchRecipeForMenuItem, updateRecipe } = useApp();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Filtered product list
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) => p.isActive && p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  // Load recipe when selected product changes
  useEffect(() => {
    if (!selectedProduct) { setRecipeRows([]); return; }
    setLoadingRecipe(true);
    setIsDirty(false);
    fetchRecipeForMenuItem(selectedProduct.id).then((data) => {
      setRecipeRows(data.map((r) => ({ ingredientId: r.ingredientId, quantityRequired: r.quantityRequired })));
      setLoadingRecipe(false);
    });
  }, [selectedProduct?.id]);

  const addRow = () => {
    setRecipeRows((prev) => [...prev, { ingredientId: "", quantityRequired: 0 }]);
    setIsDirty(true);
  };

  const updateRow = (i: number, updated: RecipeRow) => {
    setRecipeRows((prev) => prev.map((r, idx) => (idx === i ? updated : r)));
    setIsDirty(true);
  };

  const removeRow = (i: number) => {
    setRecipeRows((prev) => prev.filter((_, idx) => idx !== i));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    const validRows = recipeRows.filter((r) => r.ingredientId && r.quantityRequired > 0);
    setSaving(true);
    try {
      await updateRecipe(selectedProduct.id, validRows);
      setIsDirty(false);
      success("Recipe Saved", `Recipe for "${selectedProduct.name}" updated successfully.`);
    } catch {
      toastError("Save Failed", "Could not save recipe. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!selectedProduct) return;
    setLoadingRecipe(true);
    setIsDirty(false);
    fetchRecipeForMenuItem(selectedProduct.id).then((data) => {
      setRecipeRows(data.map((r) => ({ ingredientId: r.ingredientId, quantityRequired: r.quantityRequired })));
      setLoadingRecipe(false);
    });
  };

  const validRows = recipeRows.filter((r) => r.ingredientId && r.quantityRequired > 0);

  return (
    <div className="animate-fade-in text-sm text-stone-800 dark:text-stone-200">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5 mb-6">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Recipe Manager
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm md:text-base">
            Map menu items to their raw ingredient requirements for automatic inventory deduction.
          </p>
        </div>
      </div>

      {/* ── Split Layout ── */}
      <div className="flex gap-6 min-h-[600px]">

        {/* LEFT: Product list */}
        <div className="w-64 shrink-0 flex flex-col">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items…"
                className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-400 text-sm"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-stone-100 dark:border-stone-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                {filteredProducts.length} Items
              </p>
            </div>
            <div className="overflow-y-auto max-h-[520px] py-1.5 px-1.5 space-y-0.5">
              {filteredProducts.length === 0 && (
                <div className="py-10 text-center text-stone-400 text-xs">No products found</div>
              )}
              <AnimatePresence>
                {filteredProducts.map((product, i) => {
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedProduct(product)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all",
                        isSelected
                          ? "bg-primary text-white shadow-sm"
                          : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UtensilsCrossed className={cn("size-3.5 shrink-0", isSelected ? "text-white" : "text-stone-400")} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{product.name}</p>
                          <p className={cn("text-[10px] truncate", isSelected ? "text-white/70" : "text-stone-400")}>
                            ₹{product.price}
                          </p>
                        </div>
                      </div>
                      {isSelected && <ChevronRight className="size-3.5 text-white shrink-0" />}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: Recipe editor */}
        <div className="flex-1 min-w-0">
          {!selectedProduct ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-dashed rounded-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                <ChefHat className="size-8 text-stone-400" />
              </div>
              <p className="font-bold text-stone-500 dark:text-stone-400">Select a menu item</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Choose a product from the list on the left to configure its ingredient requirements
              </p>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden flex flex-col">

              {/* Editor header */}
              <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-stone-800 dark:text-stone-100">{selectedProduct.name}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    ₹{selectedProduct.price} · Configure ingredient requirements per serving
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isDirty ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={handleDiscard}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all disabled:opacity-50 shadow"
                      >
                        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                        Save Recipe
                      </button>
                    </motion.div>
                  ) : recipeRows.length > 0 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Saved
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5 flex-1">
                {loadingRecipe ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Column headers */}
                    {recipeRows.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-7" />
                        <p className="flex-1 text-[10px] font-black uppercase tracking-widest text-stone-400">Ingredient</p>
                        <p className="w-20 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">Quantity</p>
                        <div className="w-7" />
                      </div>
                    )}

                    {/* Ingredient rows */}
                    {recipeRows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-stone-200 dark:border-stone-700 rounded-2xl">
                        <BookOpen className="size-8 text-stone-300 dark:text-stone-600 mb-3" />
                        <p className="text-stone-500 dark:text-stone-400 text-sm font-bold">No ingredients defined</p>
                        <p className="text-xs text-stone-400 mt-1">
                          Click "Add Ingredient" below to define this item's recipe
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <AnimatePresence>
                          {recipeRows.map((row, i) => (
                            <RecipeIngredientRow
                              key={i}
                              row={row}
                              ingredients={ingredients}
                              onChange={(updated) => updateRow(i, updated)}
                              onRemove={() => removeRow(i)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Add ingredient button */}
                    <button
                      onClick={addRow}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 hover:border-primary/50 hover:bg-primary/5 text-stone-500 dark:text-stone-400 hover:text-primary text-sm font-bold transition-all"
                    >
                      <Plus className="size-4" /> Add Ingredient
                    </button>

                    {/* Recipe summary preview */}
                    {validRows.length > 0 && (
                      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">
                          Recipe Summary — per 1 serving
                        </p>
                        <div className="space-y-2">
                          {validRows.map((row, i) => {
                            const ing = ingredients.find((x) => x.id === row.ingredientId);
                            if (!ing) return null;
                            return (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FlaskConical className="size-3.5 text-primary shrink-0" />
                                  <span className="text-stone-700 dark:text-stone-300 font-semibold">{ing.name}</span>
                                </div>
                                <span className="text-stone-400 font-mono text-xs">{row.quantityRequired} {ing.unit}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                          <p className="text-xs text-stone-400">
                            Each settled order containing <strong className="text-stone-500">{selectedProduct.name}</strong> will automatically deduct the above quantities from inventory.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sticky save footer — shown only when dirty */}
              <AnimatePresence>
                {isDirty && (
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-amber-50 dark:bg-amber-500/5 flex items-center justify-between gap-4"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved changes
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={handleDiscard} className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all">
                        Discard
                      </button>
                      <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all disabled:opacity-50 shadow">
                        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                        Save Recipe
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

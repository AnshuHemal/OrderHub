"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Coffee, Plus, AlertCircle } from "lucide-react";
import { Product, ModifierGroup, ModifierOption } from "@/app/context/AppContext";

interface ModifierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (selectedOptions: ModifierOption[], notes: string) => void;
}

export function ModifierDialog({ isOpen, onClose, product, onConfirm }: ModifierDialogProps) {
  const [selections, setSelections] = useState<Record<string, ModifierOption[]>>({});
  const [notes, setNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      const initialSelections: Record<string, ModifierOption[]> = {};
      
      product.modifierGroups?.forEach((group) => {
        // If single select and minSelection is 1, auto-select the first option by default
        if (group.minSelection === 1 && group.maxSelection === 1 && group.options.length > 0) {
          initialSelections[group.id] = [group.options[0]];
        } else {
          initialSelections[group.id] = [];
        }
      });
      
      setSelections(initialSelections);
      setNotes("");
      setValidationErrors({});
    }
  }, [product]);

  if (!product || !isOpen) return null;

  const handleToggleOption = (group: ModifierGroup, option: ModifierOption) => {
    const currentGroupSelections = selections[group.id] || [];
    const isAlreadySelected = currentGroupSelections.some((o) => o.id === option.id);

    let nextSelections = [...currentGroupSelections];

    if (group.maxSelection === 1) {
      // Radio/Single-select behavior
      if (isAlreadySelected && group.minSelection === 0) {
        // Allow unchecking if not required
        nextSelections = [];
      } else {
        nextSelections = [option];
      }
    } else {
      // Checkbox/Multi-select behavior
      if (isAlreadySelected) {
        nextSelections = nextSelections.filter((o) => o.id !== option.id);
      } else {
        if (nextSelections.length < group.maxSelection) {
          nextSelections.push(option);
        }
      }
    }

    setSelections((prev) => ({
      ...prev,
      [group.id]: nextSelections,
    }));

    // Clear validation error on change
    if (nextSelections.length >= group.minSelection) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[group.id];
        return copy;
      });
    }
  };

  const handleConfirm = () => {
    // Validate selections
    const errors: Record<string, string> = {};
    product.modifierGroups?.forEach((group) => {
      const count = (selections[group.id] || []).length;
      if (count < group.minSelection) {
        errors[group.id] = `Please select at least ${group.minSelection} option(s).`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Flatten selections
    const allSelectedOptions = Object.values(selections).flat();
    onConfirm(allSelectedOptions, notes);
    onClose();
  };

  const calculateTotalPrice = () => {
    const basePrice = product.price;
    const extraPrice = Object.values(selections)
      .flat()
      .reduce((sum, opt) => sum + (opt.priceAdjustment || 0), 0);
    return basePrice + extraPrice;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
        />

        {/* Dialog Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-sans"
        >
          {/* Header Banner */}
          <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Coffee className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-stone-900 dark:text-stone-100 text-lg leading-tight">
                  Customize Item
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-bold mt-0.5">
                  {product.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable Modifier Options */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {product.modifierGroups && product.modifierGroups.length > 0 ? (
              product.modifierGroups.map((group) => {
                const groupSelections = selections[group.id] || [];
                const error = validationErrors[group.id];

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-stone-800 dark:text-stone-200">
                          {group.name}
                        </h4>
                        {group.minSelection > 0 && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            Required
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 dark:text-stone-500 font-semibold">
                        {group.maxSelection === 1 
                          ? "Select 1 option" 
                          : `Select up to ${group.maxSelection}`}
                      </span>
                    </div>

                    {/* Group selection warning */}
                    {error && (
                      <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Option Selection Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {group.options.map((option) => {
                        const isSelected = groupSelections.some((o) => o.id === option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleToggleOption(group, option)}
                            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-1 transition-all active:scale-[0.98] relative overflow-hidden group ${
                              isSelected
                                ? "bg-primary/5 border-primary text-primary dark:bg-primary/10 shadow-sm"
                                : "bg-stone-50 hover:bg-stone-100/75 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-xs max-w-[120px] truncate leading-snug group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
                                {option.name}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white shrink-0 scale-90">
                                  <Check className="size-2.5" />
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono font-black mt-2">
                              {option.priceAdjustment > 0 
                                ? `+₹${option.priceAdjustment.toFixed(0)}` 
                                : "Free"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-stone-400 italic">
                No modifiers configured for this item.
              </div>
            )}

            {/* Preparation Notes Field */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-extrabold text-stone-800 dark:text-stone-200">
                Special Preparation Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Extra hot, No whip, double cup, etc."
                className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-800 dark:text-stone-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all resize-none h-16"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20 shrink-0 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                Total Item Price
              </p>
              <p className="text-lg font-black text-stone-900 dark:text-white mt-0.5">
                ₹{calculateTotalPrice().toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] text-xs"
            >
              <Plus className="size-4" /> Add to Order
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

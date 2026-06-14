"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Save,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useApp, ModifierGroup, ModifierOption } from "@/app/context/AppContext";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ItemModifiersTabProps {
  productId: string;
}

export default function ItemModifiersTab({ productId }: ItemModifiersTabProps) {
  const { products, fetchMenu } = useApp();
  const { success, error: toastError } = useToast();

  const product = products.find((p) => p.id === productId);
  const modifierGroups = product?.modifierGroups || [];

  // Local state for UI operations
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);

  // New Group form state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMin, setNewGroupMin] = useState(0); // 0 = optional, 1 = required
  const [newGroupMax, setNewGroupMax] = useState(1); // 1 = radio select, >1 = checkbox select

  // Inline edits for groups
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupMin, setEditGroupMin] = useState(0);
  const [editGroupMax, setEditGroupMax] = useState(1);

  // New Option state per group
  const [newOptionNames, setNewOptionNames] = useState<Record<string, string>>({});
  const [newOptionPrices, setNewOptionPrices] = useState<Record<string, string>>({});

  // Inline edits for options
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionName, setEditOptionName] = useState("");
  const [editOptionPrice, setEditOptionPrice] = useState("");

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupIds((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // ─── Group Handlers ─────────────────────────────────────────────────────────

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setAddingGroup(true);
    try {
      await api.post(`/menu/items/${productId}/modifier-groups`, {
        name: newGroupName.trim(),
        minSelection: Number(newGroupMin),
        maxSelection: Number(newGroupMax),
      });

      await fetchMenu();
      setNewGroupName("");
      setNewGroupMin(0);
      setNewGroupMax(1);
      success("Group Added", "Modifier group created successfully.");
    } catch (err: any) {
      console.error(err);
      toastError("Failed to add group", err.message || "An error occurred.");
    } finally {
      setAddingGroup(false);
    }
  };

  const handleStartEditGroup = (group: ModifierGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupMin(group.minSelection);
    setEditGroupMax(group.maxSelection);
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
  };

  const handleSaveGroup = async (groupId: string) => {
    if (!editGroupName.trim()) return;

    setLoadingGroupId(groupId);
    try {
      await api.put(`/menu/modifier-groups/${groupId}`, {
        name: editGroupName.trim(),
        minSelection: Number(editGroupMin),
        maxSelection: Number(editGroupMax),
      });

      await fetchMenu();
      setEditingGroupId(null);
      success("Group Updated", "Modifier group rules updated.");
    } catch (err: any) {
      console.error(err);
      toastError("Update failed", err.message || "An error occurred.");
    } finally {
      setLoadingGroupId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) return;

    setLoadingGroupId(groupId);
    try {
      await api.delete(`/menu/modifier-groups/${groupId}`);
      await fetchMenu();
      success("Group Deleted", `Modifier group "${groupName}" deleted.`);
    } catch (err: any) {
      console.error(err);
      toastError("Delete failed", err.message || "An error occurred.");
    } finally {
      setLoadingGroupId(null);
    }
  };

  // ─── Option Handlers ────────────────────────────────────────────────────────

  const handleCreateOption = async (groupId: string) => {
    const optName = newOptionNames[groupId] || "";
    const optPriceStr = newOptionPrices[groupId] || "0";

    if (!optName.trim()) return;

    setLoadingGroupId(groupId);
    try {
      await api.post(`/menu/modifier-groups/${groupId}/options`, {
        name: optName.trim(),
        priceAdjustment: parseFloat(optPriceStr) || 0,
      });

      await fetchMenu();

      // Reset fields
      setNewOptionNames((prev) => ({ ...prev, [groupId]: "" }));
      setNewOptionPrices((prev) => ({ ...prev, [groupId]: "" }));

      // Ensure group is expanded
      setExpandedGroupIds((prev) => ({ ...prev, [groupId]: true }));

      success("Option Created", `Added option "${optName}"`);
    } catch (err: any) {
      console.error(err);
      toastError("Failed to add option", err.message || "An error occurred.");
    } finally {
      setLoadingGroupId(null);
    }
  };

  const handleStartEditOption = (option: ModifierOption) => {
    setEditingOptionId(option.id);
    setEditOptionName(option.name);
    setEditOptionPrice(String(option.priceAdjustment));
  };

  const handleSaveOption = async (optionId: string, groupId: string) => {
    if (!editOptionName.trim()) return;

    setLoadingGroupId(groupId);
    try {
      await api.put(`/menu/modifier-options/${optionId}`, {
        name: editOptionName.trim(),
        priceAdjustment: parseFloat(editOptionPrice) || 0,
      });

      await fetchMenu();
      setEditingOptionId(null);
      success("Option Updated", "Modifier option saved.");
    } catch (err: any) {
      console.error(err);
      toastError("Failed to save option", err.message || "An error occurred.");
    } finally {
      setLoadingGroupId(null);
    }
  };

  const handleDeleteOption = async (optionId: string, optionName: string, groupId: string) => {
    setLoadingGroupId(groupId);
    try {
      await api.delete(`/menu/modifier-options/${optionId}`);
      await fetchMenu();
      success("Option Deleted", `Option "${optionName}" deleted.`);
    } catch (err: any) {
      console.error(err);
      toastError("Delete failed", err.message || "An error occurred.");
    } finally {
      setLoadingGroupId(null);
    }
  };

  const inputCls =
    "px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-sm placeholder:text-stone-400";
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1 text-xs";

  return (
    <div className="space-y-6 text-sm text-stone-800 dark:text-stone-200">
      {/* ─── Create Group Panel ─── */}
      <form
        onSubmit={handleCreateGroup}
        className="p-5 bg-stone-50 dark:bg-stone-950/40 border border-stone-200/60 dark:border-stone-850 rounded-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-stone-200/50 dark:border-stone-850 pb-2">
          <h4 className="font-extrabold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
            <Plus className="size-4 text-primary" />
            Add Modifier Group
          </h4>
          <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">
            Define choices (e.g. Size, Milk Type)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Group Name</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Size or Milk Choice"
              className={cn(inputCls, "w-full")}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Choice Selection Rule</label>
            <select
              value={`${newGroupMin}-${newGroupMax}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split("-").map(Number);
                setNewGroupMin(min);
                setNewGroupMax(max);
              }}
              className={cn(inputCls, "w-full")}
            >
              <option value="0-1">Single Select, Optional (Radio)</option>
              <option value="1-1">Single Select, Required (Radio)</option>
              <option value="0-10">Multi-select, Optional (Checkbox)</option>
              <option value="1-10">Multi-select, Required (Checkbox)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={addingGroup}
              className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95 disabled:opacity-50 h-[38px] text-sm"
            >
              {addingGroup ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create Group
            </button>
          </div>
        </div>
      </form>

      {/* ─── Modifier Groups List ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
            Current Modifier Groups ({modifierGroups.length})
          </p>
        </div>

        {modifierGroups.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-stone-400 italic">
            No customization modifiers configured yet. Add a group above.
          </div>
        ) : (
          <div className="space-y-3">
            {modifierGroups.map((group) => {
              const isExpanded = expandedGroupIds[group.id] ?? false;
              const isEditing = editingGroupId === group.id;
              const isLoading = loadingGroupId === group.id;

              return (
                <motion.div
                  key={group.id}
                  layout="position"
                  className={cn(
                    "bg-white dark:bg-stone-900 border rounded-2xl overflow-hidden transition-all shadow-sm",
                    isExpanded
                      ? "border-stone-300 dark:border-stone-750"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-750"
                  )}
                >
                  {/* Group Header */}
                  <div
                    onClick={() => !isEditing && toggleGroupExpand(group.id)}
                    className={cn(
                      "px-5 py-4 flex items-center justify-between gap-4 select-none",
                      isEditing ? "cursor-default" : "cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editGroupName}
                            onChange={(e) => setEditGroupName(e.target.value)}
                            className={cn(inputCls, "w-full font-bold")}
                            required
                          />
                          <select
                            value={`${editGroupMin}-${editGroupMax}`}
                            onChange={(e) => {
                              const [min, max] = e.target.value.split("-").map(Number);
                              setEditGroupMin(min);
                              setEditGroupMax(max);
                            }}
                            className={cn(inputCls, "w-full")}
                          >
                            <option value="0-1">Single Select, Optional</option>
                            <option value="1-1">Single Select, Required</option>
                            <option value="0-10">Multi-select, Optional</option>
                            <option value="1-10">Multi-select, Required</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <h5 className="font-extrabold text-stone-850 dark:text-white flex items-center gap-2">
                            {group.name}
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                group.minSelection > 0
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                                  : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                              )}
                            >
                              {group.minSelection > 0 ? "Required" : "Optional"}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {group.maxSelection === 1 ? "Single Choice" : "Multi Choice"}
                            </span>
                          </h5>
                          <p className="text-xs text-stone-400 mt-1">
                            Contains {group.options?.length || 0} customization options
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin text-stone-400" />
                      ) : isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSaveGroup(group.id)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow"
                            title="Save Group"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEditGroup}
                            className="px-2.5 py-1 border border-stone-200 dark:border-stone-800 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditGroup(group)}
                            className="px-2.5 py-1 text-xs border border-stone-200 dark:border-stone-800 rounded-lg font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            Edit Rule
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="p-1.5 border border-transparent text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Group"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <div className="text-stone-400 pl-1">
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options List (Expanded Panel) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="border-t border-stone-100 dark:border-stone-850"
                      >
                        <div className="p-5 bg-stone-50/50 dark:bg-stone-950/20 space-y-4">
                          {/* Option Column Headers */}
                          {group.options?.length > 0 && (
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
                              <span className="flex-1">Option Display Name</span>
                              <span className="w-32">Price Adjust (+₹)</span>
                              <span className="w-16"></span>
                            </div>
                          )}

                          {/* Options Rows */}
                          <div className="space-y-2">
                            {group.options?.map((opt) => {
                              const isOptEditing = editingOptionId === opt.id;

                              return (
                                <motion.div
                                  key={opt.id}
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800/80 p-2.5 rounded-xl shadow-xs"
                                >
                                  {isOptEditing ? (
                                    <>
                                      <input
                                        type="text"
                                        value={editOptionName}
                                        onChange={(e) => setEditOptionName(e.target.value)}
                                        className={cn(inputCls, "flex-1")}
                                        required
                                      />
                                      <div className="w-32 relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                                          ₹
                                        </span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={editOptionPrice}
                                          onChange={(e) => setEditOptionPrice(e.target.value)}
                                          className={cn(inputCls, "w-full pl-6")}
                                        />
                                      </div>
                                      <div className="w-16 flex justify-end gap-1.5 shrink-0">
                                        <button
                                          onClick={() => handleSaveOption(opt.id, group.id)}
                                          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow"
                                          title="Save Option"
                                        >
                                          <Check className="size-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setEditingOptionId(null)}
                                          className="p-1.5 border border-stone-200 dark:border-stone-850 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                                          title="Cancel"
                                        >
                                          <HelpCircle className="size-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span className="flex-1 font-semibold text-stone-700 dark:text-stone-300">
                                        {opt.name}
                                      </span>
                                      <span className="w-32 font-mono text-sm text-stone-600 dark:text-stone-400">
                                        {opt.priceAdjustment > 0
                                          ? `+₹${opt.priceAdjustment.toFixed(2)}`
                                          : opt.priceAdjustment < 0
                                          ? `-₹${Math.abs(opt.priceAdjustment).toFixed(2)}`
                                          : "₹0.00 (Free)"}
                                      </span>
                                      <div className="w-16 flex justify-end gap-1 shrink-0">
                                        <button
                                          onClick={() => handleStartEditOption(opt)}
                                          className="px-2 py-1 border border-stone-150 dark:border-stone-800 text-[10px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteOption(opt.id, opt.name, group.id)}
                                          className="p-1 border border-transparent text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              );
                            })}

                            {(!group.options || group.options.length === 0) && (
                              <div className="text-center py-6 text-stone-400 italic text-xs">
                                No options added to this group yet. Add options below.
                              </div>
                            )}
                          </div>

                          {/* Quick Create Option Row */}
                          <div className="flex items-center gap-3 pt-3 border-t border-dashed border-stone-200 dark:border-stone-800">
                            <input
                              type="text"
                              value={newOptionNames[group.id] || ""}
                              onChange={(e) =>
                                setNewOptionNames((prev) => ({ ...prev, [group.id]: e.target.value }))
                              }
                              placeholder="New option name (e.g. Extra Cheese)"
                              className={cn(inputCls, "flex-1")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCreateOption(group.id);
                                }
                              }}
                            />
                            <div className="w-32 relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={newOptionPrices[group.id] || ""}
                                onChange={(e) =>
                                  setNewOptionPrices((prev) => ({ ...prev, [group.id]: e.target.value }))
                                }
                                className={cn(inputCls, "w-full pl-6")}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCreateOption(group.id);
                                  }
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCreateOption(group.id)}
                              className="px-4 py-2 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                            >
                              <Plus className="size-3.5" /> Add Option
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

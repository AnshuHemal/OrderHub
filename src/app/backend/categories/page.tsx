"use client";

import React, { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { DialogModal } from "@/components/ui/dialog-modal";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function CategoriesPage() {
  const { categories, createCategory, updateCategory, deleteCategory } = useApp();
  const confirm = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#6366f1");
  const [catStation, setCatStation] = useState("General Kitchen");

  const openNewModal = () => {
    setEditingCatId(null);
    setCatName(""); setCatColor("#6366f1"); setCatStation("General Kitchen");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCatId(cat.id);
    setCatName(cat.name); setCatColor(cat.color); setCatStation(cat.preparationStation || "General Kitchen");
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingCatId(null); };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    if (editingCatId !== null) {
      updateCategory(editingCatId, { name: catName, color: catColor, preparationStation: catStation });
    } else {
      createCategory({ name: catName, color: catColor, preparationStation: catStation });
    }
    setCatName("");
    closeModal();
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-400";
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  return (
    <div className="space-y-6 animate-fade-in text-sm text-stone-800 dark:text-stone-200">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Product Categories Setup
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm md:text-base">
            Colors assigned below automatically sync across terminals and ticket headers.
          </p>
        </div>
        <button
          id="btn-new-category"
          onClick={openNewModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="size-4" />
          Create Category
        </button>
      </div>

      {/* ── Category Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group relative p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3"
          >
            {/* Color swatch bar */}
            <div
              className="w-full h-2 rounded-full opacity-80"
              style={{ backgroundColor: cat.color }}
            />

            {/* Info */}
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-xl border-2 border-white dark:border-stone-700 shadow-sm shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-base text-stone-850 dark:text-stone-100 truncate">
                  {cat.name}
                </h4>
                <div className="flex flex-col gap-0.5 mt-0.5 text-stone-400 dark:text-stone-500 text-xs">
                  <span className="font-mono uppercase">{cat.color}</span>
                  <span className="font-bold text-primary dark:text-primary-hover">{cat.preparationStation || "General Kitchen"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => openEditModal(cat)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-xl font-bold text-xs transition-colors"
              >
                <Pencil className="size-3" /> Edit
              </button>
              <button
                onClick={async () => {
                  if (await confirm({
                    title: "Delete Category",
                    message: `Are you sure you want to delete the category "${cat.name}"? Products using this category will lose their category assignment.`,
                    confirmLabel: "Delete Category",
                    variant: "danger"
                  })) {
                    deleteCategory(cat.id);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-4 py-16 flex flex-col items-center gap-3 text-stone-400 dark:text-stone-600">
            <Layers className="size-10" />
            <p className="font-semibold italic">No categories created yet.</p>
          </div>
        )}
      </div>

      {/* ── Dialog Modal ── */}
      <DialogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCatId ? "Edit Category" : "Create New Category"}
        description={
          editingCatId
            ? "Update the category name or its assigned color."
            : "Add a product grouping with a unique color identifier."
        }
        icon={<Layers className="size-5" />}
        size="sm"
      >
        <form onSubmit={handleCatSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>
              Category Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Desserts, Specials, Hot Drinks"
              className={inputCls}
              autoFocus
              required
            />
          </div>

          <div>
            <label className={labelCls}>Assigned Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-12 h-12 p-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  placeholder="#6366f1"
                  className={inputCls + " font-mono"}
                />
              </div>
              {/* Live preview */}
              <div
                className="w-12 h-12 rounded-xl border border-stone-200 dark:border-stone-800 shadow-inner"
                style={{ backgroundColor: catColor }}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Preparation Station</label>
            <select
              value={catStation}
              onChange={(e) => setCatStation(e.target.value)}
              className={inputCls}
            >
              <option value="General Kitchen">General Kitchen</option>
              <option value="Barista Station">Barista Station</option>
              <option value="Hot Kitchen">Hot Kitchen</option>
              <option value="Cold Prep">Cold Prep</option>
              <option value="Bakery & Desserts">Bakery & Desserts</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95"
            >
              {editingCatId ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </DialogModal>
    </div>
  );
}

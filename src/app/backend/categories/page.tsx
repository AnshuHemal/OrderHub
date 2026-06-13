"use client";

import React, { useState } from "react";
import { useApp } from "@/app/context/AppContext";

export default function CategoriesPage() {
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useApp();

  // Category CRUD states
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#EF4444");

  // Category Form submit
  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    if (editingCatId !== null) {
      updateCategory(editingCatId, { name: catName, color: catColor });
      setEditingCatId(null);
    } else {
      createCategory({ name: catName, color: catColor });
    }

    setCatName("");
    setShowCatForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Product Categories Setup</h2>
          <p className="text-stone-500 mt-0.5">Colors assigned below automatically sync across terminals and ticket headers.</p>
        </div>
        <button
          onClick={() => {
            setEditingCatId(null);
            setCatName("");
            setCatColor("#EF4444");
            setShowCatForm(true);
          }}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-colors"
        >
          + Create Category
        </button>
      </div>

      {/* Cat form */}
      {showCatForm && (
        <form onSubmit={handleCatSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-sm animate-fade-in">
          <h3 className="font-extrabold text-sm">
            {editingCatId !== null ? "Edit Category Details" : "Create New Product Category"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-stone-400 font-bold mb-1">Category Title</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Desserts, Specials"
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-200"
                required
              />
            </div>
            <div>
              <label className="block text-stone-400 font-bold mb-1">Assigned Color Code</label>
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-full h-10 p-1 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow">
              Save Category
            </button>
            <button
              type="button"
              onClick={() => setShowCatForm(false)}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories table list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: cat.color }}></span>
              <div>
                <h4 className="font-extrabold text-sm">{cat.name}</h4>
                <p className="text-stone-400 text-[10px] uppercase font-mono">{cat.color}</p>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setEditingCatId(cat.id);
                  setCatName(cat.name);
                  setCatColor(cat.color);
                  setShowCatForm(true);
                }}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg font-bold text-[10px] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category ${cat.name}?`)) {
                    deleteCategory(cat.id);
                  }
                }}
                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-danger rounded-lg font-bold text-[10px] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

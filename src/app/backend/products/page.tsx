"use client";

import React, { useState, useEffect } from "react";
import { useApp, Product } from "@/app/context/AppContext";
import { DialogModal } from "@/components/ui/dialog-modal";
import { Package, Plus, Pencil, Trash2, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import ItemModifiersTab from "./_components/ItemModifiersTab";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const {
    categories,
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
  } = useApp();
  const confirm = useConfirm();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [products.length, totalPages, currentPage]);

  // Modal & editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "modifiers">("general");

  // Form fields
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCatId, setProdCatId] = useState("");
  const [prodUom, setProdUom] = useState("per piece");
  const [prodTax, setProdTax] = useState("5.00");
  const [prodDesc, setProdDesc] = useState("");

  // Inline category creation within product form
  const [showInlineCatForm, setShowInlineCatForm] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");
  const [inlineCatColor, setInlineCatColor] = useState("#854d0e");

  // Select default category on load/change
  useEffect(() => {
    if (categories.length > 0 && !prodCatId) {
      setProdCatId(String(categories[0].id));
    }
  }, [categories, prodCatId]);

  const openNewModal = () => {
    setEditingProductId(null);
    setActiveTab("general");
    setProdName(""); setProdPrice(""); setProdDesc("");
    setProdUom("per piece"); setProdTax("5.00");
    setShowInlineCatForm(false); setInlineCatName("");
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setActiveTab("general");
    setProdName(prod.name);
    setProdCatId(prod.categoryId ? prod.categoryId : "");
    setProdPrice(String(prod.price));
    setProdUom(prod.unitOfMeasure);
    setProdTax(String(prod.taxPercentage));
    setProdDesc(prod.description);
    setShowInlineCatForm(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
    setActiveTab("general");
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    const parsedPrice = parseFloat(prodPrice);
    const parsedTax = parseFloat(prodTax);
    const catIdNum = prodCatId || null;

    if (editingProductId !== null) {
      updateProduct(editingProductId, {
        name: prodName, categoryId: catIdNum, price: parsedPrice,
        unitOfMeasure: prodUom, taxPercentage: parsedTax, description: prodDesc,
      });
    } else {
      createProduct({
        name: prodName, categoryId: catIdNum, price: parsedPrice,
        unitOfMeasure: prodUom, taxPercentage: parsedTax, description: prodDesc,
      });
    }

    closeModal();
  };

  const handleInlineCatCreate = () => {
    if (!inlineCatName) return;
    const newCat = createCategory({ name: inlineCatName, color: inlineCatColor });
    setProdCatId(newCat.id);
    setInlineCatName("");
    setShowInlineCatForm(false);
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-400";
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  return (
    <div className="space-y-6 animate-fade-in text-sm text-stone-800 dark:text-stone-200">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            POS Products Directory
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm md:text-base">
            List, configure, or register menu catalog products.
          </p>
        </div>
        <button
          id="btn-new-product"
          onClick={openNewModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="size-4" />
          Register New Product
        </button>
      </div>

      {/* ── Product List Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedProducts.map((prod) => {
          const cat = categories.find((c) => c.id === prod.categoryId);
          return (
            <div
              key={prod.id}
              className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <span
                    className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                    style={{
                      backgroundColor: `${cat?.color || "#E2E8F0"}33`,
                      borderLeft: `3px solid ${cat?.color || "#E2E8F0"}`,
                      color: cat?.color || "#94a3b8",
                    }}
                  >
                    {cat ? cat.name : "No Category"}
                  </span>
                  <span
                    className="font-mono text-stone-400 dark:text-stone-500 text-xs select-all whitespace-nowrap cursor-help hover:text-stone-600 dark:hover:text-stone-350 transition-colors"
                    title={`Full Product ID: ${prod.id}`}
                  >
                    #{prod.id.length > 8 ? prod.id.slice(-8) : prod.id}
                  </span>
                </div>
                <h4 className="font-extrabold text-base md:text-lg text-stone-850 dark:text-white leading-tight">
                  {prod.name}
                </h4>
                <p className="text-stone-500 dark:text-stone-400 text-sm mt-2 leading-relaxed line-clamp-2">
                  {prod.description || "No description provided."}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                <div>
                  <p className="font-black text-lg md:text-xl text-primary">
                    ₹{prod.price.toFixed(2)}
                  </p>
                  <span className="text-xs text-stone-500 dark:text-stone-450 block uppercase tracking-wider mt-0.5">
                    {prod.unitOfMeasure}
                  </span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-xl font-bold text-xs transition-colors"
                  >
                    <Pencil className="size-3" />
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm({
                        title: "Delete Product",
                        message: `Are you sure you want to delete the product "${prod.name}"?`,
                        confirmLabel: "Delete Product",
                        variant: "danger"
                      })) {
                        deleteProduct(prod.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="col-span-3 py-16 flex flex-col items-center gap-3 text-stone-400 dark:text-stone-600">
            <Package className="size-10" />
            <p className="font-semibold italic">No products registered yet.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {products.length > 20 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border border-stone-200 dark:border-stone-800 rounded-3xl bg-white dark:bg-stone-900 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">
            Showing <span className="font-bold text-stone-800 dark:text-stone-200">{Math.min(products.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(products.length, currentPage * itemsPerPage)}</span> of <span className="font-bold text-stone-800 dark:text-stone-200">{products.length}</span> products
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

      {/* ── Dialog Modal ── */}
      <DialogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProductId ? "Edit Product Details" : "Register New Product"}
        description={editingProductId ? "Update the product's name, pricing, category, and customization options." : "Add a new item to your POS menu catalog."}
        icon={<Package className="size-5" />}
        size={editingProductId ? "xl" : "lg"}
      >
        {editingProductId && (
          <div className="flex border-b border-stone-200 dark:border-stone-800 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
                activeTab === "general"
                  ? "border-primary text-primary"
                  : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              General Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("modifiers")}
              className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
                activeTab === "modifiers"
                  ? "border-primary text-primary"
                  : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              Modifiers & Add-ons
            </button>
          </div>
        )}

        {(!editingProductId || activeTab === "general") ? (
          <form onSubmit={handleProductSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className={labelCls}>Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Mocha Latte"
                  className={inputCls}
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className={labelCls}>Unit Price (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="e.g. 4.50"
                  className={inputCls}
                  required
                />
              </div>

              {/* Category */}
              <div className="col-span-1 sm:col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className={labelCls + " mb-0"}>Category Assignment</label>
                  <button
                    type="button"
                    onClick={() => setShowInlineCatForm(!showInlineCatForm)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Tag className="size-3" />
                    {showInlineCatForm ? "Cancel" : "+ Create category inline"}
                  </button>
                </div>

                {!showInlineCatForm ? (
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-3">
                    <p className="font-bold text-xs text-stone-500 uppercase tracking-wider">
                      Quick-create Category
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={inlineCatName}
                          onChange={(e) => setInlineCatName(e.target.value)}
                          placeholder="Category name"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <input
                          type="color"
                          value={inlineCatColor}
                          onChange={(e) => setInlineCatColor(e.target.value)}
                          className="w-full h-[44px] p-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl cursor-pointer"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleInlineCatCreate}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors"
                    >
                      Add & Select
                    </button>
                  </div>
                )}
              </div>

              {/* UoM */}
              <div>
                <label className={labelCls}>Unit of Measure</label>
                <select value={prodUom} onChange={(e) => setProdUom(e.target.value)} className={inputCls}>
                  <option value="per piece">Per Piece</option>
                  <option value="per kg">Per KG</option>
                  <option value="per litre">Per Litre</option>
                </select>
              </div>

              {/* Tax */}
              <div>
                <label className={labelCls}>Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prodTax}
                  onChange={(e) => setProdTax(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div className="col-span-1 sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={3}
                  placeholder="Product description for receipts and menus..."
                  className={inputCls + " resize-none"}
                />
              </div>
            </div>

            {/* Actions */}
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
                {editingProductId ? "Update Product" : "Register Product"}
              </button>
            </div>
          </form>
        ) : (
          <ItemModifiersTab productId={editingProductId} />
        )}
      </DialogModal>
    </div>
  );
}

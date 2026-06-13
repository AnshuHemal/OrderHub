"use client";

import React, { useState, useEffect } from "react";
import { useApp, Product } from "@/app/context/AppContext";

export default function ProductsPage() {
  const {
    categories,
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory
  } = useApp();

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
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

  // Product Form submit
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    const parsedPrice = parseFloat(prodPrice);
    const parsedTax = parseFloat(prodTax);
    const catIdNum = prodCatId || null;

    if (editingProductId !== null) {
      updateProduct(editingProductId, {
        name: prodName,
        categoryId: catIdNum,
        price: parsedPrice,
        unitOfMeasure: prodUom,
        taxPercentage: parsedTax,
        description: prodDesc
      });
      setEditingProductId(null);
    } else {
      createProduct({
        name: prodName,
        categoryId: catIdNum,
        price: parsedPrice,
        unitOfMeasure: prodUom,
        taxPercentage: parsedTax,
        description: prodDesc
      });
    }

    setProdName("");
    setProdPrice("");
    setProdDesc("");
    setShowProductForm(false);
  };

  const handleInlineCatCreate = () => {
    if (!inlineCatName) return;
    const newCat = createCategory({
      name: inlineCatName,
      color: inlineCatColor
    });
    setProdCatId(newCat.id);
    setInlineCatName("");
    setShowInlineCatForm(false);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdName(prod.name);
    setProdCatId(prod.categoryId ? prod.categoryId : "");
    setProdPrice(String(prod.price));
    setProdUom(prod.unitOfMeasure);
    setProdTax(String(prod.taxPercentage));
    setProdDesc(prod.description);
    setShowProductForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">POS Products Directory</h2>
          <p className="text-stone-500 mt-0.5">List, configure, or register menu catalog products.</p>
        </div>
        <button
          onClick={() => {
            setEditingProductId(null);
            setProdName("");
            setProdPrice("");
            setProdDesc("");
            setShowProductForm(true);
          }}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-colors"
        >
          + Register New Product
        </button>
      </div>

      {/* Product form dropdown popup */}
      {showProductForm && (
        <form onSubmit={handleProductSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-xl animate-fade-in">
          <h3 className="font-extrabold text-sm border-b border-stone-100 pb-2">
            {editingProductId !== null ? "Modify Product Details" : "Register New Product"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-400 font-bold mb-1">Product Name</label>
              <input
                type="text"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Mocha Latte"
                className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-955 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-stone-400 font-bold mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="e.g. 4.50"
                className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-955 dark:text-white"
                required
              />
            </div>

            {/* INLINE CATEGORY PICKER / CREATOR */}
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-stone-400 font-bold">Category Assignment</label>
                <button
                  type="button"
                  onClick={() => setShowInlineCatForm(!showInlineCatForm)}
                  className="text-primary font-bold hover:underline"
                >
                  {showInlineCatForm ? "Cancel inline create" : "+ Create category inline"}
                </button>
              </div>

              {!showInlineCatForm ? (
                <select
                  value={prodCatId}
                  onChange={(e) => setProdCatId(e.target.value)}
                  className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                >
                  <option value="">No Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-3 animate-fade-in">
                  <p className="font-bold text-[10px] text-stone-400">Add Inline Category</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={inlineCatName}
                      onChange={(e) => setInlineCatName(e.target.value)}
                      placeholder="Category Name"
                      className="p-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white"
                    />
                    <input
                      type="color"
                      value={inlineCatColor}
                      onChange={(e) => setInlineCatColor(e.target.value)}
                      className="w-full h-8 p-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleInlineCatCreate}
                    className="px-3 py-1 bg-primary text-white font-bold rounded-lg"
                  >
                    Add & Select Category
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-stone-400 font-bold mb-1">Unit of Measure</label>
              <select
                value={prodUom}
                onChange={(e) => setProdUom(e.target.value)}
                className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
              >
                <option value="per piece">per piece</option>
                <option value="per kg">per kg</option>
                <option value="per litre">per litre</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-400 font-bold mb-1">Tax Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                value={prodTax}
                onChange={(e) => setProdTax(e.target.value)}
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-955 dark:text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-stone-400 font-bold mb-1">Description</label>
              <textarea
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                rows={2}
                placeholder="Product description for receipts..."
                className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-955 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow">
              Save Product
            </button>
            <button
              type="button"
              onClick={() => setShowProductForm(false)}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List of products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod) => {
          const cat = categories.find(c => c.id === prod.categoryId);
          
          return (
            <div key={prod.id} className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="px-2.5 py-0.5 rounded text-[10px] font-bold text-stone-700 uppercase"
                    style={{ backgroundColor: `${cat?.color || "#E2E8F0"}33`, borderLeft: `3px solid ${cat?.color || "#E2E8F0"}` }}
                  >
                    {cat ? cat.name : "No Category"}
                  </span>
                  <span className="font-mono text-stone-400">ID #{prod.id}</span>
                </div>
                <h4 className="font-extrabold text-sm text-stone-800 dark:text-white">{prod.name}</h4>
                <p className="text-stone-400 text-xs mt-1 leading-tight">{prod.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                <div>
                  <p className="font-black text-sm text-primary dark:text-amber-500">${prod.price.toFixed(2)}</p>
                  <span className="text-[10px] text-stone-500 block uppercase tracking-wider mt-0.5">{prod.unitOfMeasure}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditProduct(prod)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded font-bold text-[10px] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete product ${prod.name}?`)) {
                        deleteProduct(prod.id);
                      }
                    }}
                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded font-bold text-[10px] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

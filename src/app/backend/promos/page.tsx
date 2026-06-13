"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";

export default function PromosPage() {
  const {
    products,
    coupons,
    promotions,
    createCoupon,
    toggleCouponActive,
    createPromotion,
    togglePromoActive
  } = useApp();

  // Coupon & Promo states
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percentage" | "fixed">("percentage");
  const [couponValue, setCouponValue] = useState("");

  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoName, setPromoName] = useState("");
  const [promoType, setPromoType] = useState<"product" | "order">("product");
  const [promoTargetProduct, setPromoTargetProduct] = useState("");
  const [promoMinQty, setPromoMinQty] = useState("2");
  const [promoMinOrderAmt, setPromoMinOrderAmt] = useState("30.00");
  const [promoDiscountType, setPromoDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [promoDiscountValue, setPromoDiscountValue] = useState("");

  // Select default product on load/change
  useEffect(() => {
    if (products.length > 0 && !promoTargetProduct) {
      setPromoTargetProduct(String(products[0].id));
    }
  }, [products, promoTargetProduct]);

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponValue) return;

    createCoupon({
      code: couponCode.toUpperCase(),
      discountType: couponType,
      discountValue: parseFloat(couponValue)
    });

    setCouponCode("");
    setCouponValue("");
    setShowCouponForm(false);
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName || !promoDiscountValue) return;

    createPromotion({
      name: promoName,
      promoType: promoType,
      targetProductId: promoType === "product" ? promoTargetProduct : null,
      minQuantity: promoType === "product" ? parseInt(promoMinQty) : null,
      minOrderAmount: promoType === "order" ? parseFloat(promoMinOrderAmt) : null,
      discountType: promoDiscountType,
      discountValue: parseFloat(promoDiscountValue)
    });

    setPromoName("");
    setPromoDiscountValue("");
    setShowPromoForm(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
      <div>
        <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Discounts, Coupons & Promos Designer</h2>
        <p className="text-stone-500 mt-0.5">Setup coupon codes or create automated basket promotions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Coupon Codes config */}
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">Manual Coupon Codes</h3>
            <button
              onClick={() => setShowCouponForm(!showCouponForm)}
              className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-colors"
            >
              + Create Coupon Code
            </button>
          </div>

          {showCouponForm && (
            <form onSubmit={handleCouponSubmit} className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-3 animate-fade-in">
              <h4 className="font-bold text-xs uppercase text-stone-400">Coupon Details</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1">Code Name</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. COFFEE20"
                    className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl uppercase font-bold text-stone-900 dark:text-stone-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1">Discount Mode</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1">Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    placeholder="e.g. 15.00"
                    className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-900 dark:text-stone-200"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow">
                Save Coupon
              </button>
            </form>
          )}

          {/* Coupon list */}
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all duration-300">
                <div>
                  <p className="font-extrabold text-stone-800 dark:text-stone-100 font-mono text-sm">{coupon.code}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                    {coupon.discountType === "percentage" ? `${coupon.discountValue}% Off total order` : `$${coupon.discountValue} Flat cash off`}
                  </span>
                </div>

                <button
                  onClick={() => toggleCouponActive(coupon.id)}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors ${
                    coupon.isActive
                      ? "bg-red-500/10 text-danger hover:bg-red-500/20"
                      : "bg-green-500/10 text-success hover:bg-green-500/20"
                  }`}
                >
                  {coupon.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Automated Promotions config */}
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">Automated Promotion Rules</h3>
            <button
              onClick={() => setShowPromoForm(!showPromoForm)}
              className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-colors"
            >
              + Create Promo Rule
            </button>
          </div>

          {showPromoForm && (
            <form onSubmit={handlePromoSubmit} className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="font-bold text-xs uppercase text-stone-400">Promotion Rules Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1">Promotion Title</label>
                  <input
                    type="text"
                    value={promoName}
                    onChange={(e) => setPromoName(e.target.value)}
                    placeholder="e.g. Cappuccino combo discount"
                    className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-200"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-500 dark:text-stone-400 mb-1">Promo Type Trigger</label>
                    <select
                      value={promoType}
                      onChange={(e) => setPromoType(e.target.value as any)}
                      className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                    >
                      <option value="product">Product Quantity trigger</option>
                      <option value="order">Order Subtotal amount trigger</option>
                    </select>
                  </div>

                  {promoType === "product" ? (
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-stone-500 dark:text-stone-400 mb-1">Product</label>
                        <select
                          value={promoTargetProduct}
                          onChange={(e) => setPromoTargetProduct(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-500 dark:text-stone-400 mb-1">Min Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={promoMinQty}
                          onChange={(e) => setPromoMinQty(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-900 dark:text-stone-200"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-stone-500 dark:text-stone-400 mb-1">Min Order Subtotal ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={promoMinOrderAmt}
                        onChange={(e) => setPromoMinOrderAmt(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-900 dark:text-stone-200"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-stone-200 dark:border-stone-850 pt-3">
                  <div>
                    <label className="block text-stone-500 dark:text-stone-400 mb-1">Discount Mode</label>
                    <select
                      value={promoDiscountType}
                      onChange={(e) => setPromoDiscountType(e.target.value as any)}
                      className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Cash ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-500 dark:text-stone-400 mb-1">Discount Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={promoDiscountValue}
                      onChange={(e) => setPromoDiscountValue(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-900 dark:text-stone-200"
                      required
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow">
                Save Promo Rule
              </button>
            </form>
          )}

          {/* Promo list */}
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div key={promo.id} className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all duration-300">
                <div>
                  <p className="font-extrabold text-stone-850 dark:text-stone-150 text-xs">{promo.name}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Trigger: {promo.promoType === "product" ? `Qty >= ${promo.minQuantity} of ${products.find(p => p.id === promo.targetProductId)?.name}` : `Subtotal >= $${promo.minOrderAmount}`}
                  </p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Discount: {promo.discountType === "percentage" ? `${promo.discountValue}% Off whole order` : `$${promo.discountValue} Flat cash`}
                  </span>
                </div>

                <button
                  onClick={() => togglePromoActive(promo.id)}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors ${
                    promo.isActive
                      ? "bg-red-500/10 text-danger hover:bg-red-500/20"
                      : "bg-green-500/10 text-success hover:bg-green-500/20"
                  }`}
                >
                  {promo.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

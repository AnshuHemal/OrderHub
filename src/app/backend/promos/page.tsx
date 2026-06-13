"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";
import { 
  Tag, 
  Sparkles, 
  Plus, 
  Trash2, 
  Percent, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight, 
  AlertCircle, 
  Coffee, 
  ShoppingBag 
} from "lucide-react";

export default function PromosPage() {
  const {
    products,
    coupons,
    promotions,
    createCoupon,
    toggleCouponActive,
    deleteCoupon,
    createPromotion,
    togglePromoActive,
    deletePromotion
  } = useApp();

  // Coupon & Promo form visibility & input states
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

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponValue) return;

    await createCoupon({
      code: couponCode.toUpperCase().trim(),
      discountType: couponType,
      discountValue: parseFloat(couponValue)
    });

    setCouponCode("");
    setCouponValue("");
    setShowCouponForm(false);
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName || !promoDiscountValue) return;

    await createPromotion({
      name: promoName.trim(),
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
      
      {/* Header section matching other backend screens */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 dark:border-stone-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans tracking-tight">
            Campaigns & Promotion Designer
          </h2>
          <p className="text-stone-500 mt-0.5">
            Configure redeemable coupon codes or build automated basket-level promotion rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ========================================================
            COUPON SECTION PANEL
            ======================================================== */}
        <div className="bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800/80 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Tag className="size-4.5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">Manual Coupon Codes</h3>
                  <p className="text-[10px] text-stone-500">Requires manual code entry by cashiers during checkout</p>
                </div>
              </div>
              <button
                onClick={() => setShowCouponForm(!showCouponForm)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <Plus className="size-4" />
                New Coupon
              </button>
            </div>

            {/* Slide Down Form for Coupons */}
            {showCouponForm && (
              <form onSubmit={handleCouponSubmit} className="p-5 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-850 rounded-2xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800/60 pb-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">Create New Coupon</span>
                  <button type="button" onClick={() => setShowCouponForm(false)} className="text-stone-400 hover:text-stone-200">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-500 dark:text-stone-400 font-bold">Code Name</label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="COFFEE20"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl uppercase font-mono font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-500 dark:text-stone-400 font-bold">Discount Mode</label>
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Cash ($)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-500 dark:text-stone-400 font-bold">Discount Value</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 dark:text-stone-500 font-bold">
                        {couponType === "percentage" ? <Percent className="size-3" /> : <DollarSign className="size-3" />}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={couponValue}
                        onChange={(e) => setCouponValue(e.target.value)}
                        placeholder="15.00"
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCouponForm(false)}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-colors">
                    Save Coupon
                  </button>
                </div>
              </form>
            )}

            {/* Coupons List */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {coupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className="p-4 bg-stone-50/50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 hover:border-stone-300 dark:hover:border-stone-850 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-900 flex items-center justify-center text-stone-500 dark:text-stone-400 font-bold">
                      🎟️
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-stone-800 dark:text-stone-100 font-mono text-sm tracking-wide">{coupon.code}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10 flex items-center gap-1">
                          {coupon.discountType === "percentage" ? (
                            <>
                              <Percent className="size-2.5" />
                              {coupon.discountValue}% Off order
                            </>
                          ) : (
                            <>
                              <DollarSign className="size-2.5" />
                              ${coupon.discountValue} Off order
                            </>
                          )}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                        <span className="text-[9px] text-stone-500">{coupon.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCouponActive(coupon.id)}
                      className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 ${
                        coupon.isActive
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                      }`}
                      title={coupon.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                    >
                      {coupon.isActive ? (
                        <>
                          <ToggleRight className="size-4" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Pause</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="size-4" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Enable</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Delete coupon code ${coupon.code}?`)) {
                          deleteCoupon(coupon.id);
                        }
                      }}
                      className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}

              {coupons.length === 0 && (
                <div className="py-12 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-center text-stone-500 flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="size-8 text-stone-400 dark:text-stone-600" />
                  <p className="italic">No manual coupon codes configured.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            PROMOTIONS SECTION PANEL
            ======================================================== */}
        <div className="bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800/80 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Sparkles className="size-4.5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">Automated Promotion Rules</h3>
                  <p className="text-[10px] text-stone-500">Evaluates dynamically and applies discount on checkout qualifying conditions</p>
                </div>
              </div>
              <button
                onClick={() => setShowPromoForm(!showPromoForm)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <Plus className="size-4" />
                New Promo Rule
              </button>
            </div>

            {/* Slide Down Form for Promotions */}
            {showPromoForm && (
              <form onSubmit={handlePromoSubmit} className="p-5 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-850 rounded-2xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800/60 pb-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">Create Automated Promotion Rule</span>
                  <button type="button" onClick={() => setShowPromoForm(false)} className="text-stone-400 hover:text-stone-200">✕</button>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-500 dark:text-stone-400 font-bold">Promotion Campaign Title</label>
                    <input
                      type="text"
                      value={promoName}
                      onChange={(e) => setPromoName(e.target.value)}
                      placeholder="e.g. Espresso Happy Hour Discount"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-stone-500 dark:text-stone-400 font-bold">Rule Trigger Mode</label>
                      <select
                        value={promoType}
                        onChange={(e) => setPromoType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                      >
                        <option value="product">Product specific quantity</option>
                        <option value="order">Order subtotal amount threshold</option>
                      </select>
                    </div>

                    {promoType === "product" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-stone-500 dark:text-stone-400 font-bold">Target Product</label>
                          <select
                            value={promoTargetProduct}
                            onChange={(e) => setPromoTargetProduct(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500 text-[10px]"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-stone-500 dark:text-stone-400 font-bold">Min Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={promoMinQty}
                            onChange={(e) => setPromoMinQty(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-stone-500 dark:text-stone-400 font-bold">Min Subtotal Threshold ($)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 dark:text-stone-500 font-bold">
                            <DollarSign className="size-3" />
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={promoMinOrderAmt}
                            onChange={(e) => setPromoMinOrderAmt(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-200 dark:border-stone-850 pt-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-stone-500 dark:text-stone-400 font-bold">Applied Discount Mode</label>
                      <select
                        value={promoDiscountType}
                        onChange={(e) => setPromoDiscountType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                      >
                        <option value="percentage">Percentage (%) Off whole order</option>
                        <option value="fixed">Fixed Cash ($) off</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-stone-500 dark:text-stone-400 font-bold">Discount Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 dark:text-stone-500 font-bold">
                          {promoDiscountType === "percentage" ? <Percent className="size-3" /> : <DollarSign className="size-3" />}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={promoDiscountValue}
                          onChange={(e) => setPromoDiscountValue(e.target.value)}
                          placeholder="10.00"
                          className="w-full pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 rounded-xl font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-amber-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPromoForm(false)}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-colors">
                    Save Promo Rule
                  </button>
                </div>
              </form>
            )}

            {/* Promotions List */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {promotions.map((promo) => (
                <div 
                  key={promo.id} 
                  className="p-4 bg-stone-50/50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-850 hover:border-stone-300 dark:hover:border-stone-850 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-sm transition-all duration-300"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-stone-100 dark:bg-stone-900 rounded-lg text-xs">
                        {promo.promoType === "product" ? (
                          <Coffee className="size-3.5 text-amber-500" />
                        ) : (
                          <ShoppingBag className="size-3.5 text-blue-500" />
                        )}
                      </div>
                      <h4 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm">{promo.name}</h4>
                    </div>

                    <div className="space-y-1 pl-7">
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        <span className="font-bold text-stone-450 dark:text-stone-500">Condition:</span>
                        {promo.promoType === "product" ? (
                          <>
                            Buy <span className="text-amber-500 font-black">{promo.minQuantity}x</span> or more of{" "}
                            <span className="text-stone-700 dark:text-stone-300 font-semibold underline underline-offset-2">
                              {products.find((p) => p.id === promo.targetProductId)?.name || "Target Product"}
                            </span>
                          </>
                        ) : (
                          <>
                            Order subtotal total reaches or exceeds{" "}
                            <span className="text-amber-500 font-black">${promo.minOrderAmount}</span>
                          </>
                        )}
                      </p>
                      
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/10 flex items-center gap-1.5">
                          Discount: {promo.discountType === "percentage" ? (
                            <>
                              <Percent className="size-2.5" />
                              {promo.discountValue}% off whole cart
                            </>
                          ) : (
                            <>
                              <DollarSign className="size-2.5" />
                              ${promo.discountValue} flat cash reduction
                            </>
                          )}
                        </span>

                        <span className={`w-1.5 h-1.5 rounded-full ${promo.isActive ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                        <span className="text-[9px] text-stone-500">{promo.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 border-stone-200 dark:border-stone-850 pt-2 sm:pt-0">
                    <button
                      onClick={() => togglePromoActive(promo.id)}
                      className={`px-3 py-1.5 rounded-xl transition-all border flex items-center gap-1.5 ${
                        promo.isActive
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                      }`}
                      title={promo.isActive ? "Deactivate Promo" : "Activate Promo"}
                    >
                      {promo.isActive ? (
                        <>
                          <ToggleRight className="size-4" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Pause</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="size-4" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Enable</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Delete promotion rule ${promo.name}?`)) {
                          deletePromotion(promo.id);
                        }
                      }}
                      className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                      title="Delete Promo"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}

              {promotions.length === 0 && (
                <div className="py-12 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-center text-stone-500 flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="size-8 text-stone-400 dark:text-stone-600" />
                  <p className="italic">No automated promotion rules configured.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

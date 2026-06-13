"use client";

import React, { useState } from "react";
import { useApp, PaymentMethod } from "@/app/context/AppContext";

interface PaymentCardProps {
  pm: PaymentMethod;
  togglePaymentMethod: (id: number) => void;
  saveUpiId: (id: number, upiId: string) => void;
}

function PaymentMethodCard({ pm, togglePaymentMethod, saveUpiId }: PaymentCardProps) {
  const [upiInput, setUpiInput] = useState(pm.upiId || "");

  return (
    <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <span className="text-3xl">
          {pm.type === "cash" ? "💵" : pm.type === "card" ? "💳" : "📱"}
        </span>
        {/* Active toggle */}
        <button
          onClick={() => togglePaymentMethod(pm.id)}
          className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider transition-colors ${
            pm.isEnabled
              ? "bg-green-500/10 text-success hover:bg-green-500/20"
              : "bg-stone-100 text-stone-400 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          {pm.isEnabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      <div>
        <h4 className="font-extrabold text-sm">{pm.name}</h4>
        <p className="text-stone-400 text-[10px] uppercase tracking-wider mt-0.5">Type: {pm.type}</p>
      </div>

      {/* UPI Custom ID configuration field */}
      {pm.type === "upi" && (
        <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800">
          <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Merchant UPI ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              placeholder="e.g. cafe@ybl"
              className="flex-1 p-2 bg-stone-50 dark:bg-stone-955 border border-stone-250 dark:border-stone-800 rounded-xl font-mono text-stone-800 dark:text-stone-200"
            />
            <button
              type="button"
              onClick={() => {
                saveUpiId(pm.id, upiInput);
                alert(`UPI ID saved for QR code generator: ${upiInput}`);
              }}
              className="px-3 py-2 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const {
    paymentMethods,
    togglePaymentMethod,
    saveUpiId
  } = useApp();

  return (
    <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
      <div>
        <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Payment Modes Configurator</h2>
        <p className="text-stone-500 mt-0.5">Enable/disable payment modes and configure active QR merchant UPI IDs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paymentMethods.map((pm) => (
          <PaymentMethodCard
            key={pm.id}
            pm={pm}
            togglePaymentMethod={togglePaymentMethod}
            saveUpiId={saveUpiId}
          />
        ))}
      </div>
    </div>
  );
}

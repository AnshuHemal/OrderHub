"use client";

import React, { useState } from "react";
import { useApp, Customer } from "@/app/context/AppContext";

export default function CustomersPage() {
  const {
    currentUser,
    customers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  } = useApp();

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";

  // Customer CRUD states
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail) return;

    if (editingCustomerId !== null) {
      await updateCustomer(editingCustomerId, {
        name: custName,
        email: custEmail,
        phone: custPhone
      });
      setEditingCustomerId(null);
    } else {
      await createCustomer({
        name: custName,
        email: custEmail,
        phone: custPhone
      });
    }

    setCustName("");
    setCustEmail("");
    setCustPhone("");
    setShowCustomerForm(false);
  };

  const startEditCustomer = (cust: Customer) => {
    setEditingCustomerId(cust.id);
    setCustName(cust.name);
    setCustEmail(cust.email);
    setCustPhone(cust.phone || "");
    setShowCustomerForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex justify-between items-center pb-4 border-b border-stone-250 dark:border-stone-855">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100">Customer Directory</h2>
          <p className="text-stone-500 mt-0.5">Manage customer profiles and contact registry.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingCustomerId(null);
              setCustName("");
              setCustEmail("");
              setCustPhone("");
              setShowCustomerForm(true);
            }}
            className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-hover transition-all"
          >
            + Add New Customer
          </button>
        )}
      </div>

      {/* Customer Add/Edit Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-6 rounded-3xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-black text-stone-800 dark:text-white mb-4">
              {editingCustomerId ? "Edit Customer Details" : "Register New Customer"}
            </h3>
            
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-stone-500 dark:text-stone-400 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="block text-stone-550 dark:text-stone-400 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="john.doe@gmail.com"
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="block text-stone-550 dark:text-stone-400 font-bold mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+1 555-0199"
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerForm(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 rounded-xl font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow transition-colors"
                >
                  {editingCustomerId ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers table representation */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800 text-stone-400 text-[10px] font-bold uppercase">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-stone-400 italic">
                    No registered customers found.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold">{cust.name}</td>
                    <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{cust.email}</td>
                    <td className="px-6 py-4 font-mono">{cust.phone || <span className="text-stone-400 italic font-sans text-[10px]">Not Provided</span>}</td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => startEditCustomer(cust)}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg font-bold text-[10px] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete customer ${cust.name}?`)) {
                                await deleteCustomer(cust.id);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-danger rounded-lg font-bold text-[10px] transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic font-light">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

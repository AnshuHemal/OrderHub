"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Customer } from "@/app/context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/motion/fade-in";

function CustomersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    customers,
    currentOrder,
    activeSession,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    linkCustomerToOrder
  } = useApp();

  // Search sync from search query parameter
  const customerSearch = searchParams.get("search") || "";

  // Modals & form fields
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [validationError, setValidationError] = useState("");

  if (!activeSession) return null;

  // Filter customers based on name, email, or phone search matches
  const filteredCustomers = customers.filter((c) => {
    const searchLower = customerSearch.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = c.phone?.includes(customerSearch) || false;
    const emailMatch = c.email?.toLowerCase().includes(searchLower) || false;
    return nameMatch || phoneMatch || emailMatch;
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setValidationError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustomerName(cust.name);
    setCustomerEmail(cust.email || "");
    setCustomerPhone(cust.phone || "");
    setValidationError("");
    setShowModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!customerName.trim()) {
      setValidationError("Full name is required.");
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim()
        });
      } else {
        const newCust = await createCustomer({
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim()
        });

        // Auto-link newly registered guest if there's an active cart
        if (newCust && currentOrder) {
          linkCustomerToOrder(newCust.id);
          router.push("/terminal/order");
          return;
        }
      }

      setShowModal(false);
    } catch (err: any) {
      setValidationError(err?.message || "Failed to save customer profile.");
    }
  };

  const handleDeleteCustomer = (cust: Customer) => {
    if (confirm(`Are you sure you want to permanently delete the profile for ${cust.name}?`)) {
      deleteCustomer(cust.id);
    }
  };

  const handleLinkCustomer = (cust: Customer) => {
    linkCustomerToOrder(cust.id);
    router.push("/terminal/order");
  };

  return (
    <FadeIn className="flex-1 p-6 max-w-5xl mx-auto space-y-6 text-xs text-stone-800 dark:text-stone-200">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Guest & Customer Directory
          </h2>
          <p className="text-sm text-stone-500">
            Manage checkout guest profiles, email receipt delivery, and client relations.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          + Register New Guest
        </button>
      </div>

      {/* Directory Table View */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-150 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Guest Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400 space-y-2">
                      <span className="text-3xl">👥</span>
                      <p className="font-semibold text-sm">No customers matching search query found.</p>
                      <p className="text-[10px]">Try searching by different spelling, phone or registered email.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-850 dark:text-stone-150">
                      {cust.name}
                    </td>
                    <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono">
                      {cust.email || <span className="italic text-stone-400">Not specified</span>}
                    </td>
                    <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono">
                      {cust.phone || <span className="italic text-stone-400">Not specified</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {currentOrder && (
                        <button
                          onClick={() => handleLinkCustomer(cust)}
                          className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-success rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Link to Cart
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(cust)}
                        className="px-3 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 font-bold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(cust)}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration & Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 relative z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-150 dark:border-stone-800">
                <h3 className="font-extrabold text-sm text-stone-850 dark:text-stone-100">
                  {editingCustomer ? "Edit Customer Profile" : "Register Guest Customer"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-stone-400 hover:text-stone-850 dark:hover:text-stone-100 text-lg transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-550 dark:text-stone-450 mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-550 dark:text-stone-450 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-550 dark:text-stone-450 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-mono"
                  />
                </div>

                {validationError && (
                  <p className="text-xs font-semibold text-danger leading-relaxed">
                    ⚠️ {validationError}
                  </p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-500 rounded-xl font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow transition-colors cursor-pointer"
                  >
                    {editingCustomer ? "Save Changes" : "Link & Register"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </FadeIn>
  );
}

export default function CustomersDirectoryPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-100 dark:bg-stone-955 text-center space-y-4">
        <span className="text-xl text-stone-550 dark:text-stone-400">Loading Customers Directory...</span>
      </div>
    }>
      <CustomersDirectoryContent />
    </Suspense>
  );
}

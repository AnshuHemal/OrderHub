"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Customer } from "@/app/context/AppContext";
import { DialogModal } from "@/components/ui/dialog-modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Contact, Plus, Pencil, Trash2, Mail, Phone, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

function CustomersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const { customers, currentOrder, activeSession, createCustomer, updateCustomer, deleteCustomer, linkCustomerToOrder } = useApp();

  const customerSearch = searchParams.get("search") || "";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [formError, setFormError] = useState("");

  if (!activeSession) return null;

  const filteredCustomers = customers.filter((c) => {
    const s = customerSearch.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(s)) ||
      (c.phone?.includes(customerSearch)) ||
      (c.email?.toLowerCase().includes(s))
    );
  });

  const resetForm = () => {
    setCustName(""); setCustEmail(""); setCustPhone("");
    setNameErr(""); setEmailErr(""); setPhoneErr(""); setFormError("");
  };

  const openAdd = () => { resetForm(); setEditingCustomer(null); setIsModalOpen(true); };
  const openEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustName(cust.name); setCustEmail(cust.email || ""); setCustPhone(cust.phone || "");
    setNameErr(""); setEmailErr(""); setPhoneErr(""); setFormError("");
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingCustomer(null); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = !custName.trim() ? "Full name is required." : "";
    const eErr = custEmail.trim() && !EMAIL_RE.test(custEmail.trim()) ? "Enter a valid email address." : "";
    const pErr = custPhone.trim() && !PHONE_RE.test(custPhone.trim()) ? "Phone number must be exactly 10 digits." : "";
    setNameErr(nErr); setEmailErr(eErr); setPhoneErr(pErr);
    if (nErr || eErr || pErr) return;
    setFormError("");
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, { name: custName.trim(), email: custEmail.trim(), phone: custPhone.trim() });
        closeModal();
      } else {
        const newCust = await createCustomer({ name: custName.trim(), email: custEmail.trim(), phone: custPhone.trim() });
        if (newCust && currentOrder) {
          linkCustomerToOrder(newCust.id);
          router.push("/terminal/order");
          return;
        }
        closeModal();
      }
    } catch (err: any) {
      setFormError(err?.message || "Failed to save customer.");
    }
  };

  const handleDelete = async (cust: Customer) => {
    const ok = await confirm({
      title: "Delete Guest Profile",
      message: `Permanently delete the profile for "${cust.name}"? This action cannot be undone.`,
      confirmLabel: "Delete Profile",
      variant: "danger",
    });
    if (ok) deleteCustomer(cust.id);
  };

  const handleLink = (cust: Customer) => {
    linkCustomerToOrder(cust.id);
    router.push("/terminal/order");
  };

  const inputCls = (err?: string) => cn(
    "w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 transition-all placeholder:text-stone-400 text-sm",
    err ? "border-red-400 focus:ring-red-400/30" : "border-stone-200 dark:border-stone-800 focus:ring-primary/30 focus:border-primary"
  );
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  return (
    <section className="flex-1 p-5 lg:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Guest & Customer Directory
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
            Manage checkout guest profiles, email receipt delivery, and client relations.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="size-4" />
          Register New Guest
        </button>
      </div>

      {/* ── Customers Table ── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800 text-stone-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Guest Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-3 text-stone-400">
                      <Contact className="size-10" />
                      <div>
                        <p className="font-semibold text-sm">No customers found.</p>
                        <p className="text-xs mt-1">Try a different search term, or register a new guest.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-black text-xs">{cust.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">{cust.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-400 text-sm font-mono">
                        <Mail className="size-3.5 text-stone-400" />
                        {cust.email || <span className="italic text-stone-400 font-sans">Not provided</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {cust.phone ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-stone-600 dark:text-stone-400 text-sm">
                          <Phone className="size-3.5 text-stone-400" />{cust.phone}
                        </span>
                      ) : (
                        <span className="italic text-stone-400 text-xs">Not provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {currentOrder && (
                          <button
                            onClick={() => handleLink(cust)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs transition-colors"
                          >
                            <UserCheck className="size-3" /> Link to Cart
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(cust)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs transition-colors"
                        >
                          <Pencil className="size-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cust)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
                        >
                          <Trash2 className="size-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DialogModal ── */}
      <DialogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? "Edit Customer Profile" : "Register New Guest"}
        description={editingCustomer ? "Update this guest's contact information." : "Add a new customer to the directory and optionally link them to the active order."}
        icon={<Contact className="size-5" />}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={custName} onChange={(e) => { setCustName(e.target.value); setNameErr(""); }} placeholder="e.g. John Doe" className={inputCls(nameErr)} autoFocus />
            {nameErr && <p className="text-red-500 text-xs mt-1">{nameErr}</p>}
          </div>
          <div>
            <label className={labelCls}>Email <span className="text-stone-400 font-normal">(optional)</span></label>
            <input type="text" value={custEmail} onChange={(e) => { setCustEmail(e.target.value); setEmailErr(""); }} placeholder="john.doe@email.com" className={inputCls(emailErr)} />
            {emailErr && <p className="text-red-500 text-xs mt-1">{emailErr}</p>}
          </div>
          <div>
            <label className={labelCls}>Phone <span className="text-stone-400 font-normal">(optional)</span></label>
            <input type="text" value={custPhone} onChange={(e) => { setCustPhone(e.target.value); setPhoneErr(""); }} placeholder="+1 555-0199" className={inputCls(phoneErr)} />
            {phoneErr && <p className="text-red-500 text-xs mt-1">{phoneErr}</p>}
          </div>
          {formError && <p className="text-xs text-red-500 font-semibold">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button type="button" onClick={closeModal} className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow transition-all active:scale-95">
              {editingCustomer ? "Save Changes" : "Register Guest"}
            </button>
          </div>
        </form>
      </DialogModal>
    </section>
  );
}

export default function CustomersDirectoryPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CustomersDirectoryContent />
    </Suspense>
  );
}

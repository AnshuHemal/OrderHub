"use client";

import React, { useState } from "react";
import { useApp, Customer } from "@/app/context/AppContext";
import { DialogModal } from "@/components/ui/dialog-modal";
import { Contact, Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;

function validateEmail(v: string) {
  if (!v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}
function validatePhone(v: string) {
  if (!v) return "";
  if (!PHONE_RE.test(v)) return "Enter a valid phone number (e.g. +1 555-0199).";
  return "";
}

export default function CustomersPage() {
  const { currentUser, customers, createCustomer, updateCustomer, deleteCustomer } = useApp();
  const confirm = useConfirm();

  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.role === "OWNER" ||
    currentUser?.role === "MANAGER";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  const resetForm = () => {
    setCustName(""); setCustEmail(""); setCustPhone("");
    setNameErr(""); setEmailErr(""); setPhoneErr("");
  };

  const openNewModal = () => {
    resetForm();
    setEditingCustomerId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomerId(cust.id);
    setCustName(cust.name); setCustEmail(cust.email); setCustPhone(cust.phone || "");
    setNameErr(""); setEmailErr(""); setPhoneErr("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomerId(null);
    resetForm();
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = !custName.trim() ? "Name is required." : "";
    const eErr = validateEmail(custEmail);
    const pErr = validatePhone(custPhone);
    setNameErr(nErr); setEmailErr(eErr); setPhoneErr(pErr);
    if (nErr || eErr || pErr) return;

    if (editingCustomerId !== null) {
      await updateCustomer(editingCustomerId, { name: custName, email: custEmail, phone: custPhone });
      setEditingCustomerId(null);
    } else {
      await createCustomer({ name: custName, email: custEmail, phone: custPhone });
    }
    resetForm();
    closeModal();
  };

  const inputCls = (err: string) =>
    `w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 transition-all placeholder:text-stone-400 ${
      err
        ? "border-red-400 focus:ring-red-400/30"
        : "border-stone-200 dark:border-stone-800 focus:ring-primary/30 focus:border-primary"
    }`;
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  return (
    <div className="space-y-6 animate-fade-in text-sm text-stone-800 dark:text-stone-200">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Guest Registry
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm md:text-base">
            Manage customer profiles and contact registry.
          </p>
        </div>
        {isAdmin && (
          <button
            id="btn-add-customer"
            onClick={openNewModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="size-4" />
            Add New Guest
          </button>
        )}
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
                {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 4 : 3}
                    className="px-6 py-14 text-center text-stone-400 italic"
                  >
                    No registered customers found.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-black text-xs">
                            {cust.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-bold text-stone-850 dark:text-stone-200">
                          {cust.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                        <Mail className="size-3.5 text-stone-400" />
                        {cust.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {cust.phone ? (
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <Phone className="size-3.5 text-stone-400" />
                          {cust.phone}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic text-xs font-sans">
                          Not Provided
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEditModal(cust)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs transition-colors"
                          >
                            <Pencil className="size-3" /> Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (await confirm({
                                title: "Delete Customer",
                                message: `Are you sure you want to delete the customer entry for ${cust.name}?`,
                                confirmLabel: "Delete Customer",
                                variant: "danger"
                              })) {
                                await deleteCustomer(cust.id);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
                          >
                            <Trash2 className="size-3" /> Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dialog Modal ── */}
      {isAdmin && (
        <DialogModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingCustomerId ? "Edit Customer Details" : "Register New Guest"}
          description={
            editingCustomerId
              ? "Update the guest's contact information."
              : "Add a new customer profile to the registry."
          }
          icon={<Contact className="size-5" />}
          size="md"
        >
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={custName}
                onChange={(e) => { setCustName(e.target.value); setNameErr(""); }}
                placeholder="John Doe"
                className={inputCls(nameErr)}
                autoFocus
              />
              {nameErr && <p className="text-red-500 text-xs mt-1">{nameErr}</p>}
            </div>

            <div>
              <label className={labelCls}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={custEmail}
                onChange={(e) => { setCustEmail(e.target.value); setEmailErr(""); }}
                placeholder="john.doe@gmail.com"
                className={inputCls(emailErr)}
              />
              {emailErr && <p className="text-red-500 text-xs mt-1">{emailErr}</p>}
            </div>

            <div>
              <label className={labelCls}>
                Phone Number{" "}
                <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={custPhone}
                onChange={(e) => { setCustPhone(e.target.value); setPhoneErr(""); }}
                placeholder="+1 555-0199"
                className={inputCls(phoneErr)}
              />
              {phoneErr && <p className="text-red-500 text-xs mt-1">{phoneErr}</p>}
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
                {editingCustomerId ? "Save Changes" : "Create Profile"}
              </button>
            </div>
          </form>
        </DialogModal>
      )}
    </div>
  );
}

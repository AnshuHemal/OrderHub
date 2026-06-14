"use client";

import React, { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { DialogModal } from "@/components/ui/dialog-modal";
import { Users, Plus, KeyRound, Archive, ArchiveRestore, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: string) {
  if (!v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}
function validatePassword(v: string, required: boolean) {
  if (required && !v) return "Password is required.";
  if (v && v.length < 8) return "Password must be at least 8 characters.";
  return "";
}

export default function UsersPage() {
  const { users, createUser, updateUserPassword, toggleArchiveUser, deleteUser } = useApp();
  const confirm = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "employee">("employee");

  const [nameErr, setNameErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const resetForm = () => {
    setUserName(""); setUserEmail(""); setUserPassword(""); setUserRole("employee");
    setNameErr(""); setEmailErr(""); setPasswordErr("");
  };

  const openNewModal = () => {
    resetForm();
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  const openEditPasswordModal = (userId: string) => {
    resetForm();
    setEditingUserId(userId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
    resetForm();
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingUserId === null;

    const nErr = isNew && !userName.trim() ? "Name is required." : "";
    const eErr = isNew ? validateEmail(userEmail) : "";
    const pErr = validatePassword(userPassword, isNew);

    setNameErr(nErr); setEmailErr(eErr); setPasswordErr(pErr);
    if (nErr || eErr || pErr) return;

    if (!isNew) {
      if (userPassword) updateUserPassword(editingUserId, userPassword);
    } else {
      createUser({ name: userName, email: userEmail, passwordHash: userPassword, role: userRole });
    }

    closeModal();
  };

  const inputCls = (err: string) =>
    `w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 transition-all placeholder:text-stone-400 ${
      err
        ? "border-red-400 focus:ring-red-400/30"
        : "border-stone-200 dark:border-stone-800 focus:ring-primary/30 focus:border-primary"
    }`;
  const labelCls = "block text-stone-500 dark:text-stone-400 font-bold mb-1.5 text-sm";

  const editingUser = editingUserId ? users.find((u) => u.id === editingUserId) : null;

  return (
    <div className="space-y-6 animate-fade-in text-sm text-stone-800 dark:text-stone-200">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            Cashier &amp; Staff Accounts
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm md:text-base">
            Manage credentials, toggle roles and archive staff access.
          </p>
        </div>
        <button
          id="btn-add-employee"
          onClick={openNewModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="size-4" />
          Add Employee Account
        </button>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/60 border-b border-stone-150 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-xs">
                <th className="px-6 py-4">Employee Name</th>
                <th className="px-6 py-4">Login Email</th>
                <th className="px-6 py-4">Access Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary font-black text-xs">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-bold text-stone-855 dark:text-stone-200">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      u.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                    }`}>
                      {u.role === "admin" ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs uppercase font-bold tracking-wider ${
                      u.isArchived
                        ? "bg-red-500/10 text-red-500"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isArchived ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                      {u.isArchived ? "Archived" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openEditPasswordModal(u.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-xl font-bold text-xs transition-colors"
                        title="Change password"
                      >
                        <KeyRound className="size-3" /> Password
                      </button>
                      <button
                        onClick={() => toggleArchiveUser(u.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-xl font-bold text-xs transition-colors"
                        title={u.isArchived ? "Restore access" : "Archive account"}
                      >
                        {u.isArchived ? <ArchiveRestore className="size-3" /> : <Archive className="size-3" />}
                        {u.isArchived ? "Restore" : "Archive"}
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirm({
                            title: "Delete Staff Account",
                            message: `Are you sure you want to delete the staff account for ${u.name}?`,
                            confirmLabel: "Delete Account",
                            variant: "danger"
                          })) {
                            deleteUser(u.id);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
                      >
                        <Trash2 className="size-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-stone-400 italic">
                    No staff accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dialog Modal ── */}
      <DialogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUserId ? `Change Password` : "Register Employee Account"}
        description={
          editingUserId
            ? `Set a new login password for ${editingUser?.name ?? "this employee"}.`
            : "Create a new staff login with an assigned access role."
        }
        icon={<Users className="size-5" />}
        size="md"
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          {editingUserId === null && (
            <>
              <div>
                <label className={labelCls}>Employee Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => { setUserName(e.target.value); setNameErr(""); }}
                  placeholder="e.g. Cashier Sarah"
                  className={inputCls(nameErr)}
                  autoFocus
                />
                {nameErr && <p className="text-red-500 text-xs mt-1">{nameErr}</p>}
              </div>
              <div>
                <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={userEmail}
                  onChange={(e) => { setUserEmail(e.target.value); setEmailErr(""); }}
                  placeholder="sarah@cafepos.com"
                  className={inputCls(emailErr)}
                />
                {emailErr && <p className="text-red-500 text-xs mt-1">{emailErr}</p>}
              </div>
              <div>
                <label className={labelCls}>Staff Access Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as "admin" | "employee")}
                  className={inputCls("")}
                >
                  <option value="employee">Employee / Cashier</option>
                  <option value="admin">Admin / Manager</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className={labelCls}>
              {editingUserId ? "New Password" : "Login Password"} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={userPassword}
              onChange={(e) => { setUserPassword(e.target.value); setPasswordErr(""); }}
              placeholder="Min. 8 characters"
              className={inputCls(passwordErr)}
              autoFocus={!!editingUserId}
            />
            {passwordErr && <p className="text-red-500 text-xs mt-1">{passwordErr}</p>}
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
              {editingUserId ? "Update Password" : "Create Account"}
            </button>
          </div>
        </form>
      </DialogModal>
    </div>
  );
}

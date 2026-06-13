"use client";

import React, { useState } from "react";
import { useApp } from "@/app/context/AppContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: string) {
  if (!v.trim())         return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}
function validatePassword(v: string, required: boolean) {
  if (required && !v)    return "Password is required.";
  if (v && v.length < 8) return "Password must be at least 8 characters.";
  return "";
}

export default function UsersPage() {
  const {
    users,
    createUser,
    updateUserPassword,
    toggleArchiveUser,
    deleteUser
  } = useApp();

  const [showUserForm, setShowUserForm]       = useState(false);
  const [userName, setUserName]               = useState("");
  const [userEmail, setUserEmail]             = useState("");
  const [userPassword, setUserPassword]       = useState("");
  const [userRole, setUserRole]               = useState<"admin" | "employee">("employee");
  const [editingUserId, setEditingUserId]     = useState<string | null>(null);

  // Field-level errors
  const [nameErr, setNameErr]         = useState("");
  const [emailErr, setEmailErr]       = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isNew = editingUserId === null;

    // Validate
    const nErr = isNew && !userName.trim() ? "Name is required." : "";
    const eErr = isNew ? validateEmail(userEmail) : "";
    const pErr = validatePassword(userPassword, isNew);

    setNameErr(nErr);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    if (nErr || eErr || pErr) return;

    if (!isNew) {
      if (userPassword) updateUserPassword(editingUserId, userPassword);
      alert("Password updated!");
      setEditingUserId(null);
    } else {
      createUser({ name: userName, email: userEmail, passwordHash: userPassword, role: userRole });
      alert(`Account for ${userName} registered!`);
    }

    setUserName(""); setUserEmail(""); setUserPassword("");
    setNameErr(""); setEmailErr(""); setPasswordErr("");
    setShowUserForm(false);
  };

  const inputCls = (err: string) =>
    `w-full p-2 bg-stone-50 dark:bg-stone-955 border rounded-xl text-stone-900 dark:text-stone-200 ${
      err ? "border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400" : "border-stone-200 dark:border-stone-800"
    }`;

  return (
    <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
        <div>
          <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Cashier &amp; Staff Accounts</h2>
          <p className="text-stone-500 mt-0.5">Manage credentials, toggle roles and archive staff access.</p>
        </div>
        <button
          onClick={() => {
            setEditingUserId(null);
            setUserName(""); setUserEmail(""); setUserPassword(""); setUserRole("employee");
            setNameErr(""); setEmailErr(""); setPasswordErr("");
            setShowUserForm(true);
          }}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-colors"
        >
          + Add Employee Account
        </button>
      </div>

      {showUserForm && (
        <form onSubmit={handleUserSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-sm animate-fade-in">
          <h3 className="font-extrabold text-sm border-b border-stone-100 pb-2">
            {editingUserId !== null ? "Change Password" : "Register Employee Account"}
          </h3>
          <div className="space-y-3">
            {editingUserId === null && (
              <>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Employee Name</label>
                  <input
                    type="text" value={userName}
                    onChange={(e) => { setUserName(e.target.value); setNameErr(""); }}
                    placeholder="e.g. Cashier Sarah"
                    className={inputCls(nameErr)}
                  />
                  {nameErr && <p className="text-red-500 text-[11px] mt-0.5">{nameErr}</p>}
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Email Address</label>
                  <input
                    type="text" value={userEmail}
                    onChange={(e) => { setUserEmail(e.target.value); setEmailErr(""); }}
                    placeholder="sarah@cafepos.com"
                    className={inputCls(emailErr)}
                  />
                  {emailErr && <p className="text-red-500 text-[11px] mt-0.5">{emailErr}</p>}
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Staff Access Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                  >
                    <option value="employee">Employee / Cashier</option>
                    <option value="admin">User / Admin</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-stone-400 font-bold mb-1">
                {editingUserId !== null ? "Enter New Password" : "Login Password"}
              </label>
              <input
                type="password" value={userPassword}
                onChange={(e) => { setUserPassword(e.target.value); setPasswordErr(""); }}
                placeholder="Min. 8 characters"
                className={inputCls(passwordErr)}
              />
              {passwordErr && <p className="text-red-500 text-[11px] mt-0.5">{passwordErr}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow">
              Save Account
            </button>
            <button
              type="button"
              onClick={() => { setShowUserForm(false); setNameErr(""); setEmailErr(""); setPasswordErr(""); }}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List of user accounts */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-150 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
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
                  <td className="px-6 py-4 font-bold text-stone-850 dark:text-stone-200">{u.name}</td>
                  <td className="px-6 py-4 text-stone-500">{u.email}</td>
                  <td className="px-6 py-4 capitalize font-semibold">{u.role}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      u.isArchived ? "bg-red-500/15 text-danger" : "bg-green-500/15 text-success"
                    }`}>
                      {u.isArchived ? "Archived" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingUserId(u.id);
                        setUserPassword(""); setPasswordErr("");
                        setShowUserForm(true);
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded font-bold text-[10px] transition-colors"
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => toggleArchiveUser(u.id)}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded font-bold text-[10px] transition-colors"
                    >
                      {u.isArchived ? "Active" : "Archive"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete account for ${u.name}?`)) deleteUser(u.id);
                      }}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded font-bold text-[10px] transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// export default function UsersPage() {
//   const {
//     users,
//     createUser,
//     updateUserPassword,
//     toggleArchiveUser,
//     deleteUser
//   } = useApp();

//   // Employee CRUD states
//   const [showUserForm, setShowUserForm] = useState(false);
//   const [userName, setUserName] = useState("");
//   const [userEmail, setUserEmail] = useState("");
//   const [userPassword, setUserPassword] = useState("");
//   const [userRole, setUserRole] = useState<"admin" | "employee">("employee");
//   const [editingUserId, setEditingUserId] = useState<string | null>(null);

//   const handleUserSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!userName || !userEmail || (!editingUserId && !userPassword)) return;

//     if (editingUserId !== null) {
//       if (userPassword) {
//         updateUserPassword(editingUserId, userPassword);
//       }
//       alert("Password updated!");
//       setEditingUserId(null);
//     } else {
//       createUser({
//         name: userName,
//         email: userEmail,
//         passwordHash: userPassword,
//         role: userRole
//       });
//       alert(`Account for ${userName} registered!`);
//     }

//     setUserName("");
//     setUserEmail("");
//     setUserPassword("");
//     setShowUserForm(false);
//   };

//   return (
//     <div className="space-y-6 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
//       <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-850 pb-4">
//         <div>
//           <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Cashier & Staff Accounts</h2>
//           <p className="text-stone-500 mt-0.5">Manage credentials, toggle roles and archive staff access.</p>
//         </div>
//         <button
//           onClick={() => {
//             setEditingUserId(null);
//             setUserName("");
//             setUserEmail("");
//             setUserPassword("");
//             setUserRole("employee");
//             setShowUserForm(true);
//           }}
//           className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-colors"
//         >
//           + Add Employee Account
//         </button>
//       </div>

//       {showUserForm && (
//         <form onSubmit={handleUserSubmit} className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md space-y-4 max-w-sm animate-fade-in">
//           <h3 className="font-extrabold text-sm border-b border-stone-100 pb-2">
//             {editingUserId !== null ? "Change Password" : "Register Employee Account"}
//           </h3>
//           <div className="space-y-3">
//             {editingUserId === null && (
//               <>
//                 <div>
//                   <label className="block text-stone-400 font-bold mb-1">Employee Name</label>
//                   <input
//                     type="text"
//                     value={userName}
//                     onChange={(e) => setUserName(e.target.value)}
//                     placeholder="e.g. Cashier Sarah"
//                     className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-200"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-stone-400 font-bold mb-1">Email Address</label>
//                   <input
//                     type="email"
//                     value={userEmail}
//                     onChange={(e) => setUserEmail(e.target.value)}
//                     placeholder="sarah@cafepos.com"
//                     className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-200"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-stone-400 font-bold mb-1">Staff Access Role</label>
//                   <select
//                     value={userRole}
//                     onChange={(e) => setUserRole(e.target.value as any)}
//                     className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
//                   >
//                     <option value="employee">Employee / Cashier</option>
//                     <option value="admin">User / Admin</option>
//                   </select>
//                 </div>
//               </>
//             )}
//             <div>
//               <label className="block text-stone-400 font-bold mb-1">
//                 {editingUserId !== null ? "Enter New Password" : "Login Password"}
//               </label>
//               <input
//                 type="password"
//                 value={userPassword}
//                 onChange={(e) => setUserPassword(e.target.value)}
//                 placeholder="••••••••"
//                 className="w-full p-2 bg-stone-50 dark:bg-stone-955 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-200"
//                 required={editingUserId === null}
//               />
//             </div>
//           </div>

//           <div className="flex gap-2">
//             <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow">
//               Save Account
//             </button>
//             <button
//               type="button"
//               onClick={() => setShowUserForm(false)}
//               className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold rounded-xl hover:bg-stone-200 transition-colors"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       )}

//       {/* List of user accounts */}
//       <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-150 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
//                 <th className="px-6 py-4">Employee Name</th>
//                 <th className="px-6 py-4">Login Email</th>
//                 <th className="px-6 py-4">Access Role</th>
//                 <th className="px-6 py-4">Status</th>
//                 <th className="px-6 py-4 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
//               {users.map((u) => (
//                 <tr key={u.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/10 transition-colors">
//                   <td className="px-6 py-4 font-bold text-stone-850 dark:text-stone-200">{u.name}</td>
//                   <td className="px-6 py-4 text-stone-500">{u.email}</td>
//                   <td className="px-6 py-4 capitalize font-semibold">{u.role}</td>
//                   <td className="px-6 py-4">
//                     <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
//                       u.isArchived ? "bg-red-500/15 text-danger" : "bg-green-500/15 text-success"
//                     }`}>
//                       {u.isArchived ? "Archived" : "Active"}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-right space-x-2">
//                     <button
//                       onClick={() => {
//                         setEditingUserId(u.id);
//                         setUserPassword("");
//                         setShowUserForm(true);
//                       }}
//                       className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded font-bold text-[10px] transition-colors"
//                     >
//                       Pass
//                     </button>
//                     <button
//                       onClick={() => toggleArchiveUser(u.id)}
//                       className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded font-bold text-[10px] transition-colors"
//                     >
//                       {u.isArchived ? "Active" : "Archive"}
//                     </button>
//                     <button
//                       onClick={() => {
//                         if (confirm(`Delete account for ${u.name}?`)) {
//                           deleteUser(u.id);
//                         }
//                       }}
//                       className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-danger rounded font-bold text-[10px] transition-colors"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

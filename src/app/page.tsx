"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";

export default function Home() {
  const router = useRouter();
  const {
    currentUser,
    activeSession,
    sessionsList,
    login,
    signup,
    logout,
    openSession,
    closeSession
  } = useApp();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [openingBalance, setOpeningBalance] = useState("50.00");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isLogin) {
      const successLogin = login(email, password);
      if (successLogin) {
        setSuccess("Logged in successfully!");
      } else {
        setError("Invalid email or password. Try the demo credentials below.");
      }
    } else {
      if (!name || !email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      const successSignup = signup(name, email, password);
      if (successSignup) {
        setSuccess("Account created successfully!");
      } else {
        setError("Email already in use.");
      }
    }
  };

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(openingBalance);
    if (isNaN(bal) || bal < 0) {
      setError("Please enter a valid positive balance.");
      return;
    }
    openSession(bal);
    router.push("/terminal");
  };

  // Find last closed session
  const closedSessions = sessionsList.filter((s) => s.status === "closed");
  const lastSession = closedSessions.length > 0
    ? closedSessions[closedSessions.length - 1]
    : null;

  return (
    <main className="flex-1 min-h-screen flex items-center justify-center p-6 cafe-pattern">
      <div className="w-full max-w-md animate-fade-in">
        {/* Cafe branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white text-3xl font-extrabold shadow-lg mb-3">
            ☕
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary dark:text-amber-500">
            Odoo Cafe POS
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Premium Restaurant Point-of-Sale System
          </p>
        </div>

        {/* Dynamic Card Container */}
        <div className="glass-panel rounded-3xl p-8 glow-primary border-stone-200 dark:border-stone-800">
          {!currentUser ? (
            <div>
              {/* Login / Signup Tabs */}
              <div className="flex border-b border-stone-200 dark:border-stone-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 pb-3 text-center font-semibold text-lg transition-colors ${
                    isLogin
                      ? "text-primary dark:text-amber-500 border-b-2 border-primary dark:border-amber-500"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 pb-3 text-center font-semibold text-lg transition-colors ${
                    !isLogin
                      ? "text-primary dark:text-amber-500 border-b-2 border-primary dark:border-amber-500"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Success / Error Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-danger text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-success text-sm font-medium">
                  ✅ {success}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-stone-900 dark:text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@cafepos.com"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-stone-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-stone-900 dark:text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  {isLogin ? "Authenticate & Enter" : "Register Account"}
                </button>
              </form>

              {/* Demo Credentials Box */}
              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 space-y-2">
                <p className="font-bold text-stone-700 dark:text-stone-300">🔑 Demo Logins:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-stone-100 dark:bg-stone-900 rounded-lg">
                    <p className="font-semibold text-stone-600 dark:text-stone-400">Admin Role:</p>
                    <p>admin@cafepos.com</p>
                    <p>admin123</p>
                  </div>
                  <div className="p-2 bg-stone-100 dark:bg-stone-900 rounded-lg">
                    <p className="font-semibold text-stone-600 dark:text-stone-400">Cashier Role:</p>
                    <p>john@cafepos.com</p>
                    <p>cashier123</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Session Opener Launcher Screen
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Logged in as</p>
                  <p className="font-bold text-stone-800 dark:text-stone-200">{currentUser.name}</p>
                  <span className="inline-block px-2 py-0.5 mt-1 text-[10px] uppercase font-bold tracking-wider rounded bg-primary/10 text-primary dark:bg-amber-500/20 dark:text-amber-400">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 rounded-xl transition-colors dark:border-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  Logout
                </button>
              </div>

              {/* Last closed session stats */}
              {lastSession ? (
                <div className="mb-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                  <h3 className="font-bold text-stone-700 dark:text-amber-500 text-sm">Last Session Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-stone-500 block">Closed At</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {new Date(lastSession.closedAt || "").toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Closing Balance</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        ${lastSession.closingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-stone-100 dark:bg-stone-900 rounded-2xl text-center text-xs text-stone-500">
                  No previous closed sessions found in current logs.
                </div>
              )}

              {/* Active Session Status */}
              {activeSession ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                    <p className="text-sm font-semibold text-success">POS Session is Currently Open</p>
                    <p className="text-xs text-stone-500 mt-1">Opened on {new Date(activeSession.openedAt).toLocaleString()}</p>
                  </div>

                  <button
                    onClick={() => router.push("/terminal")}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-md text-center block"
                  >
                    Resume POS Terminal
                  </button>

                  <button
                    onClick={closeSession}
                    className="w-full py-3 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold rounded-xl transition-all text-center block"
                  >
                    Close Current Session
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOpenSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      Opening Cash Register Balance ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 text-stone-900 dark:text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
                  >
                    🚀 Open POS Session
                  </button>
                </form>
              )}

              {/* Direct links to other screens for demo */}
              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 text-center space-y-3">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Fixed System Viewports</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/kitchen")}
                    className="flex-1 py-2 text-xs font-semibold border border-stone-200 hover:bg-stone-100 rounded-xl transition-colors dark:border-stone-800 dark:hover:bg-stone-900"
                  >
                    🖥️ Kitchen KDS
                  </button>
                  {currentUser.role === "admin" && (
                    <button
                      onClick={() => router.push("/backend")}
                      className="flex-1 py-2 text-xs font-semibold border border-stone-200 hover:bg-stone-100 rounded-xl transition-colors dark:border-stone-800 dark:hover:bg-stone-900"
                    >
                      ⚙️ Admin Panel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

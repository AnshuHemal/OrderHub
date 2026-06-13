function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://order-hub-backend.vercel.app';

export const signIn = {
  email: async ({ email, password }: any) => {
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: { message: json.message || "Invalid credentials" } };
      }
      const data = 'data' in json ? json.data : json;
      if (data.accessToken) {
        setCookie("session_token", data.accessToken);
      }
      return { data };
    } catch (err: any) {
      return { error: { message: err.message || "Network error. Please try again." } };
    }
  },
  // Placeholders for social login compatibility
  social: async (options?: any) => {
    return { data: null, error: { message: "OAuth is not supported in the NestJS backend yet." } };
  }
};

export const signUp = {
  email: async ({ email, password, name }: any) => {
    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: { message: json.message || "Registration failed" } };
      }
      const data = 'data' in json ? json.data : json;
      if (data.accessToken) {
        setCookie("session_token", data.accessToken);
      }
      return { data };
    } catch (err: any) {
      return { error: { message: err.message || "Network error. Please try again." } };
    }
  }
};

export const signOut = async () => {
  deleteCookie("session_token");
  return { error: null };
};

export const useSession = () => {
  return { data: null, isPending: false, error: null, refetch: async () => {} };
};

export const getSession = async () => {
  return null;
};

export const emailOtp = {
  sendVerificationOtp: async (options?: any) => {
    return { error: { message: "Email OTP is not supported in this client." } };
  },
  verifyEmail: async (options?: any) => {
    return { error: { message: "Email verification is not supported in this client." } };
  },
  resetPassword: async (options?: any) => {
    return { error: { message: "Password reset is not supported in this client." } };
  }
};

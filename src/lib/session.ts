import { cookies } from "next/headers";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'KITCHEN';
  image?: string | null;
  createdAt?: string;
}

export interface Session {
  user: User;
  accessToken: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;

    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const user = 'data' in json ? json.data : json;
    
    return {
      user,
      accessToken: token,
    };
  } catch (err) {
    console.error("getSession error:", err);
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireSession(): Promise<Session> {
  const { redirect } = await import("next/navigation");
  const session = await getSession();
  if (!session) redirect("/login");
  return session as Session;
}

export async function requireUser(): Promise<User> {
  const session = await requireSession();
  return session.user;
}

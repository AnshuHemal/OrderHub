/**
 * Typed fetch wrapper for the OrderHub NestJS backend.
 * Base URL is read from NEXT_PUBLIC_API_URL (defaults to localhost:4000).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://order-hub-backend.vercel.app';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?:  HttpMethod;
  body?:    unknown;
  token?:   string;
  tags?:    string[];
  revalidate?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, tags, revalidate } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || getCookie('session_token');
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const fetchOpts: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    method,
    headers,
    credentials: 'include',
  };

  if (body !== undefined) fetchOpts.body = JSON.stringify(body);

  // Next.js 15+ cache options
  if (tags || revalidate !== undefined) {
    fetchOpts.next = { ...(tags && { tags }), ...(revalidate !== undefined && { revalidate }) };
  }

  const res = await fetch(`${BASE}/api${path}`, fetchOpts);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err?.message ?? 'Request failed', err);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  // Unwrap { success, data, timestamp } envelope
  return ('data' in json ? json.data : json) as T;
}

// ── Convenience helpers ────────────────────────────────────────────────────────

export const api = {
  get:    <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
            request<T>(path, { ...opts, method: 'GET' }),
  post:   <T>(path: string, body: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
            request<T>(path, { ...opts, method: 'POST', body }),
  put:    <T>(path: string, body: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
            request<T>(path, { ...opts, method: 'PUT', body }),
  patch:  <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
            request<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
            request<T>(path, { ...opts, method: 'DELETE' }),
};

// ── Typed API surface ──────────────────────────────────────────────────────────

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';
export type OrderType   = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type ItemStatus  = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

export interface Table {
  id: string; number: string; seats: number;
  shape: string; status: TableStatus;
  posX: number; posY: number; width: number; height: number;
  color?: string; floorId: string;
}

export interface Floor {
  id: string; name: string; position: number;
  tables: Table[];
}

export interface Category {
  id: string; name: string; icon?: string; color?: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string; name: string; price: number;
  description?: string; image?: string;
  isAvailable: boolean; isPopular: boolean;
  categoryId: string;
}

export interface OrderItem {
  id: string; menuItemId: string; quantity: number;
  unitPrice: number; notes?: string; status: ItemStatus;
  menuItem: Pick<MenuItem, 'id' | 'name' | 'price'> & { category: { name: string } };
}

export interface Order {
  id: string; type: OrderType; status: OrderStatus;
  subtotal: number; tax: number; tip: number; discount: number; total: number;
  notes?: string; createdAt: string;
  table?: Pick<Table, 'id' | 'number'>;
  staff: { id: string; name: string };
  items: OrderItem[];
  payment?: { method: string; amount: number; paidAt: string };
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

// ==========================================
// TypeScript Interfaces
// ==========================================

export type UserRole = "admin" | "employee" | "OWNER" | "MANAGER" | "STAFF" | "KITCHEN";
export type SessionStatus = "open" | "closed";
export type OrderStatus = "draft" | "paid" | "cancelled" | "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";
export type KitchenStage = "to_cook" | "preparing" | "completed" | "PENDING" | "PREPARING" | "READY" | "SERVED";
export type DiscountType = "percentage" | "fixed";
export type PromoType = "product" | "order";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain-text for mock
  role: UserRole;
  isArchived: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isActive?: boolean;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string | null;
  price: number;
  unitOfMeasure: string;
  taxPercentage: number;
  description: string;
  isActive: boolean;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: "cash" | "card" | "upi";
  upiId: string | null;
  isEnabled: boolean;
}

export interface Floor {
  id: string;
  name: string;
}

export interface Table {
  id: string;
  floorId: string;
  tableNumber: string;
  seats: number;
  isActive: boolean;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  promoType: PromoType;
  targetProductId: string | null;
  minQuantity: number | null;
  minOrderAmount: number | null;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
}

export interface PosSession {
  id: number;
  openedBy: string;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  closingBalance: number;
  status: SessionStatus;
}

export interface OrderItem {
  id: string; // Client unique id (like prod-uuid)
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: KitchenStage;
  completedAt?: string;
}

export interface Order {
  id: string;
  sessionId: number;
  tableId: string | null;
  customerId: string | null;
  employeeId: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  discounts: number;
  appliedPromoId: string | null;
  appliedPromoName: string | null;
  appliedCouponCode: string | null;
  total: number;
  status: OrderStatus;
  paymentMethodId: number | null;
  paymentReference: string | null;
  items: OrderItem[];
  createdAt: string;
  notes?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  tableId: string;
  bookingTime: string;
  guestsCount: number;
  status: BookingStatus;
  notes: string;
}

// ==========================================
// Context Type Definition
// ==========================================

interface AppContextType {
  // Session / Authentication
  currentUser: User | null;
  activeSession: PosSession | null;
  sessionsList: PosSession[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  openSession: (amount: number) => void;
  closeSession: () => void;
  
  // Data Tables
  users: User[];
  categories: Category[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  floors: Floor[];
  tables: Table[];
  customers: Customer[];
  coupons: Coupon[];
  promotions: Promotion[];
  orders: Order[];
  bookings: Booking[];

  // User/Employee Actions
  createUser: (user: Omit<User, "id" | "isArchived">) => void;
  updateUserPassword: (id: string, pass: string) => void;
  toggleArchiveUser: (id: string) => void;
  deleteUser: (id: string) => void;

  // Product & Category Actions
  createProduct: (prod: Omit<Product, "id" | "isActive">) => void;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  createCategory: (cat: Omit<Category, "id">) => Category;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Floor & Table Actions
  createFloor: (name: string) => void;
  createTable: (table: Omit<Table, "id" | "isActive" | "status">) => void;
  toggleTableStatus: (id: string) => void;

  // Coupon & Promo Actions
  createCoupon: (coupon: Omit<Coupon, "id" | "isActive">) => Promise<void>;
  toggleCouponActive: (id: string) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  createPromotion: (promo: Omit<Promotion, "id" | "isActive">) => Promise<void>;
  togglePromoActive: (id: string) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

  // Payment Setup Actions
  togglePaymentMethod: (id: number) => void;
  saveUpiId: (id: number, upiId: string) => void;

  // Customer Actions
  createCustomer: (cust: Omit<Customer, "id">) => Promise<Customer | undefined>;
  updateCustomer: (id: string, cust: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Booking Actions
  createBooking: (booking: Omit<Booking, "id">) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;

  // Order workflow
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  loadTableOrder: (tableId: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  applyManualCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  linkCustomerToOrder: (customerId: string | null) => void;
  sendOrderToKitchen: () => void;
  processOrderPayment: (methodId: number, ref?: string) => void;
  cancelDraftOrder: (id: string) => void;
  editDraftOrder: (id: string) => void;
  createNewOrder: (tableId: string | null) => void;

  // KDS transitions
  updateKdsStage: (orderId: string, stage: KitchenStage) => void;
  toggleKdsItemComplete: (orderId: string, itemId: string) => void;

  // Reset helper for fresh start
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Seed Data matching SQL
// ==========================================

const SEED_USERS: User[] = [
  { id: "1", name: "Admin User", email: "admin@cafepos.com", passwordHash: "admin123", role: "admin", isArchived: false },
  { id: "2", name: "Cashier John", email: "john@cafepos.com", passwordHash: "cashier123", role: "employee", isArchived: false },
  { id: "3", name: "Hemal User", email: "hemal@gmail.com", passwordHash: "Hemu@123", role: "admin", isArchived: false }
];

const SEED_CATEGORIES: Category[] = [
  { id: "1", name: "Hot Beverages", color: "#EF4444" },
  { id: "2", name: "Cold Beverages", color: "#3B82F6" },
  { id: "3", name: "Snacks", color: "#F59E0B" },
  { id: "4", name: "Desserts", color: "#EC4899" },
  { id: "5", name: "Bakery", color: "#10B981" }
];

const SEED_PRODUCTS: Product[] = [
  { id: "1", name: "Espresso", categoryId: "1", price: 3.50, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Rich shot of double espresso", isActive: true },
  { id: "2", name: "Cappuccino", categoryId: "1", price: 4.50, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Espresso with steamed milk foam", isActive: true },
  { id: "3", name: "Iced Latte", categoryId: "2", price: 4.80, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Cold milk over ice, with espresso", isActive: true },
  { id: "4", name: "Avocado Toast", categoryId: "3", price: 7.50, unitOfMeasure: "per piece", taxPercentage: 8.00, description: "Sourdough with mashed avocado and chilli flakes", isActive: true },
  { id: "5", name: "Chocolate Brownie", categoryId: "4", price: 3.80, unitOfMeasure: "per piece", taxPercentage: 10.00, description: "Warm fudge chocolate brownie", isActive: true },
  { id: "6", name: "Croissant", categoryId: "5", price: 3.20, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Flaky butter croissant", isActive: true }
];

const SEED_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, name: "Cash", type: "cash", upiId: null, isEnabled: true },
  { id: 2, name: "Card/Digital", type: "card", upiId: null, isEnabled: true },
  { id: 3, name: "UPI QR", type: "upi", upiId: "cafe@ybl", isEnabled: true }
];

const SEED_FLOORS: Floor[] = [
  { id: "1", name: "Ground Floor" },
  { id: "2", name: "Rooftop Lounge" }
];

const SEED_TABLES: Table[] = [
  { id: "1", floorId: "1", tableNumber: "T-101", seats: 2, isActive: true, status: "AVAILABLE" },
  { id: "2", floorId: "1", tableNumber: "T-102", seats: 4, isActive: true, status: "AVAILABLE" },
  { id: "3", floorId: "1", tableNumber: "T-103", seats: 4, isActive: true, status: "AVAILABLE" },
  { id: "4", floorId: "1", tableNumber: "T-104", seats: 6, isActive: true, status: "AVAILABLE" },
  { id: "5", floorId: "2", tableNumber: "RT-201", seats: 2, isActive: true, status: "AVAILABLE" },
  { id: "6", floorId: "2", tableNumber: "RT-202", seats: 4, isActive: true, status: "AVAILABLE" }
];

const SEED_COUPONS: Coupon[] = [
  { id: "1", code: "WELCOME10", discountType: "percentage", discountValue: 10.00, isActive: true },
  { id: "2", code: "FLAT5", discountType: "fixed", discountValue: 5.00, isActive: true }
];

const SEED_PROMOTIONS: Promotion[] = [
  { id: "1", name: "Coffee Combo Promo (3+ Espresso 15% off)", promoType: "product", targetProductId: "1", minQuantity: 3, minOrderAmount: null, discountType: "percentage", discountValue: 15.00, isActive: true },
  { id: "2", name: "Large Order Promo ($30+ off $5)", promoType: "order", targetProductId: null, minQuantity: null, minOrderAmount: 30.00, discountType: "fixed", discountValue: 5.00, isActive: true }
];

const SEED_CUSTOMERS: Customer[] = [
  { id: "1", name: "Sarah Connor", email: "sarah@terminator.com", phone: "+1 555 1234" },
  { id: "2", name: "Bruce Wayne", email: "bruce@batman.com", phone: "+1 999 8888" }
];

const SEED_BOOKINGS: Booking[] = [
  { id: "1", customerId: "1", tableId: "2", bookingTime: "2026-06-13T19:00:00", guestsCount: 4, status: "confirmed", notes: "Prefers window table" }
];

// ==========================================
// Context Provider Component
// ==========================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<PosSession | null>(null);
  const [sessionsList, setSessionsList] = useState<PosSession[]>([]);

  // Database lists
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // POS Order view cart helper
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  // 1. Initial State Loading from LocalStorage or Seeds
  useEffect(() => {
    if (typeof window !== "undefined") {
      const getOrSeed = <T,>(key: string, seed: T): T => {
        const item = localStorage.getItem(`odoopos_${key}`);
        if (item) {
          try {
            return JSON.parse(item) as T;
          } catch {
            return seed;
          }
        }
        localStorage.setItem(`odoopos_${key}`, JSON.stringify(seed));
        return seed;
      };

      setPaymentMethods(getOrSeed<PaymentMethod[]>("payment_methods", SEED_PAYMENT_METHODS));
      setCoupons([]);
      setPromotions([]);
      setBookings(getOrSeed<Booking[]>("bookings", SEED_BOOKINGS));
      setSessionsList(getOrSeed<PosSession[]>("sessions_list", []));

      const sess = localStorage.getItem("odoopos_active_session");
      if (sess) {
        try {
          setActiveSession(JSON.parse(sess));
        } catch {}
      }

      // Initial Auth Sync from Backend Cookie
      const initAuth = async () => {
        try {
          const profile = await api.get<any>('/auth/me');
          if (profile) {
            setCurrentUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              passwordHash: "",
              role: profile.role,
              isArchived: false
            });
          } else {
            setCurrentUser(null);
          }
        } catch {
          setCurrentUser(null);
        } finally {
          setLoading(false);
        }
      };
      initAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Sync state helpers
  const saveState = <T,>(key: string, data: T) => {
    localStorage.setItem(`odoopos_${key}`, JSON.stringify(data));
  };

  // Sync local-only variables to localStorage
  useEffect(() => { if (paymentMethods.length > 0) saveState("payment_methods", paymentMethods); }, [paymentMethods]);
  useEffect(() => { if (bookings.length > 0) saveState("bookings", bookings); }, [bookings]);
  useEffect(() => { saveState("sessions_list", sessionsList); }, [sessionsList]);

  // Sync state in real-time across tabs/windows on storage change
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "odoopos_payment_methods" && e.newValue) {
        try {
          setPaymentMethods(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Active Session local sync
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("odoopos_active_session", JSON.stringify(activeSession));
    } else {
      localStorage.removeItem("odoopos_active_session");
    }
  }, [activeSession]);

  // Fetching helpers for backend resources
  const fetchFloorsAndTables = async () => {
    try {
      const floorsData = await api.get<any[]>('/floors');
      setFloors(floorsData.map(f => ({ id: f.id, name: f.name })));
      const flatTables = floorsData.flatMap(f => (f.tables || []).map((t: any) => ({
        id: t.id,
        floorId: f.id,
        tableNumber: t.number,
        seats: t.seats,
        isActive: true, // Keep interactive so cashiers can manage occupied or dirty tables
        status: t.status
      })));
      setTables(flatTables);
    } catch (err) {
      console.error("fetchFloorsAndTables error:", err);
    }
  };

  const fetchMenu = async () => {
    try {
      const isUserAdmin = currentUser?.role === 'admin' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER';
      const path = isUserAdmin ? '/menu/categories/admin' : '/menu/categories';
      const categoriesData = await api.get<any[]>(path);
      
      setCategories(categoriesData.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color || "#EF4444",
        isActive: c.isActive
      })));

      let flatItems: any[] = [];
      if (isUserAdmin) {
        flatItems = await api.get<any[]>('/menu/items');
      } else {
        flatItems = categoriesData.flatMap(c => (c.items || []));
      }

      setProducts(flatItems.map(item => ({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        price: item.price,
        unitOfMeasure: "per piece",
        taxPercentage: 5.00,
        description: item.description || "",
        isActive: item.isAvailable
      })));
    } catch (err) {
      console.error("fetchMenu error:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const ordersData = await api.get<any[]>('/orders');
      const mappedOrders: Order[] = ordersData.map(o => ({
        id: o.id,
        sessionId: activeSession ? activeSession.id : 0,
        tableId: o.tableId,
        customerId: null,
        employeeId: o.staffId,
        orderNumber: `ORD-${o.id.substring(0, 8).toUpperCase()}`,
        subtotal: o.subtotal,
        tax: o.tax,
        discounts: o.discount,
        appliedPromoId: null,
        appliedPromoName: null,
        appliedCouponCode: null,
        total: o.total,
        status: o.status === 'PAID' ? 'paid' : o.status === 'CANCELLED' ? 'cancelled' : 'draft',
        paymentMethodId: o.payment ? (o.payment.method === 'CASH' ? 1 : o.payment.method === 'CARD' ? 2 : 3) : null,
        paymentReference: o.payment ? o.payment.reference : null,
        items: (o.items || []).map((it: any) => ({
          id: it.id,
          productId: it.menuItemId,
          name: it.menuItem ? it.menuItem.name : "Item",
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxPercentage: 5.00,
          taxAmount: it.unitPrice * it.quantity * 0.05,
          discountAmount: 0,
          total: it.unitPrice * it.quantity * 1.05,
          status: it.status === 'PENDING' ? 'to_cook' : it.status === 'PREPARING' ? 'preparing' : 'completed',
          completedAt: it.status === 'READY' || it.status === 'SERVED' ? new Date().toISOString() : undefined
        })),
        createdAt: o.createdAt
      }));
      setOrders(mappedOrders);
    } catch (err) {
      console.error("fetchOrders error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await api.get<any[]>('/users');
      setUsers(usersData.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: "",
        role: u.role,
        isArchived: false
      })));
    } catch (err) {
      console.error("fetchUsers error:", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await api.get<any[]>('/customers');
      setCustomers(data.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || ""
      })));
    } catch (err) {
      console.error("fetchCustomers error:", err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await api.get<Coupon[]>('/coupons');
      setCoupons(data);
    } catch (err) {
      console.error("fetchCoupons error:", err);
    }
  };

  const fetchPromotions = async () => {
    try {
      const data = await api.get<Promotion[]>('/promotions');
      setPromotions(data);
    } catch (err) {
      console.error("fetchPromotions error:", err);
    }
  };

  // Synchronize dynamic backend tables upon authenticated session
  useEffect(() => {
    if (currentUser) {
      const loadAllData = async () => {
        const isAdmin = currentUser.role === "admin" || currentUser.role === "OWNER" || currentUser.role === "MANAGER";
        await Promise.all([
          fetchFloorsAndTables(),
          fetchMenu(),
          fetchOrders(),
          fetchCustomers(),
          fetchCoupons(),
          fetchPromotions(),
          ...(isAdmin ? [fetchUsers()] : [])
        ]);
      };
      loadAllData();
      const interval = setInterval(loadAllData, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);
  // ==========================================
  // Helper functions: Calculations
  // ==========================================
  
  const recalculateOrderTotals = (order: Order): Order => {
    let subtotal = 0;
    let tax = 0;

    // First, calculate line totals (with taxes and any item-level logic)
    const items = order.items.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineTax = lineSubtotal * (item.taxPercentage / 100);
      subtotal += lineSubtotal;
      tax += lineTax;
      
      return {
        ...item,
        taxAmount: Number(lineTax.toFixed(2)),
        total: Number((lineSubtotal + lineTax).toFixed(2))
      };
    });

    let discountAmount = 0;
    let promoId: string | null = null;
    let promoName: string | null = null;

    // Apply Automated Promotions
    // Check product-level promos
    const activePromos = promotions.filter(p => p.isActive);
    let bestDiscount = 0;

    activePromos.forEach((promo) => {
      if (promo.promoType === "product" && promo.targetProductId && promo.minQuantity) {
        const cartItem = items.find(it => it.productId === promo.targetProductId);
        if (cartItem && cartItem.quantity >= promo.minQuantity) {
          // Promo triggered!
          let promoVal = 0;
          if (promo.discountType === "percentage") {
            promoVal = (subtotal + tax) * (promo.discountValue / 100);
          } else {
            promoVal = promo.discountValue;
          }
          if (promoVal > bestDiscount) {
            bestDiscount = promoVal;
            promoId = promo.id;
            promoName = promo.name;
          }
        }
      } else if (promo.promoType === "order" && promo.minOrderAmount) {
        if (subtotal >= promo.minOrderAmount) {
          // Promo triggered!
          let promoVal = 0;
          if (promo.discountType === "percentage") {
            promoVal = (subtotal + tax) * (promo.discountValue / 100);
          } else {
            promoVal = promo.discountValue;
          }
          if (promoVal > bestDiscount) {
            bestDiscount = promoVal;
            promoId = promo.id;
            promoName = promo.name;
          }
        }
      }
    });

    discountAmount = bestDiscount;

    // Apply Manual Coupon Code (if coupon is present and promo didn't already deduct)
    // Coupons can stack or override, let's stack or take the coupon if it's better
    if (order.appliedCouponCode) {
      const coupon = coupons.find(c => c.code.toUpperCase() === order.appliedCouponCode?.toUpperCase() && c.isActive);
      if (coupon) {
        let couponVal = 0;
        if (coupon.discountType === "percentage") {
          couponVal = (subtotal + tax) * (coupon.discountValue / 100);
        } else {
          couponVal = coupon.discountValue;
        }
        discountAmount += couponVal; // Accumulate or override? Let's stack for maximum user utility.
      }
    }

    const total = Math.max(0, subtotal + tax - discountAmount);

    return {
      ...order,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      discounts: Number(discountAmount.toFixed(2)),
      appliedPromoId: promoId,
      appliedPromoName: promoName,
      total: Number(total.toFixed(2))
    };
  };

  // ==========================================
  // Auth Functions
  // ==========================================

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://order-hub-backend.vercel.app'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const json = await res.json();
      if (!res.ok) return false;
      const data = 'data' in json ? json.data : json;
      if (data.accessToken) {
        document.cookie = `session_token=${encodeURIComponent(data.accessToken)}; path=/; SameSite=Lax; max-age=604800`;
        const profile = await api.get<any>('/auth/me');
        if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            passwordHash: "",
            role: profile.role,
            isArchived: false
          });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("login error:", err);
      return false;
    }
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://order-hub-backend.vercel.app'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, name }),
      });
      const json = await res.json();
      if (!res.ok) return false;
      const data = 'data' in json ? json.data : json;
      if (data.accessToken) {
        document.cookie = `session_token=${encodeURIComponent(data.accessToken)}; path=/; SameSite=Lax; max-age=604800`;
        const profile = await api.get<any>('/auth/me');
        if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            passwordHash: "",
            role: profile.role,
            isArchived: false
          });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("signup error:", err);
      return false;
    }
  };

  const logout = () => {
    document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    setCurrentUser(null);
    setActiveSession(null);
    setCurrentOrder(null);
  };

  // ==========================================
  // Session Functions
  // ==========================================

  const openSession = (amount: number) => {
    if (!currentUser) return;
    const newSession: PosSession = {
      id: sessionsList.length > 0 ? Math.max(...sessionsList.map(s => s.id)) + 1 : 1,
      openedBy: currentUser.id,
      openedAt: new Date().toISOString(),
      closedAt: null,
      openingBalance: amount,
      closingBalance: 0,
      status: "open"
    };

    setActiveSession(newSession);
    setSessionsList(prev => [...prev, newSession]);
  };

  const closeSession = () => {
    if (!activeSession) return;

    // Calculate closing sales total
    const currentSessionOrders = orders.filter(
      o => o.sessionId === activeSession.id && o.status === "paid"
    );
    const totalSales = currentSessionOrders.reduce((sum, o) => sum + o.total, 0);
    const closingAmount = activeSession.openingBalance + totalSales;

    const updatedSession: PosSession = {
      ...activeSession,
      closedAt: new Date().toISOString(),
      closingBalance: closingAmount,
      status: "closed"
    };

    setActiveSession(null);
    setSessionsList(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };  // ==========================================
  // User/Employee Actions
  // ==========================================

  const createUser = async (user: Omit<User, "id" | "isArchived">) => {
    try {
      await api.post('/auth/register', {
        email: user.email,
        password: user.passwordHash,
        name: user.name,
        role: user.role
      });
      await fetchUsers();
    } catch (err) {
      console.error("createUser error:", err);
    }
  };

  const updateUserPassword = async (id: string, pass: string) => {
    console.warn("Password update not supported on backend for user:", id);
  };

  const toggleArchiveUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Product & Category Actions
  // ==========================================

  const createProduct = async (prod: Omit<Product, "id" | "isActive">) => {
    try {
      if (!prod.categoryId) return;
      await api.post(`/menu/categories/${prod.categoryId}/items`, {
        name: prod.name,
        price: prod.price,
        description: prod.description
      });
      await fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const updateProduct = async (id: string, prod: Partial<Product>) => {
    try {
      await api.put(`/menu/items/${id}`, {
        name: prod.name,
        price: prod.price,
        description: prod.description
      });
      await fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/menu/items/${id}`);
      await fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const createCategory = (cat: Omit<Category, "id">): Category => {
    const tempId = `temp_${Date.now()}`;
    api.post<any>('/menu/categories', {
      name: cat.name,
      color: cat.color
    }).then(() => fetchMenu());

    return {
      id: tempId,
      name: cat.name,
      color: cat.color
    };
  };

  const updateCategory = async (id: string, cat: Partial<Category>) => {
    try {
      await api.put(`/menu/categories/${id}`, {
        name: cat.name,
        color: cat.color
      });
      await fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/menu/categories/${id}`);
      await fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Floor & Table Actions
  // ==========================================

  const createFloor = async (name: string) => {
    try {
      await api.post('/floors', { name });
      await fetchFloorsAndTables();
    } catch (err) {
      console.error(err);
    }
  };

  const createTable = async (table: Omit<Table, "id" | "isActive" | "status">) => {
    try {
      await api.post(`/floors/${table.floorId}/tables`, {
        number: table.tableNumber,
        seats: table.seats,
        shape: "SQUARE",
        posX: 0,
        posY: 0,
        width: 100,
        height: 100
      });
      await fetchFloorsAndTables();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTableStatus = async (id: string) => {
    try {
      const table = tables.find(t => t.id === id);
      if (!table) return;
      const nextStatus = table.status === 'DIRTY' ? 'AVAILABLE' : 'DIRTY';
      await api.patch(`/floors/tables/${id}/status`, { status: nextStatus });
      await fetchFloorsAndTables();
    } catch (err) {
      console.error(err);
    }
  };
  // ==========================================
  // Coupons & Promotions Setup Actions
  // ==========================================

  const createCoupon = async (coupon: Omit<Coupon, "id" | "isActive">): Promise<void> => {
    try {
      await api.post('/coupons', coupon);
      await fetchCoupons();
    } catch (err) {
      console.error("createCoupon error:", err);
    }
  };

  const toggleCouponActive = async (id: string): Promise<void> => {
    try {
      const c = coupons.find(x => x.id === id);
      if (c) {
        await api.put(`/coupons/${id}`, { isActive: !c.isActive });
        await fetchCoupons();
      }
    } catch (err) {
      console.error("toggleCouponActive error:", err);
    }
  };

  const createPromotion = async (promo: Omit<Promotion, "id" | "isActive">): Promise<void> => {
    try {
      await api.post("/promotions", promo);
      await fetchPromotions();
    } catch (err) {
      console.error("createPromotion error:", err);
    }
  };

  const togglePromoActive = async (id: string): Promise<void> => {
    try {
      const p = promotions.find(x => x.id === id);
      if (p) {
        await api.put(`/promotions/${id}`, { isActive: !p.isActive });
        await fetchPromotions();
      }
    } catch (err) {
      console.error("togglePromoActive error:", err);
    }
  };

  const deleteCoupon = async (id: string): Promise<void> => {
    try {
      await api.delete(`/coupons/${id}`);
      await fetchCoupons();
    } catch (err) {
      console.error("deleteCoupon error:", err);
    }
  };

  const deletePromotion = async (id: string): Promise<void> => {
    try {
      await api.delete(`/promotions/${id}`);
      await fetchPromotions();
    } catch (err) {
      console.error("deletePromotion error:", err);
    }
  };

  // ==========================================
  // Payment Setup Actions
  // ==========================================

  const togglePaymentMethod = (id: number) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, isEnabled: !p.isEnabled } : p));
  };

  const saveUpiId = (id: number, upiId: string) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, upiId } : p));
  };

  // ==========================================
  // Customer Actions
  // ==========================================

  const createCustomer = async (cust: Omit<Customer, "id">): Promise<Customer | undefined> => {
    try {
      const created = await api.post<any>('/customers', {
        name: cust.name,
        email: cust.email,
        phone: cust.phone || null
      });
      await fetchCustomers();
      return {
        id: created.id,
        name: created.name,
        email: created.email,
        phone: created.phone || ""
      };
    } catch (err) {
      console.error("createCustomer error:", err);
      return undefined;
    }
  };

  const updateCustomer = async (id: string, cust: Partial<Customer>): Promise<void> => {
    try {
      await api.put(`/customers/${id}`, {
        name: cust.name,
        email: cust.email,
        phone: cust.phone || null
      });
      await fetchCustomers();
    } catch (err) {
      console.error("updateCustomer error:", err);
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      await api.delete(`/customers/${id}`);
      await fetchCustomers();
    } catch (err) {
      console.error("deleteCustomer error:", err);
    }
  };

  // ==========================================
  // Bookings Actions
  // ==========================================

  const createBooking = (booking: Omit<Booking, "id">) => {
    const nextId = bookings.length > 0 ? String(Math.max(...bookings.map(b => parseInt(b.id) || 0)) + 1) : "1";
    const newBooking: Booking = {
      ...booking,
      id: nextId
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  // ==========================================
  // POS Cart / Order Workflow
  // ==========================================
  const createNewOrder = (tableId: string | null) => {
    if (!activeSession || !currentUser) return;

    // Check if there is already an active order for this table
    if (tableId) {
      const activeTableOrder = orders.find(
        o => o.tableId === tableId && o.status === "draft" && o.sessionId === activeSession.id
      );
      if (activeTableOrder) {
        setCurrentOrder(activeTableOrder);
        return;
      }
    }

    const orderNum = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, "0")}`;
    const newOrder: Order = {
      id: `temp_${Date.now()}`,
      sessionId: activeSession.id,
      tableId,
      customerId: null,
      employeeId: currentUser.id,
      orderNumber: orderNum,
      subtotal: 0,
      tax: 0,
      discounts: 0,
      appliedPromoId: null,
      appliedPromoName: null,
      appliedCouponCode: null,
      total: 0,
      status: "draft",
      paymentMethodId: null,
      paymentReference: null,
      items: [],
      createdAt: new Date().toISOString()
    };

    setCurrentOrder(newOrder);
    setOrders(prev => [...prev, newOrder]);
  };

  const loadTableOrder = (tableId: string) => {
    if (!activeSession) return;
    const tableOrder = orders.find(
      o => o.tableId === tableId && o.status === "draft" && o.sessionId === activeSession.id
    );
    if (tableOrder) {
      setCurrentOrder(tableOrder);
    } else {
      createNewOrder(tableId);
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (!currentOrder) return;

    const existingItemIdx = currentOrder.items.findIndex(it => it.productId === product.id);
    let updatedItems = [...currentOrder.items];

    if (existingItemIdx > -1) {
      const exist = updatedItems[existingItemIdx];
      updatedItems[existingItemIdx] = {
        ...exist,
        quantity: exist.quantity + quantity
      };
    } else {
      const newItem: OrderItem = {
        id: `item_${Date.now()}_${product.id}`,
        productId: product.id,
        name: product.name,
        quantity: quantity,
        unitPrice: product.price,
        taxPercentage: product.taxPercentage,
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
        status: "to_cook"
      };
      updatedItems.push(newItem);
    }

    const updatedOrder = recalculateOrderTotals({
      ...currentOrder,
      items: updatedItems
    });

    setCurrentOrder(updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (!currentOrder) return;

    let updatedItems = currentOrder.items
      .map((it) => {
        if (it.productId === productId) {
          return { ...it, quantity: qty };
        }
        return it;
      })
      .filter(it => it.quantity > 0);

    const updatedOrder = recalculateOrderTotals({
      ...currentOrder,
      items: updatedItems
    });

    setCurrentOrder(updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const applyManualCoupon = (code: string): { success: boolean; message: string } => {
    if (!currentOrder) return { success: false, message: "No active order." };

    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) {
      return { success: false, message: "Invalid coupon code." };
    }
    if (!coupon.isActive) {
      return { success: false, message: "This coupon is expired or inactive." };
    }

    const updatedOrder = recalculateOrderTotals({
      ...currentOrder,
      appliedCouponCode: coupon.code
    });

    setCurrentOrder(updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` };
  };

  const removeCoupon = () => {
    if (!currentOrder) return;
    const updatedOrder = recalculateOrderTotals({
      ...currentOrder,
      appliedCouponCode: null
    });
    setCurrentOrder(updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const linkCustomerToOrder = (customerId: string | null) => {
    if (!currentOrder) return;
    const updatedOrder = {
      ...currentOrder,
      customerId
    };
    setCurrentOrder(updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const sendOrderToKitchen = async () => {
    if (!currentOrder || currentOrder.items.length === 0) return;

    try {
      const isNewOrder = currentOrder.id.startsWith('temp_');
      if (isNewOrder) {
        await api.post<any>('/orders', {
          tableId: currentOrder.tableId,
          type: currentOrder.tableId ? 'DINE_IN' : 'TAKEAWAY',
          notes: currentOrder.notes || "",
          items: currentOrder.items.map(it => ({
            menuItemId: it.productId,
            quantity: it.quantity
          }))
        });
        
        await fetchOrders();
        await fetchFloorsAndTables();
        
        setCurrentOrder(null); // Clear active checkout cart
      } else {
        const newItems = currentOrder.items.filter(it => it.id.startsWith('item_'));
        if (newItems.length > 0) {
          await api.post(`/orders/${currentOrder.id}/items`, {
            items: newItems.map(it => ({
              menuItemId: it.productId,
              quantity: it.quantity
            }))
          });
        }
        await fetchOrders();
        const reloaded = await api.get<any>(`/orders/${currentOrder.id}`);
        if (reloaded) {
          setCurrentOrder(reloaded);
        }
      }
    } catch (err) {
      console.error("sendOrderToKitchen error:", err);
    }
  };

  const processOrderPayment = async (methodId: number, ref?: string) => {
    if (!currentOrder) return;

    try {
      const isNewOrder = currentOrder.id.startsWith('temp_');
      let orderId = currentOrder.id;

      if (isNewOrder) {
        const created = await api.post<any>('/orders', {
          tableId: currentOrder.tableId,
          type: currentOrder.tableId ? 'DINE_IN' : 'TAKEAWAY',
          notes: currentOrder.notes || "",
          items: currentOrder.items.map(it => ({
            menuItemId: it.productId,
            quantity: it.quantity
          }))
        });
        orderId = created.id;
      }

      const methodEnum = methodId === 1 ? 'CASH' : methodId === 2 ? 'CARD' : 'UPI';
      await api.post(`/orders/${orderId}/pay`, {
        method: methodEnum,
        reference: ref || "",
        tip: 0.00,
        discount: currentOrder.discounts
      });

      await fetchOrders();
      await fetchFloorsAndTables();
      setCurrentOrder(null);
    } catch (err) {
      console.error("processOrderPayment error:", err);
    }
  };

  const cancelDraftOrder = async (id: string) => {
    try {
      await api.delete(`/orders/${id}`);
      await fetchOrders();
      if (currentOrder && currentOrder.id === id) {
        setCurrentOrder(null);
      }
    } catch (err) {
      console.error("cancelDraftOrder error:", err);
    }
  };

  const editDraftOrder = (id: string) => {
    const draft = orders.find(o => o.id === id && o.status === "draft");
    if (draft) {
      setCurrentOrder(draft);
    }
  };

  // ==========================================
  // KDS transitions
  // ==========================================

  const updateKdsStage = async (orderId: string, stage: KitchenStage) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const backendStatus = stage === 'preparing' ? 'PREPARING' : stage === 'completed' ? 'READY' : 'PENDING';
      
      await Promise.all(order.items.map(item => 
        api.patch(`/orders/items/${item.id}/status`, { status: backendStatus })
      ));
      
      await api.patch(`/orders/${orderId}/status`, { status: backendStatus });
      await fetchOrders();
    } catch (err) {
      console.error("updateKdsStage error:", err);
    }
  };

  const toggleKdsItemComplete = async (orderId: string, itemId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const item = order.items.find(it => it.id === itemId);
      if (!item) return;

      const nextStatus = item.status === 'completed' ? 'PREPARING' : 'READY';
      await api.patch(`/orders/items/${itemId}/status`, { status: nextStatus });
      
      await fetchOrders();
    } catch (err) {
      console.error("toggleKdsItemComplete error:", err);
    }
  };
  const resetAllData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("odoopos_users");
      localStorage.removeItem("odoopos_categories");
      localStorage.removeItem("odoopos_products");
      localStorage.removeItem("odoopos_payment_methods");
      localStorage.removeItem("odoopos_floors");
      localStorage.removeItem("odoopos_tables");
      localStorage.removeItem("odoopos_customers");
      localStorage.removeItem("odoopos_coupons");
      localStorage.removeItem("odoopos_promotions");
      localStorage.removeItem("odoopos_orders");
      localStorage.removeItem("odoopos_bookings");
      localStorage.removeItem("odoopos_sessions_list");
      localStorage.removeItem("odoopos_current_user");
      localStorage.removeItem("odoopos_active_session");

      setUsers(SEED_USERS);
      setCategories(SEED_CATEGORIES);
      setProducts(SEED_PRODUCTS);
      setPaymentMethods(SEED_PAYMENT_METHODS);
      setFloors(SEED_FLOORS);
      setTables(SEED_TABLES);
      setCustomers(SEED_CUSTOMERS);
      setCoupons([]);
      setPromotions(SEED_PROMOTIONS);
      setOrders([]);
      setBookings(SEED_BOOKINGS);
      setSessionsList([]);
      setCurrentUser(null);
      setActiveSession(null);
      setCurrentOrder(null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeSession,
        loading,
        sessionsList,
        login,
        signup,
        logout,
        openSession,
        closeSession,
        users,
        categories,
        products,
        paymentMethods,
        floors,
        tables,
        customers,
        coupons,
        promotions,
        orders,
        bookings,
        createUser,
        updateUserPassword,
        toggleArchiveUser,
        deleteUser,
        createProduct,
        updateProduct,
        deleteProduct,
        createCategory,
        updateCategory,
        deleteCategory,
        createFloor,
        createTable,
        toggleTableStatus,
        createCoupon,
        toggleCouponActive,
        deleteCoupon,
        createPromotion,
        togglePromoActive,
        deletePromotion,
        togglePaymentMethod,
        saveUpiId,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createBooking,
        updateBookingStatus,
        currentOrder,
        setCurrentOrder,
        loadTableOrder,
        addToCart,
        updateCartQty,
        applyManualCoupon,
        removeCoupon,
        linkCustomerToOrder,
        sendOrderToKitchen,
        processOrderPayment,
        cancelDraftOrder,
        editDraftOrder,
        createNewOrder,
        updateKdsStage,
        toggleKdsItemComplete,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

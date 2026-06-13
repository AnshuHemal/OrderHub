"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// ==========================================
// TypeScript Interfaces
// ==========================================

export type UserRole = "admin" | "employee";
export type SessionStatus = "open" | "closed";
export type OrderStatus = "draft" | "paid" | "cancelled";
export type KitchenStage = "to_cook" | "preparing" | "completed";
export type DiscountType = "percentage" | "fixed";
export type PromoType = "product" | "order";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string; // Plain-text for mock
  role: UserRole;
  isArchived: boolean;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number | null;
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
  id: number;
  name: string;
}

export interface Table {
  id: number;
  floorId: number;
  tableNumber: string;
  seats: number;
  isActive: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
}

export interface Promotion {
  id: number;
  name: string;
  promoType: PromoType;
  targetProductId: number | null;
  minQuantity: number | null;
  minOrderAmount: number | null;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
}

export interface PosSession {
  id: number;
  openedBy: number;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  closingBalance: number;
  status: SessionStatus;
}

export interface OrderItem {
  id: string; // Client unique id (like prod-uuid)
  productId: number;
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
  id: number;
  sessionId: number;
  tableId: number | null;
  customerId: number | null;
  employeeId: number;
  orderNumber: string;
  subtotal: number;
  tax: number;
  discounts: number;
  appliedPromoId: number | null;
  appliedPromoName: string | null;
  appliedCouponCode: string | null;
  total: number;
  status: OrderStatus;
  paymentMethodId: number | null;
  paymentReference: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface Booking {
  id: number;
  customerId: number;
  tableId: number;
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
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, pass: string) => boolean;
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
  updateUserPassword: (id: number, pass: string) => void;
  toggleArchiveUser: (id: number) => void;
  deleteUser: (id: number) => void;

  // Product & Category Actions
  createProduct: (prod: Omit<Product, "id" | "isActive">) => void;
  updateProduct: (id: number, prod: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  createCategory: (cat: Omit<Category, "id">) => Category;
  updateCategory: (id: number, cat: Partial<Category>) => void;
  deleteCategory: (id: number) => void;

  // Floor & Table Actions
  createFloor: (name: string) => void;
  createTable: (table: Omit<Table, "id" | "isActive">) => void;
  toggleTableStatus: (id: number) => void;

  // Coupon & Promo Actions
  createCoupon: (coupon: Omit<Coupon, "id" | "isActive">) => void;
  toggleCouponActive: (id: number) => void;
  createPromotion: (promo: Omit<Promotion, "id" | "isActive">) => void;
  togglePromoActive: (id: number) => void;

  // Payment Setup Actions
  togglePaymentMethod: (id: number) => void;
  saveUpiId: (id: number, upiId: string) => void;

  // Customer Actions
  createCustomer: (cust: Omit<Customer, "id">) => Customer;
  updateCustomer: (id: number, cust: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;

  // Booking Actions
  createBooking: (booking: Omit<Booking, "id">) => void;
  updateBookingStatus: (id: number, status: BookingStatus) => void;

  // Order workflow
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  loadTableOrder: (tableId: number) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQty: (productId: number, qty: number) => void;
  applyManualCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  linkCustomerToOrder: (customerId: number | null) => void;
  sendOrderToKitchen: () => void;
  processOrderPayment: (methodId: number, ref?: string) => void;
  cancelDraftOrder: (id: number) => void;
  editDraftOrder: (id: number) => void;
  createNewOrder: (tableId: number | null) => void;

  // KDS transitions
  updateKdsStage: (orderId: number, stage: KitchenStage) => void;
  toggleKdsItemComplete: (orderId: number, itemId: string) => void;

  // Reset helper for fresh start
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==========================================
// Default Seed Data matching SQL
// ==========================================

const SEED_USERS: User[] = [
  { id: 1, name: "Admin User", email: "admin@cafepos.com", passwordHash: "admin123", role: "admin", isArchived: false },
  { id: 2, name: "Cashier John", email: "john@cafepos.com", passwordHash: "cashier123", role: "employee", isArchived: false }
];

const SEED_CATEGORIES: Category[] = [
  { id: 1, name: "Hot Beverages", color: "#EF4444" },
  { id: 2, name: "Cold Beverages", color: "#3B82F6" },
  { id: 3, name: "Snacks", color: "#F59E0B" },
  { id: 4, name: "Desserts", color: "#EC4899" },
  { id: 5, name: "Bakery", color: "#10B981" }
];

const SEED_PRODUCTS: Product[] = [
  { id: 1, name: "Espresso", categoryId: 1, price: 3.50, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Rich shot of double espresso", isActive: true },
  { id: 2, name: "Cappuccino", categoryId: 1, price: 4.50, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Espresso with steamed milk foam", isActive: true },
  { id: 3, name: "Iced Latte", categoryId: 2, price: 4.80, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Cold milk over ice, with espresso", isActive: true },
  { id: 4, name: "Avocado Toast", categoryId: 3, price: 7.50, unitOfMeasure: "per piece", taxPercentage: 8.00, description: "Sourdough with mashed avocado and chilli flakes", isActive: true },
  { id: 5, name: "Chocolate Brownie", categoryId: 4, price: 3.80, unitOfMeasure: "per piece", taxPercentage: 10.00, description: "Warm fudge chocolate brownie", isActive: true },
  { id: 6, name: "Croissant", categoryId: 5, price: 3.20, unitOfMeasure: "per piece", taxPercentage: 5.00, description: "Flaky butter croissant", isActive: true }
];

const SEED_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, name: "Cash", type: "cash", upiId: null, isEnabled: true },
  { id: 2, name: "Card/Digital", type: "card", upiId: null, isEnabled: true },
  { id: 3, name: "UPI QR", type: "upi", upiId: "cafe@ybl", isEnabled: true }
];

const SEED_FLOORS: Floor[] = [
  { id: 1, name: "Ground Floor" },
  { id: 2, name: "Rooftop Lounge" }
];

const SEED_TABLES: Table[] = [
  { id: 1, floorId: 1, tableNumber: "T-101", seats: 2, isActive: true },
  { id: 2, floorId: 1, tableNumber: "T-102", seats: 4, isActive: true },
  { id: 3, floorId: 1, tableNumber: "T-103", seats: 4, isActive: true },
  { id: 4, floorId: 1, tableNumber: "T-104", seats: 6, isActive: true },
  { id: 5, floorId: 2, tableNumber: "RT-201", seats: 2, isActive: true },
  { id: 6, floorId: 2, tableNumber: "RT-202", seats: 4, isActive: true }
];

const SEED_COUPONS: Coupon[] = [
  { id: 1, code: "WELCOME10", discountType: "percentage", discountValue: 10.00, isActive: true },
  { id: 2, code: "FLAT5", discountType: "fixed", discountValue: 5.00, isActive: true }
];

const SEED_PROMOTIONS: Promotion[] = [
  { id: 1, name: "Coffee Combo Promo (3+ Espresso 15% off)", promoType: "product", targetProductId: 1, minQuantity: 3, minOrderAmount: null, discountType: "percentage", discountValue: 15.00, isActive: true },
  { id: 2, name: "Large Order Promo ($30+ off $5)", promoType: "order", targetProductId: null, minQuantity: null, minOrderAmount: 30.00, discountType: "fixed", discountValue: 5.00, isActive: true }
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 1, name: "Sarah Connor", email: "sarah@terminator.com", phone: "+1 555 1234" },
  { id: 2, name: "Bruce Wayne", email: "bruce@batman.com", phone: "+1 999 8888" }
];

const SEED_BOOKINGS: Booking[] = [
  { id: 1, customerId: 1, tableId: 2, bookingTime: "2026-06-13T19:00:00", guestsCount: 4, status: "confirmed", notes: "Prefers window table" }
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

      setUsers(getOrSeed<User[]>("users", SEED_USERS));
      setCategories(getOrSeed<Category[]>("categories", SEED_CATEGORIES));
      setProducts(getOrSeed<Product[]>("products", SEED_PRODUCTS));
      setPaymentMethods(getOrSeed<PaymentMethod[]>("payment_methods", SEED_PAYMENT_METHODS));
      setFloors(getOrSeed<Floor[]>("floors", SEED_FLOORS));
      setTables(getOrSeed<Table[]>("tables", SEED_TABLES));
      setCustomers(getOrSeed<Customer[]>("customers", SEED_CUSTOMERS));
      setCoupons(getOrSeed<Coupon[]>("coupons", SEED_COUPONS));
      setPromotions(getOrSeed<Promotion[]>("promotions", SEED_PROMOTIONS));
      setOrders(getOrSeed<Order[]>("orders", []));
      setBookings(getOrSeed<Booking[]>("bookings", SEED_BOOKINGS));
      setSessionsList(getOrSeed<PosSession[]>("sessions_list", []));

      // Load logged in user
      const loggedUser = localStorage.getItem("odoopos_current_user");
      if (loggedUser) {
        try {
          setCurrentUser(JSON.parse(loggedUser));
        } catch {}
      }

      // Load active session
      const sess = localStorage.getItem("odoopos_active_session");
      if (sess) {
        try {
          setActiveSession(JSON.parse(sess));
        } catch {}
      }
    }
  }, []);

  // Sync state helpers
  const saveState = <T,>(key: string, data: T) => {
    localStorage.setItem(`odoopos_${key}`, JSON.stringify(data));
  };

  // Sync users
  useEffect(() => { if (users.length > 0) saveState("users", users); }, [users]);
  // Sync categories
  useEffect(() => { if (categories.length > 0) saveState("categories", categories); }, [categories]);
  // Sync products
  useEffect(() => { if (products.length > 0) saveState("products", products); }, [products]);
  // Sync payments
  useEffect(() => { if (paymentMethods.length > 0) saveState("payment_methods", paymentMethods); }, [paymentMethods]);
  // Sync floors
  useEffect(() => { if (floors.length > 0) saveState("floors", floors); }, [floors]);
  // Sync tables
  useEffect(() => { if (tables.length > 0) saveState("tables", tables); }, [tables]);
  // Sync customers
  useEffect(() => { if (customers.length > 0) saveState("customers", customers); }, [customers]);
  // Sync coupons
  useEffect(() => { if (coupons.length > 0) saveState("coupons", coupons); }, [coupons]);
  // Sync promotions
  useEffect(() => { if (promotions.length > 0) saveState("promotions", promotions); }, [promotions]);
  // Sync orders
  useEffect(() => { saveState("orders", orders); }, [orders]);
  // Sync bookings
  useEffect(() => { if (bookings.length > 0) saveState("bookings", bookings); }, [bookings]);
  // Sync sessions
  useEffect(() => { saveState("sessions_list", sessionsList); }, [sessionsList]);

  // Authenticated User
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("odoopos_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("odoopos_current_user");
    }
  }, [currentUser]);

  // Active Session
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("odoopos_active_session", JSON.stringify(activeSession));
    } else {
      localStorage.removeItem("odoopos_active_session");
    }
  }, [activeSession]);

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
    let promoId: number | null = null;
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

  const login = (email: string, pass: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === pass && !u.isArchived);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, pass: string): boolean => {
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newUser: User = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name,
      email,
      passwordHash: pass,
      role: "employee",
      isArchived: false
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
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
  };

  // ==========================================
  // User/Employee Actions
  // ==========================================

  const createUser = (user: Omit<User, "id" | "isArchived">) => {
    const newUser: User = {
      ...user,
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      isArchived: false
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUserPassword = (id: number, pass: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, passwordHash: pass } : u));
  };

  const toggleArchiveUser = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isArchived: !u.isArchived } : u));
  };

  const deleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // ==========================================
  // Product & Category Actions
  // ==========================================

  const createProduct = (prod: Omit<Product, "id" | "isActive">) => {
    const newProd: Product = {
      ...prod,
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      isActive: true
    };
    setProducts(prev => [...prev, newProd]);
  };

  const updateProduct = (id: number, prod: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...prod } : p));
  };

  const deleteProduct = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const createCategory = (cat: Omit<Category, "id">): Category => {
    const newCat: Category = {
      ...cat,
      id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: number, cat: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...cat } : c));
  };

  const deleteCategory = (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // ==========================================
  // Floor & Table Actions
  // ==========================================

  const createFloor = (name: string) => {
    const newFloor: Floor = {
      id: floors.length > 0 ? Math.max(...floors.map(f => f.id)) + 1 : 1,
      name
    };
    setFloors(prev => [...prev, newFloor]);
  };

  const createTable = (table: Omit<Table, "id" | "isActive">) => {
    const newTable: Table = {
      ...table,
      id: tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1,
      isActive: true
    };
    setTables(prev => [...prev, newTable]);
  };

  const toggleTableStatus = (id: number) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  // ==========================================
  // Coupons & Promotions Setup Actions
  // ==========================================

  const createCoupon = (coupon: Omit<Coupon, "id" | "isActive">) => {
    const newCoupon: Coupon = {
      ...coupon,
      id: coupons.length > 0 ? Math.max(...coupons.map(c => c.id)) + 1 : 1,
      isActive: true
    };
    setCoupons(prev => [...prev, newCoupon]);
  };

  const toggleCouponActive = (id: number) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const createPromotion = (promo: Omit<Promotion, "id" | "isActive">) => {
    const newPromo: Promotion = {
      ...promo,
      id: promotions.length > 0 ? Math.max(...promotions.map(p => p.id)) + 1 : 1,
      isActive: true
    };
    setPromotions(prev => [...prev, newPromo]);
  };

  const togglePromoActive = (id: number) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
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

  const createCustomer = (cust: Omit<Customer, "id">): Customer => {
    const newCust: Customer = {
      ...cust,
      id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1
    };
    setCustomers(prev => [...prev, newCust]);
    return newCust;
  };

  const updateCustomer = (id: number, cust: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...cust } : c));
  };

  const deleteCustomer = (id: number) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // ==========================================
  // Bookings Actions
  // ==========================================

  const createBooking = (booking: Omit<Booking, "id">) => {
    const newBooking: Booking = {
      ...booking,
      id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const updateBookingStatus = (id: number, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  // ==========================================
  // POS Cart / Order Workflow
  // ==========================================

  const createNewOrder = (tableId: number | null) => {
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
      id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
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

  const loadTableOrder = (tableId: number) => {
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

  const updateCartQty = (productId: number, qty: number) => {
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

  const linkCustomerToOrder = (customerId: number | null) => {
    if (!currentOrder) return;
    const updatedOrder = {
      ...currentOrder,
      customerId
    };
    setCurrentOrder(updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const sendOrderToKitchen = () => {
    if (!currentOrder) return;
    
    // In KDS, we keep items status as 'to_cook' or preparing
    // Clicking "Send to Kitchen" updates status or triggers a state update
    // We just confirm it was sent
    const updatedOrder: Order = {
      ...currentOrder,
      items: currentOrder.items.map(it => ({ ...it, status: it.status === "to_cook" ? "to_cook" : it.status }))
    };

    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setCurrentOrder(updatedOrder);
  };

  const processOrderPayment = (methodId: number, ref?: string) => {
    if (!currentOrder) return;

    const updatedOrder: Order = {
      ...currentOrder,
      status: "paid",
      paymentMethodId: methodId,
      paymentReference: ref || null,
      createdAt: new Date().toISOString() // Set payment completion timestamp
    };

    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setCurrentOrder(null); // Clear active terminal checkout order
  };

  const cancelDraftOrder = (id: number) => {
    setOrders(prev =>
      prev.map((o) => {
        if (o.id === id) {
          return { ...o, status: "cancelled" };
        }
        return o;
      })
    );
    if (currentOrder && currentOrder.id === id) {
      setCurrentOrder(null);
    }
  };

  const editDraftOrder = (id: number) => {
    const draft = orders.find(o => o.id === id && o.status === "draft");
    if (draft) {
      setCurrentOrder(draft);
    }
  };

  // ==========================================
  // KDS transitions
  // ==========================================

  const updateKdsStage = (orderId: number, stage: KitchenStage) => {
    setOrders(prev =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map(it => ({
              ...it,
              status: stage,
              completedAt: stage === "completed" ? new Date().toISOString() : it.completedAt
            }))
          };
        }
        return order;
      })
    );

    if (currentOrder && currentOrder.id === orderId) {
      setCurrentOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(it => ({
            ...it,
            status: stage,
            completedAt: stage === "completed" ? new Date().toISOString() : it.completedAt
          }))
        };
      });
    }
  };

  const toggleKdsItemComplete = (orderId: number, itemId: string) => {
    setOrders(prev =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map((it) => {
              if (it.id === itemId) {
                const nextStatus: KitchenStage = it.status === "completed" ? "preparing" : "completed";
                return {
                  ...it,
                  status: nextStatus,
                  completedAt: nextStatus === "completed" ? new Date().toISOString() : undefined
                };
              }
              return it;
            })
          };
        }
        return order;
      })
    );

    if (currentOrder && currentOrder.id === orderId) {
      setCurrentOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((it) => {
            if (it.id === itemId) {
              const nextStatus: KitchenStage = it.status === "completed" ? "preparing" : "completed";
              return {
                ...it,
                status: nextStatus,
                completedAt: nextStatus === "completed" ? new Date().toISOString() : undefined
              };
            }
            return it;
          })
        };
      });
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
      setCoupons(SEED_COUPONS);
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
        createPromotion,
        togglePromoActive,
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

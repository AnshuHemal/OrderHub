# ☕ Odoo Cafe POS Setup Guide & Dependencies

This document provides step-by-step instructions to set up the **Odoo Cafe POS** system locally, install all necessary dependencies, and deploy the database schema on Neon DB.

---

## 📋 Prerequisites & Environment Dependencies

Make sure you have the following installed on your machine:
*   **Node.js:** version `v18` or higher (recommended: `v20` LTS).
*   **npm:** version `v9` or higher (usually bundles with Node.js).
*   **PostgreSQL / Neon DB account:** to host your production database tables.

---

## 🚀 Step 1: Navigate to the Project Folder

The Next.js project is nested in the `OrderHub` subdirectory. Open your terminal and run:

```powershell
cd OrderHub
```

> [!WARNING]
> Running package commands in the root `Odoo_hacathon` folder will throw an `ENOENT: Could not read package.json` error. Ensure your prompt shows you are inside the `OrderHub` directory.

---

## 📦 Step 2: Install Node Dependencies

Once inside the `OrderHub` folder, install all required dependencies listed in `package.json` (Next.js, React, Tailwind CSS):

```powershell
npm install
```

---

## 🖥️ Step 3: Run the Development Server

To start the local Next.js server in development mode:

```powershell
npm run dev
```

*   By default, the server runs on: **[http://localhost:3000](http://localhost:3000)**.
*   If port 3000 is in use, it will automatically launch on **[http://localhost:3001](http://localhost:3001)**.

---

## 🗄️ Step 4: Configure Neon DB Database Tables

The database schema is designed for PostgreSQL and fully compatible with Neon DB.

1.  Log in to your **[Neon Console](https://console.neon.tech/)**.
2.  Create a new project or select an existing database.
3.  Navigate to the **SQL Editor** tab in the sidebar.
4.  Open the [schema.sql](file:///c:/Users/harsh/Odoo_hacathon/OrderHub/schema.sql) file located in the project root, copy its entire contents, and paste it into the Neon SQL Editor.
5.  Click **Run** to execute the script. This will create:
    *   **Enums:** `user_role`, `discount_type`, `promotion_type`, `session_status`, `order_status`, `kitchen_stage`, `booking_status`.
    *   **Tables:** `users`, `categories`, `products`, `payment_methods`, `floors`, `tables`, `customers`, `coupons`, `promotions`, `pos_sessions`, `orders`, `order_items`, and `bookings`.
    *   **Performance Indexes:** optimized for high queries on sessions, tables, and bookings.
    *   **Demo Seed Data:** pre-populates category colors, coffee products, UPI payment options, and table layouts for instant testing.

---

## 📂 Project Structure Overview

*   `src/app/page.tsx` — Login / Signup & POS Session launcher.
*   `src/app/terminal/page.tsx` — Cashier screen with floor plans, checkout, and receipt printer.
*   `src/app/kitchen/page.tsx` — Kitchen Display System (KDS) live ticket columns.
*   `src/app/backend/page.tsx` — Admin panel for products, categories, coupons, and reports.
*   `src/app/context/AppContext.tsx` — Client state persistence layer utilizing `localStorage` to simulate active database connections.
*   `schema.sql` — DB tables structure for Neon.

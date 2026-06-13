# OrderHub

> **Take orders. Fire tickets. Close tabs.**

OrderHub is a modern, full-featured Cafe & Restaurant POS system — built as the **Odoo Cafe POS** project implementation.

---

## What is it?

OrderHub is a web-based Point of Sale system for cafes and restaurants. It covers the complete front-of-house and back-of-house workflow:

- Visual floor plan with real-time table status
- Order management (dine-in, takeaway, delivery)
- Kitchen display system (KDS)
- Menu & inventory management
- Billing, payments, bill splitting, tips
- Reports and analytics

---

## Logo

The **OrderHub** logo is inspired by TREXO's iconic "O" motif — a rounded rectangle ring that represents a **hub** (center dot connected to four directions), symbolizing the central order-routing system of a cafe.

```
╭──────╮
│  ·─·  │   ← The "O" ring (from TREXO) = the Hub
│  │ │  │
│  ·─·  │   → Center dot = the order point
╰──────╯
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | **Next.js 16** (App Router) |
| Backend API | **NestJS** |
| Database | **PostgreSQL** via **Neon DB** (serverless) |
| ORM | **Prisma 7** |
| Media Storage | **Cloudinary** |
| Auth | **Better Auth** (or NextAuth) |
| UI Components | **shadcn/ui** (new-york, zinc base) |
| Styling | **Tailwind CSS v4** |
| Animations | **Motion** (motion/react) |
| Icons | **Lucide React** |
| Forms | **react-hook-form** + **Zod** |
| State | **Zustand** (planned) |
| Real-time | **WebSockets** via NestJS (planned) |

---

## Project Structure

```
orderhub/
├── src/
│   ├── app/
│   │   ├── (auth)/           # /login, /signup
│   │   ├── (pos)/            # POS interface — floor plan, orders
│   │   ├── (kitchen)/        # Kitchen Display System (KDS)
│   │   ├── (admin)/          # Admin — menu, staff, reports
│   │   └── api/              # API routes (proxy to NestJS backend)
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── shared/           # Logo, Header, Sidebar, etc.
│   │   ├── pos/              # POS-specific: TableCard, OrderPanel, etc.
│   │   └── kitchen/          # KDS components
│   ├── lib/
│   │   ├── utils.ts          # cn(), formatCurrency, etc.
│   │   └── api.ts            # NestJS API client
│   └── hooks/                # Custom React hooks
├── public/
│   └── logo.svg              # OrderHub brand logo
└── README.md
```

---

## Planned Features

### Phase 1 — Foundation
- [ ] Authentication (staff login with PIN or password)
- [ ] Menu management (categories, items, variants, prices)
- [ ] Floor plan setup (floors, tables, seats, shapes)

### Phase 2 — Core POS
- [ ] Floor plan view with real-time table status
- [ ] Order taking (add items, quantities, modifiers, notes)
- [ ] Kitchen ticket printing / KDS display
- [ ] Billing and payment (cash, card, UPI)

### Phase 3 — Advanced
- [ ] Bill splitting per guest
- [ ] Tips and service charges
- [ ] Order transfer between tables
- [ ] Takeaway and delivery orders
- [ ] Table reservation / booking

### Phase 4 — Reports & Admin
- [ ] Daily sales report
- [ ] Category-wise revenue
- [ ] Popular items
- [ ] Staff performance
- [ ] Hourly breakdown charts

---

## Table Status Legend

| Status | Color | Meaning |
|---|---|---|
| Available | 🟢 Green | Empty, ready for guests |
| Occupied | 🟠 Orange | Has active order |
| Reserved | 🔵 Blue | Booked/upcoming |
| Dirty | 🔴 Red | Needs cleaning |

---

## Getting Started

```bash
git clone <repo>
cd orderhub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000   # NestJS backend

# Neon DB
DATABASE_URL=postgresql://...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## License

MIT

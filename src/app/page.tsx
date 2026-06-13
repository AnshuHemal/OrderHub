import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  ChefHat,
  CreditCard,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: LayoutGrid,
    title: "Floor & Table Management",
    description:
      "Visual floor plan with real-time table status — available, occupied, reserved, or dirty. Drag-and-drop table layout editing.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: ClipboardList,
    title: "Order Management",
    description:
      "Take dine-in, takeaway, and delivery orders. Transfer, merge, and split orders across tables seamlessly.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: ChefHat,
    title: "Kitchen Display",
    description:
      "Send orders directly to kitchen screens. Separate tickets per category — food vs drinks. Real-time updates.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description:
      "Fast checkout with cash, card, UPI. Bill splitting per guest, tips, receipt printing, and invoice generation.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: UtensilsCrossed,
    title: "Menu Management",
    description:
      "Manage categories, items, pricing, variants, and combos. Mark items as available or 86'd on the fly.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Daily sales, category-wise revenue, staff performance, popular items, and hourly breakdowns.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={28} />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#stack" className="hover:text-foreground transition-colors">Stack</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm">Get Started <ArrowRight /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="size-3" />
            Cafe POS — Built for Speed
          </Badge>

          {/* Logo showcase */}
          <div className="mb-8 flex justify-center">
            <Logo size={64} asLink={false} />
          </div>
          <p className="mx-auto mb-4 max-w-lg text-xl font-medium text-muted-foreground">
            Take orders. Fire tickets. Close tabs.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground">
            A modern, full-featured Cafe &amp; Restaurant POS built with Next.js + NestJS.
            Floor plans, kitchen display, bill splitting, analytics — everything a busy cafe needs.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2">
              Open POS <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline">
              View Kitchen Display
            </Button>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section id="features" className="border-t border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight">Everything a cafe needs</h2>
              <p className="text-muted-foreground">
                From table to receipt — OrderHub covers the full front-of-house and back-of-house workflow.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, color, bg }) => (
                <Card key={title} className="group transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex rounded-lg p-2.5 ${bg}`}>
                      <Icon className={`size-5 ${color}`} />
                    </div>
                    <h3 className="mb-2 font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tech Stack ──────────────────────────────────────────────────── */}
        <section id="stack" className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">Built with modern tech</h2>
            <p className="mb-12 text-muted-foreground">
              Production-grade stack for a reliable, scalable POS system.
            </p>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {[
                { name: "Next.js 16", role: "Frontend" },
                { name: "NestJS", role: "Backend API" },
                { name: "PostgreSQL", role: "Database" },
                { name: "Prisma 7", role: "ORM" },
                { name: "Neon DB", role: "Serverless DB" },
                { name: "Cloudinary", role: "Media Storage" },
                { name: "shadcn/ui", role: "UI Components" },
                { name: "Tailwind v4", role: "Styling" },
              ].map(({ name, role }) => (
                <div
                  key={name}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-left"
                >
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <Logo size={28} className="mb-6 justify-center" />
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Ready to streamline your cafe?
            </h2>
            <p className="mb-8 text-muted-foreground">
              OrderHub is under active development. Built as part of the Odoo Cafe POS project.
            </p>
            <Button size="lg">
              Launch OrderHub <ArrowRight />
            </Button>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Logo size={22} />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OrderHub. Odoo Cafe POS Project.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UtensilsCrossed, LayoutGrid, ChefHat } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={24} />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.name ?? user.email}
            </span>
            <form action={async () => {
              "use server";
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              cookieStore.delete("session_token");
              redirect("/login");
            }}>
              <Button variant="ghost" size="sm" type="submit">Sign out</Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <Logo size={48} asLink={false} />
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="max-w-sm text-muted-foreground">
            Your OrderHub dashboard is being built. Choose where to go:
          </p>
        </div>

        <div className="grid w-full max-w-sm gap-3">
          <Button size="lg" className="gap-3 h-14 text-base" asChild>
            <Link href="/terminal"><LayoutGrid className="size-5" /> Open POS</Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-3 h-14 text-base" asChild>
            <Link href="/kitchen"><ChefHat className="size-5" /> Kitchen Display</Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-3 h-14 text-base" asChild>
            <Link href="/backend"><UtensilsCrossed className="size-5" /> Admin Panel</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

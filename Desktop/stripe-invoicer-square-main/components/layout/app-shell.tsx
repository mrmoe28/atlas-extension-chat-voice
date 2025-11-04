// RESPONSIVE: Enhanced AppShell with mobile drawer and responsive layout
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNav, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/icons";
import { UserDropdown } from "@/components/layout/user-dropdown";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // RESPONSIVE: Auto-close mobile drawer on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // RESPONSIVE: Sidebar navigation content (reused in desktop and mobile)
  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between lg:justify-start">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon name="invoices" className="size-5" />
          </span>
          <span className="text-fluid-lg">{siteConfig.name}</span>
        </Link>
      </div>
      <nav className="mt-8 flex flex-col gap-1 text-sm">
        {dashboardNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <Icon name={item.icon} className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden flex-col gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground lg:flex">
        <div className="flex items-center gap-3">
          <Icon name="shield" className="size-4" aria-hidden="true" />
          <span className="text-fluid-xs">Square Secure Payments</span>
        </div>
        <p className="text-fluid-xs">Collect card payments instantly with auto-reconciliation.</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* RESPONSIVE: Container with responsive max-width and padding */}
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* RESPONSIVE: Desktop sidebar (hidden on mobile) */}
        <aside className="fixed inset-y-0 z-30 hidden w-64 shrink-0 border-r border-border bg-muted/20 px-4 py-6 lg:static lg:block">
          <SidebarContent />
        </aside>

        {/* RESPONSIVE: Mobile drawer using Sheet component */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-64 p-4">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* RESPONSIVE: Main content area with responsive padding */}
        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          {/* RESPONSIVE: Sticky header with responsive gap and padding */}
          <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-6">
              {/* RESPONSIVE: Mobile menu button */}
              <Button
                variant="ghost"
                className="size-9 shrink-0 p-0 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={open}
                aria-controls="mobile-menu"
              >
                <Icon name="menu" className="size-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>

              {/* RESPONSIVE: Header actions with responsive spacing */}
              <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
                <ThemeToggle />
                {/* RESPONSIVE: Hide on mobile, show on desktop */}
                <Button variant="secondary" className="hidden gap-2 lg:inline-flex" asChild>
                  <Link href="/invoices/new">
                    <Icon name="plus" className="size-4" />
                    <span className="hidden xl:inline">New invoice</span>
                    <span className="xl:hidden">New</span>
                  </Link>
                </Button>
                <UserDropdown />
              </div>
            </div>
          </header>

          {/* RESPONSIVE: Main content with fluid padding */}
          <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

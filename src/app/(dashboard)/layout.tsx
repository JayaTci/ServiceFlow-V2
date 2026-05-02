"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@frontend/components/layout/sidebar";
import { Header } from "@frontend/components/layout/header";
import { Sheet, SheetContent } from "@frontend/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — collapsible */}
      <aside className="hidden lg:flex flex-shrink-0 transition-all duration-300">
        <Sidebar
          role={user?.role}
          userName={user?.name ?? undefined}
          userEmail={user?.email ?? undefined}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 border-r-0">
          <Sidebar
            role={user?.role}
            userName={user?.name ?? undefined}
            userEmail={user?.email ?? undefined}
            onClose={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          userName={user?.name ?? undefined}
          userEmail={user?.email ?? undefined}
          userRole={user?.role}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}

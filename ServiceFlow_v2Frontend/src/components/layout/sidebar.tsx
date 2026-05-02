"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@shared/utils";
import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { Badge } from "@frontend/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@frontend/components/ui/tooltip";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/admin/activity", label: "Activity", icon: Activity, adminOnly: true },
];

interface SidebarProps {
  role?: string;
  userName?: string;
  userEmail?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function Sidebar({
  role,
  userName,
  userEmail,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[60px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-sidebar-border shrink-0 transition-all",
            collapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 min-w-0",
              collapsed && "justify-center"
            )}
          >
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-base text-sidebar-foreground truncate">
                ServiceFlow
              </span>
            )}
          </Link>
          {/* Mobile close */}
          {onClose && !collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden w-7 h-7 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2.5",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/15"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {/* Active indicator */}
                {isActive && !collapsed && (
                  <span className="absolute left-0 w-0.5 h-6 bg-primary rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-sidebar-foreground/50"
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger>
                  <div className="relative">{linkContent}</div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.href} className="relative">
                {linkContent}
              </div>
            );
          })}
        </nav>

        {/* User + collapse toggle */}
        <div className="border-t border-sidebar-border px-2 py-3 space-y-2">
          {/* Collapse toggle — desktop only */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex items-center w-full rounded-lg px-2.5 py-2 text-xs font-medium",
                "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                collapsed && "justify-center"
              )}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}

          {/* User info */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex justify-center">
                  <Avatar className="w-8 h-8 cursor-default">
                    <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <p className="font-medium">{userName}</p>
                <p className="text-muted-foreground">{role}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName ?? "User"}
                </p>
                <p className="text-xs text-sidebar-foreground/40 truncate">
                  {userEmail ?? ""}
                </p>
              </div>
              {role === "admin" && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0 shrink-0"
                >
                  <Shield className="w-2.5 h-2.5 mr-0.5" />
                  Admin
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

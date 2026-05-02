"use client";

import { Menu, LogOut, Sun, Moon, User } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onMenuToggle: () => void;
}

/** Derives a human-readable page title from the current pathname. */
function getPageTitle(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/requests/new")) return "New Request";
  if (pathname.match(/^\/requests\/\d+/)) return "Request Details";
  if (pathname.startsWith("/requests")) return "Requests";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/admin/users")) return "User Management";
  if (pathname.startsWith("/admin/activity")) return "Activity Log";
  if (pathname.startsWith("/profile")) return "Profile";
  return "ServiceFlow";
}

export function Header({ userName, userEmail, userRole, onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left — mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden w-8 h-8"
          aria-label="Open navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Right — theme toggle + user menu */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-8 px-2 rounded-lg"
              aria-label="User menu"
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="font-semibold text-sm truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              {userRole && (
                <p className="text-[10px] text-primary mt-0.5 capitalize font-medium">
                  {userRole}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => router.push("/profile")}
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await signOut({ callbackUrl: "/login" });
                } catch {
                  toast.error("Sign out failed. Please try again.");
                }
              }}
              className="text-destructive cursor-pointer gap-2 focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

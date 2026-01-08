
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, PlusCircle, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/map", label: "Carte", icon: Map },
  { href: "/add-product", label: "Ajouter", icon: PlusCircle },
  { href: "/leaderboard", label: "Classement", icon: Trophy },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full text-muted-foreground transition-colors",
                isActive ? "text-primary" : "hover:text-primary"
              )}
            >
              {item.href === '/add-product' ? (
                 <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground -mt-4 shadow-lg border-4 border-background">
                    <item.icon className="h-6 w-6" />
                 </div>
              ) : (
                <item.icon className="h-6 w-6" />
              )}
              <span className={cn(
                  "text-xs font-medium",
                   item.href === '/add-product' && 'sr-only' // Hide label for add button
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

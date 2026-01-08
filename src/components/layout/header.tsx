
'use client'

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";
import { Button } from "../ui/button";
import { User, PlusCircle, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";


const navItems = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/map", label: "Carte" },
  { href: "/leaderboard", label: "Classement" },
];

export function Header() {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) {
        return (names[0][0] + (names[names.length-1][0] || '')).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '...';
  }

  return (
    <header className="hidden md:flex h-16 items-center px-4 container mx-auto border-b">
        <div className="flex-1 flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-md">
                <ShoppingBasket className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Ch7al</span>
            </Link>
        </div>
        
        <nav className="flex-1 flex justify-center items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                  isActive && "text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

      <div className="flex-1 flex items-center justify-end gap-4">
          <Link href="/add-product" passHref>
             <Button className="bg-primary hover:bg-primary/90">
               <PlusCircle className="mr-2 h-4 w-4" />
               Ajouter un prix
             </Button>
           </Link>
          <Link href="/profile">
            <Avatar className="h-10 w-10 border-2 border-primary/50">
                {!isUserLoading && user && (
                <AvatarImage
                    src={user.photoURL || undefined}
                    alt={user.displayName || "User Avatar"}
                />
                )}
                <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="w-5 h-5"/>
                </AvatarFallback>
            </Avatar>
          </Link>
      </div>
    </header>
  );
}

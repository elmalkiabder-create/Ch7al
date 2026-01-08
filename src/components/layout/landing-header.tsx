
'use client';

import Link from "next/link";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/dashboard", label: "Accueil" },
    { href: "/search", label: "Recherche" },
    { href: "/leaderboard", label: "Classement" },
    { href: "/profile", label: "Profil" },
]

export function LandingHeader() {
    const pathname = usePathname();

  return (
    <header className="absolute top-0 left-0 w-full z-20 bg-transparent">
        <div className="container mx-auto flex h-20 items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">Ch7al</span>
            </Link>
             <nav className="hidden md:flex items-center gap-6 text-white/90 font-medium">
                {navLinks.map(link => (
                     <Link 
                        key={link.href} 
                        href={link.href} 
                        className="hover:text-white transition-colors relative"
                    >
                        {link.label}
                         {pathname === link.href && (
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
                        )}
                    </Link>
                ))}
            </nav>
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="secondary" size="lg" className="hidden md:flex">
                        Commencer
                    </Button>
                </Link>
            </div>
        </div>
    </header>
  );
}

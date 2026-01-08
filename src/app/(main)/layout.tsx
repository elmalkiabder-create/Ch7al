'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

const PROTECTED_ROUTES = ['/profile', '/add-product', '/dashboard', '/leaderboard', '/search', '/settings'];
const AUTH_ROUTE = '/auth';
const LANDING_PAGE = '/';

// Routes that should NOT show the header or bottom nav for a more immersive experience
const IMMERSIVE_ROUTES = ['/add-product', '/profile/'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isAuthPage = pathname === AUTH_ROUTE;
    const isLandingPage = pathname === LANDING_PAGE;

    if (!user && isProtectedRoute) {
      router.replace(AUTH_ROUTE);
    } else if (user && (isAuthPage || isLandingPage)) {
      router.replace('/dashboard');
    } else if (user && pathname === '/profile') {
      // Redirect from generic /profile to user's specific profile page
      router.replace(`/profile/${user.uid}`);
    }

  }, [user, isUserLoading, router, pathname]);
  
  const showNav = !IMMERSIVE_ROUTES.some(route => pathname.startsWith(route));
  const isAuthOrLandingPage = pathname === AUTH_ROUTE || pathname === LANDING_PAGE;
  const isGenericProfilePage = pathname === '/profile';

  if (isUserLoading && (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) || isLandingPage || isAuthPage)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // While redirecting from /profile to /profile/[id]
  if (isGenericProfilePage) {
     return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }
  
  // For auth/landing, show only children without any layout wrappers
  if (isAuthOrLandingPage) {
     if (!isUserLoading && !user) {
        return <main className="h-screen">{children}</main>;
     }
     // If user is logged in, show loader while redirecting
     return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }


  // This prevents a flash of protected content while redirecting a non-authenticated user
  if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }
  
  // If we are here, the user is authenticated and on a protected page.
  // The main layout wrapper
  const Wrapper = IMMERSIVE_ROUTES.some(route => pathname.startsWith(route)) ? React.Fragment : 'div';
  const wrapperProps = Wrapper === 'div' ? { className: "relative flex min-h-screen w-full flex-col" } : {};

  const mainClass = IMMERSIVE_ROUTES.some(route => pathname.startsWith(route)) 
    ? "h-screen flex-1" 
    : "flex-1 pb-20 md:pb-0";

  return (
    <Wrapper {...wrapperProps}>
        {showNav && <Header />}
        <main className={mainClass}>
            <Suspense>
                {children}
            </Suspense>
        </main>
        {showNav && <BottomNav />}
    </Wrapper>
  );
}


'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { AuthForm } from "./auth-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';


export default function AuthPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
 
  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard');
    }
  }, [isUserLoading, user, router]);


  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Vérification...</p>
      </div>
    );
  }
  
  return (
    <>
      <Script 
        src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} 
        strategy="afterInteractive"
      />
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-background">
        <div className="w-full max-w-md">
          <Card className="shadow-lg rounded-xl">
              <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl font-bold text-center">Bienvenue !</CardTitle>
                  <CardDescription>Connectez-vous pour continuer</CardDescription>
              </CardHeader>
              <CardContent>
                  <AuthForm />
              </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

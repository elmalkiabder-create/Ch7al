'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, ArrowLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";


export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const themes = [
    { name: 'Clair', value: 'light', icon: Sun },
    { name: 'Sombre', value: 'dark', icon: Moon },
    { name: 'Système', value: 'system', icon: Monitor },
  ];
  
  const handleLogout = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        toast({
            title: "Déconnexion réussie",
            description: "Vous avez été déconnecté.",
        });
        router.push('/auth');
    } catch (error) {
        console.error("Erreur de déconnexion:", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de se déconnecter. Veuillez réessayer.",
        });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
       <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Paramètres</CardTitle>
            <CardDescription>Gérez les préférences de votre application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Thème de l'application</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez comment vous souhaitez voir l'application.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {themes.map((t) => (
                  <Button
                    key={t.value}
                    variant="outline"
                    className={cn(
                      'flex flex-col h-20 justify-center gap-2 text-lg',
                      theme === t.value && 'border-primary ring-2 ring-primary'
                    )}
                    onClick={() => setTheme(t.value)}
                  >
                    <t.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{t.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
         <Card>
           <CardHeader>
              <CardTitle>Compte</CardTitle>
              <CardDescription>Gérez les informations de votre compte.</CardDescription>
           </CardHeader>
           <CardContent>
              <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}

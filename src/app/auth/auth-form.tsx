
"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, KeyRound, User, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  handleEmailSignUp,
  handleEmailSignIn,
  handleGoogleSignIn,
} from "@/firebase/non-blocking-login";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// Déclare la variable globale grecaptcha pour TypeScript
declare global {
  interface Window {
    grecaptcha: any;
  }
}

const getFirebaseErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Cette adresse email est invalide.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "L'e-mail ou le mot de passe est incorrect.";
    case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée par un autre compte.';
    case 'auth/operation-not-allowed':
      return "Ce mode de connexion n'est pas activé. Veuillez contacter l'administrateur.";
    case 'auth/popup-closed-by-user':
        return 'La fenêtre de connexion a été fermée. Veuillez réessayer.';
    default:
      return 'Une erreur est survenue. Veuillez réessayer.';
  }
};

type AuthMode = 'signin' | 'signup';

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.62-4.88 1.62-3.86 0-6.99-3.14-6.99-7s3.13-7 6.99-7c2.08 0 3.66.86 4.79 1.84l2.53-2.53C18.49 1.99 15.79 1 12.48 1 7.03 1 3 5.03 3 10.5s4.03 9.5 9.48 9.5c2.83 0 5.1-1 6.7-2.73 1.66-1.79 2.2-4.34 2.2-6.51 0-.61-.05-.91-.12-1.18h-8.78Z"
    />
  </svg>
);


export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isPending, startTransition] = useTransition();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [reCaptchaError, setReCaptchaError] = useState(false);

  const auth = useAuth();
  const { toast } = useToast();
  

  const handleAuthAction = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY.includes('your-')) {
        setReCaptchaError(true);
        toast({ variant: 'destructive', title: 'Erreur de configuration', description: 'La clé de site reCAPTCHA est manquante.' });
        return;
    }

    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'reCAPTCHA n\'est pas encore prêt. Veuillez patienter.' });
      return;
    }
    
    startTransition(() => {
        window.grecaptcha.enterprise.ready(async () => {
            try {
                const token = await window.grecaptcha.enterprise.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'LOGIN' });

                if (!token) {
                    throw new Error("La vérification reCAPTCHA a échoué. Veuillez réessayer.");
                }

                if (authMode === 'signup') {
                    if (!username) {
                        toast({ variant: 'destructive', title: 'Erreur', description: "Le nom d'utilisateur est requis." });
                        return;
                    }
                    await handleEmailSignUp(auth, username, email, password);
                    toast({ title: 'Inscription réussie !', description: 'Bienvenue ! Vous êtes maintenant connecté.' });
                } else {
                    await handleEmailSignIn(auth, email, password);
                    toast({ title: 'Connexion réussie !' });
                }
                // La redirection sera gérée par le layout principal
            } catch (error: any) {
                console.error("Auth Error:", error.code, error.message);
                const errorMessage = getFirebaseErrorMessage(error.code) || error.message;
                toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
            }
        });
    });
  }, [auth, authMode, email, password, username, toast]);

  const handleGoogleClick = useCallback(() => {
    if (!auth) return;
    startTransition(async () => {
      try {
        await handleGoogleSignIn(auth);
        toast({ title: 'Connexion réussie !' });
        // La redirection sera gérée par le layout principal
      } catch (error: any) {
        console.error("Google Auth Error:", error.code, error.message);
        const errorMessage = getFirebaseErrorMessage(error.code) || "Une erreur est survenue lors de la connexion avec Google.";
        toast({ variant: 'destructive', title: 'Erreur de connexion', description: errorMessage });
      }
    });
  }, [auth, toast]);
  
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
  }

  return (
    <div>
        {reCaptchaError && (
             <Alert variant="destructive" className="mb-4">
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Action Requise</AlertTitle>
              <AlertDescription>
                La clé reCAPTCHA n'est pas configurée. Veuillez suivre les instructions dans le fichier `README.md`.
              </AlertDescription>
            </Alert>
        )}

        <div className="flex bg-muted p-1 rounded-lg my-4">
            <button 
                onClick={() => { setAuthMode('signin'); resetForm(); }}
                className={cn("flex-1 p-2 rounded-md text-sm font-medium", authMode === 'signin' && "bg-background shadow-sm")}>
                Se connecter
            </button>
            <button 
                onClick={() => { setAuthMode('signup'); resetForm(); }}
                className={cn("flex-1 p-2 rounded-md text-sm font-medium", authMode === 'signup' && "bg-background shadow-sm")}>
                S'inscrire
            </button>
        </div>

      <form className="space-y-4" onSubmit={handleAuthAction}>
      {authMode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="username" type="text" placeholder="Votre nom" required value={username} onChange={e => setUsername(e.target.value)} disabled={isPending} className="pl-9" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" type="email" placeholder="email@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isPending} className="pl-9" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} disabled={isPending} className="pl-9" />
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isPending || !auth}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {authMode === 'signin' ? 'Se connecter' : 'Créer un compte'}
      </Button>
    </form>
      
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                    Ou continuer avec
                </span>
            </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleClick} disabled={isPending || !auth}>
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Google
        </Button>
    </div>
  );
}

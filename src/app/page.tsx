
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingBasket, Globe } from 'lucide-react';
import { useState } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {

  const heroImage = PlaceHolderImages.find(p => p.id === 'souk-hero');
  const imageUrl = heroImage?.imageUrl || "https://images.unsplash.com/photo-1748592522302-8ba1fbeaddbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxtb3JvY2NhbiUyMHNvdWt8ZW58MHx8fHwxNzYxNDQ2ODc5fDA&ixlib=rb-4.1.0&q=80&w=1080";
  const imageHint = heroImage?.imageHint || "moroccan souk";
  
  const [language, setLanguage] = useState('FR');

  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col items-center">
      
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-20 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-md shadow-md">
              <ShoppingBasket className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Ch7al</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-background/50 backdrop-blur-sm">
                <Globe className="h-4 w-4" />
                <span>{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setLanguage('FR')}>Français</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLanguage('AR')}>العربية</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLanguage('EN')}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>
      
      <div className="relative w-full h-96 md:h-[50vh] flex items-center justify-center">
          <Image
              src={imageUrl}
              alt="Scène de marché marocain"
              data-ai-hint={imageHint}
              fill
              className="w-full h-full object-cover"
              priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center text-center -mt-24 w-full px-4">
        <div className="bg-primary p-4 rounded-full shadow-lg mb-4">
             <ShoppingBasket className="h-10 w-10 text-primary-foreground" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tighter">
            Trouvez les meilleurs prix, <span className="text-primary">ensemble</span>.
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
            Rejoignez la communauté Ch7al de Meknès et ne payez plus jamais trop cher.
        </p>

        <div className="w-full max-w-xs space-y-3">
            <Link href="/auth" passHref>
                <Button size="lg" className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/30">
                    Commencer
                </Button>
            </Link>
             <Link href="/auth" passHref>
                <Button size="lg" variant="ghost" className="w-full h-14 text-lg">
                    J'ai déjà un compte
                </Button>
            </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-8 max-w-xs">
            En continuant, vous acceptez nos <Link href="#" className="underline hover:text-primary">Conditions d'utilisation</Link> et notre <Link href="#" className="underline hover:text-primary">Politique de confidentialité</Link>.
        </p>
      </main>
    </div>
  );
}

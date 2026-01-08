

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, PlusCircle, ShoppingBasket, List, Award, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import type { Price, Product, UserProfile, Contribution, Store } from '@/lib/types';
import { Suspense, useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { HomeClient } from '../home-client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ContributionCard } from './contribution-card';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { mockContributions } from '@/lib/data';


// Define the shape of your detailed contribution
type DetailedContribution = Contribution & {
    product?: Product;
    user?: UserProfile;
    store?: Store;
};

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function HomePageContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('recent');
    const [selectedContribution, setSelectedContribution] = useState<DetailedContribution | null>(null);

    // Queries
    const recentQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'prices'), orderBy('createdAt', 'desc'), limit(20)) : null,
      [firestore]
    );
    const popularQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'prices'), orderBy('voteScore', 'desc'), limit(20)) : null,
      [firestore]
    );

    // Data fetching
    const { data: recentPrices, isLoading: isLoadingRecent } = useCollection<Price>(recentQuery);
    const { data: popularPrices, isLoading: isLoadingPopular } = useCollection<Price>(popularQuery);
    const [detailedPrices, setDetailedPrices] = useState<Record<string, DetailedContribution[]>>({ recent: [], popular: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const productPlaceholders = PlaceHolderImages.filter(p => p.id.startsWith('product-'));


    useEffect(() => {
        if (!firestore) return;

        const fetchDetailsForPrices = async (prices: Price[], key: 'recent' | 'popular') => {
            if (prices === null) { // Firestore is ready but collection is empty
                setDetailedPrices(prev => ({...prev, [key]: mockContributions}));
                return;
            }
            if (prices && prices.length === 0) { // Firestore has an empty result
                setDetailedPrices(prev => ({...prev, [key]: mockContributions}));
                return;
            }

            setIsLoadingDetails(true);
            const detailed = await Promise.all(
                (prices || []).map(async (price, index) => {
                    const [productSnap, storeSnap, userSnap] = await Promise.all([
                        price.productId ? getDoc(doc(firestore, 'products', price.productId)) : Promise.resolve(null),
                        price.storeId ? getDoc(doc(firestore, 'stores', price.storeId)) : Promise.resolve(null),
                        price.userId ? getDoc(doc(firestore, 'users', price.userId)) : Promise.resolve(null)
                    ]);
                    
                    const product = productSnap?.exists() ? { id: productSnap.id, ...productSnap.data() } as Product : undefined;
                    const store = storeSnap?.exists() ? { id: storeSnap.id, ...storeSnap.data() } as Store : undefined;
                    const user = userSnap?.exists() ? { id: userSnap.id, ...userSnap.data() } as UserProfile : undefined;
                    
                    let imageUrl = product?.imageUrl;
                    if (!imageUrl && productPlaceholders.length > 0) {
                        imageUrl = productPlaceholders[index % productPlaceholders.length].imageUrl;
                    }

                    return {
                        ...price,
                        id: price.id,
                        productName: product?.name || price.productId,
                        storeName: store?.name || price.storeId,
                        price: price.price,
                        date: price.createdAt ? (price.createdAt as any).toDate() : new Date(),
                        imageUrl: imageUrl,
                        user: user,
                        product: product,
                        store: store,
                        latitude: store?.latitude || null,
                        longitude: store?.longitude || null,
                    } as DetailedContribution;
                })
            );
            
            // If real data is fetched, use it. Otherwise, keep using mock data if it was set.
            if(detailed.length > 0) {
              setDetailedPrices(prev => ({...prev, [key]: detailed}));
            }
            setIsLoadingDetails(false);
        };
        
        if (activeTab === 'recent') {
            fetchDetailsForPrices(recentPrices, 'recent');
        } else if (activeTab === 'popular') {
            fetchDetailsForPrices(popularPrices, 'popular');
        }

    }, [firestore, recentPrices, popularPrices, activeTab, productPlaceholders]);

    const isLoading = isLoadingRecent || isLoadingPopular || isLoadingDetails;
    const currentPrices = detailedPrices[activeTab as 'recent' | 'popular'] || [];
    
    const storesForMap = currentPrices
        .filter(p => p.latitude && p.longitude)
        .map(p => ({
            id: p.storeId,
            name: p.storeName,
            position: { lat: p.latitude!, lng: p.longitude! }
        }));


    const handleCardClick = (contribution: DetailedContribution) => {
        setSelectedContribution(contribution);
    };
    
    const handleBack = () => {
        setSelectedContribution(null)
    }
    
    const handleDeleteFromList = (deletedId: string) => {
        setDetailedPrices(prev => ({
            recent: prev.recent.filter(p => p.id !== deletedId),
            popular: prev.popular.filter(p => p.id !== deletedId),
        }));
    }


    if (selectedContribution) {
        return <div className="container mx-auto px-4 py-6"><ContributionCard contribution={selectedContribution} apiKey={apiKey} onBack={handleBack} onDelete={handleDeleteFromList} /></div>;
    }

    const FilterControls = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Trier par</h3>
                <div className="flex flex-col gap-2">
                    <Button variant={activeTab === 'recent' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('recent')} className="justify-start">Récents</Button>
                    <Button variant={activeTab === 'popular' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('popular')} className="justify-start">Populaires</Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1">
            <div className="container mx-auto px-4 py-6">
                 <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tighter"><HomeClient /></h1>
                    <p className="text-muted-foreground">Scanner • Partager • Récompenser</p>
                </div>

                {/* Hero Section */}
                <div className="mb-8">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                         plugins={[
                            Autoplay({
                              delay: 4000,
                              stopOnInteraction: true,
                            }),
                          ]}
                        className="w-full"
                    >
                        <CarouselContent>
                           {isLoading && currentPrices.length === 0 ? (
                                [...Array(3)].map((_, i) => (
                                    <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                                        <Skeleton className="w-full h-48 rounded-xl" />
                                    </CarouselItem>
                                ))
                           ) : currentPrices.length > 0 ? (
                                currentPrices.slice(0, 5).map((item) => (
                                 <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3" onClick={() => handleCardClick(item)}>
                                    <div className="p-1">
                                        <Card className="overflow-hidden group cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
                                            <CardContent className="flex items-center gap-4 p-4">
                                                 <div className="w-24 h-24 bg-muted rounded-md relative overflow-hidden flex-shrink-0">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} alt={item.productName || 'Produit'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="100px"/>
                                                    ) : (
                                                        <ShoppingBasket className="w-8 h-8 text-muted-foreground m-auto"/>
                                                    )}
                                                </div>
                                                <div className="flex-grow overflow-hidden">
                                                    <p className="font-semibold leading-tight text-md truncate">{item.productName}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{item.storeName}</p>
                                                     <div className="font-bold text-primary text-xl mt-2 whitespace-nowrap">
                                                        {item.price.toFixed(2)} DH
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                                ))
                           ) : (
                             <CarouselItem>
                                <div className="p-1">
                                    <Card>
                                         <CardContent className="flex flex-col aspect-video items-center justify-center p-6">
                                            <Award className="w-12 h-12 text-primary mb-4"/>
                                            <h3 className="text-xl font-bold">Soyez le premier!</h3>
                                            <p className="text-muted-foreground text-center">Ajoutez un prix pour voir les bons plans ici.</p>
                                         </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                           )}
                        </CarouselContent>
                        <CarouselPrevious className="ml-12 hidden sm:flex"/>
                        <CarouselNext className="mr-12 hidden sm:flex"/>
                    </Carousel>
                </div>


                <div className="flex flex-col md:flex-row gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block md:w-56 lg:w-64 flex-shrink-0">
                       <Link href="/add-product" passHref>
                         <Button size="lg" className="w-full h-12 mb-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/30">
                           <PlusCircle className="mr-2 h-5 w-5" />
                           Ajouter un prix
                         </Button>
                       </Link>
                       <h2 className="text-lg font-bold px-2 mb-4">Filtrer les prix</h2>
                       <FilterControls />
                    </aside>
                    
                    {/* Main Content */}
                    <main className="flex-1">
                       <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-bold">Tous les prix</h2>
                          <Sheet>
                            <SheetTrigger asChild>
                               <Button variant="outline" size="sm" className="md:hidden">
                                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                                  Filtrer & Trier
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-3/4">
                                <SheetHeader className="mb-6">
                                    <SheetTitle>Filtres</SheetTitle>
                                </SheetHeader>
                                <FilterControls />
                            </SheetContent>
                          </Sheet>
                      </div>

                        {isLoading && currentPrices.length === 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
                            </div>
                        ) : currentPrices.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {currentPrices.map(item => (
                                         <div key={item.id} onClick={() => handleCardClick(item)} className="cursor-pointer group">
                                            <div className="bg-card p-3 rounded-lg flex flex-col h-full border transition-shadow hover:shadow-lg">
                                                <div className="w-full h-24 bg-muted rounded-md relative overflow-hidden flex-shrink-0">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} alt={item.productName || 'Produit'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="50vw"/>
                                                    ) : (
                                                        <ShoppingBasket className="w-8 h-8 text-muted-foreground m-auto"/>
                                                    )}
                                                </div>
                                                <div className="flex-grow mt-2 overflow-hidden">
                                                    <p className="font-semibold leading-tight text-sm truncate group-hover:text-primary">{item.productName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{item.storeName}</p>
                                                </div>
                                                <div className="flex justify-between items-end mt-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={item.user?.photoURL} />
                                                            <AvatarFallback className="text-[8px]">{getInitials(item.user?.name || '?')}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate max-w-[80px]">{item.user?.name || 'Anonyme'}</span>
                                                    </div>
                                                    <div className="font-bold text-primary text-base whitespace-nowrap">
                                                        {item.price.toFixed(2)} DH
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted/20 rounded-lg">
                                    <p className="text-muted-foreground">Aucun bon plan à afficher pour le moment.</p>
                                </div>
                            )
                        }
                    </main>
                </div>
            </div>
        </div>
    );
}


export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/auth');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
      return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-pulse max-w-6xl">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/2 mt-2" />
            <div className="mt-8">
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="flex gap-8 mt-8">
                 <div className="w-56 hidden md:block space-y-4">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-8 w-1/2 mt-4" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                 </div>
                 <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  )
}

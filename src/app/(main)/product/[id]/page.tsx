
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Product, Price as PriceType, Store, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, Loader2, MapPin, Tag, ArrowLeft, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

interface PriceWithDetails extends PriceType {
    storeName: string;
    storeLocation?: { lat: number; lng: number };
    user: UserProfile | null;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [prices, setPrices] = useState<PriceWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const productId = params.id;

    useEffect(() => {
        if (!firestore || !productId) return;

        const fetchProductAndPrices = async () => {
            setIsLoading(true);
            try {
                // Fetch product details
                const productRef = doc(firestore, 'products', productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
                }

                // Fetch prices for this product
                const pricesQuery = query(
                    collection(firestore, 'prices'),
                    where('productId', '==', productId),
                    orderBy('createdAt', 'desc')
                );
                const pricesSnap = await getDocs(pricesQuery);

                const pricesData = await Promise.all(pricesSnap.docs.map(async (priceDoc) => {
                    const price = { id: priceDoc.id, ...priceDoc.data() } as PriceType;
                    
                    const storeSnap = price.storeId ? await getDoc(doc(firestore, 'stores', price.storeId)) : null;
                    const store = storeSnap?.exists() ? storeSnap.data() as Store : null;
                    const storeName = store?.name || 'Magasin inconnu';
                    
                    const userSnap = price.userId ? await getDoc(doc(firestore, 'users', price.userId)) : null;
                    const user = userSnap?.exists() ? { id: userSnap.id, ...userSnap.data() } as UserProfile : null;

                    return { ...price, storeName, user };
                }));
                
                setPrices(pricesData as PriceWithDetails[]);

            } catch (error) {
                console.error("Erreur lors de la récupération des détails du produit:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductAndPrices();

    }, [firestore, productId]);
    
     const getInitials = (name?: string | null) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1 && names[1]) {
            return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
     }


    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
                 <Skeleton className="h-10 w-24 mb-4" />
                <Card>
                    <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                        <Skeleton className="w-full md:w-64 h-64 rounded-lg" />
                        <div className="space-y-3 flex-1">
                            <Skeleton className="h-9 w-3/4" />
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                    </CardHeader>
                </Card>
                 <Skeleton className="h-10 w-48" />
                 <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }
    
    if (!product) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-8 text-center">
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <p>Produit non trouvé.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
             <Card>
                <CardHeader>
                   <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-full md:w-56 h-56 relative bg-muted rounded-lg flex-shrink-0">
                             {product.imageUrl ? (
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                             <h1 className="font-headline text-3xl md:text-4xl text-primary">{product.name}</h1>
                             {product.brand && <p className="text-lg text-muted-foreground">{product.brand}</p>}
                             {product.category && <Badge variant="outline">{product.category}</Badge>}
                        </div>
                   </div>
                </CardHeader>
            </Card>

            <div>
                <h2 className="text-2xl font-headline font-bold text-foreground mb-4">
                    Prix Signalés ({prices.length})
                </h2>

                {prices.length > 0 ? (
                    <div className="space-y-4">
                        {prices.map(price => (
                            <Card key={price.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground"/> {price.storeName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Il y a {formatDistanceToNow((price.createdAt as Timestamp).toDate(), { locale: fr })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">{price.price.toFixed(2)} DH</p>
                                    </div>
                                </div>
                                {price.user && (
                                    <div className="border-t mt-3 pt-3 flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">Signalé par :</p>
                                        <Link href={`/profile/${price.userId}`} className="flex items-center gap-2 text-xs hover:underline">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={price.user.photoURL} />
                                                <AvatarFallback>{getInitials(price.user.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{price.user.name}</span>
                                        </Link>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Aucun prix n'a encore été soumis pour ce produit.</p>
                        <Link href="/add-product">
                            <Button variant="link" className="mt-2">Soyez le premier à contribuer !</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

    
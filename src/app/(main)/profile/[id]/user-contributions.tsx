
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Price, Product, Store } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface UserContributionsProps {
    userId: string;
}

interface DetailedContribution extends Price {
    productName: string;
    productImageUrl?: string;
    storeName: string;
}

export function UserContributions({ userId }: UserContributionsProps) {
    const firestore = useFirestore();
    const [contributions, setContributions] = useState<DetailedContribution[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const contributionsQuery = useMemoFirebase(
        () => firestore ? query(
            collection(firestore, 'prices'), 
            where('userId', '==', userId), 
            orderBy('createdAt', 'desc'),
            limit(10)
        ) : null,
        [firestore, userId]
    );

    useEffect(() => {
        if (!contributionsQuery || !firestore) return;

        const fetchContributions = async () => {
            setIsLoading(true);
            try {
                const querySnapshot = await getDocs(contributionsQuery);
                const fetchedContributions = await Promise.all(querySnapshot.docs.map(async (priceDoc) => {
                    const priceData = { id: priceDoc.id, ...priceDoc.data() } as Price;
                    
                    let productName = 'Produit inconnu';
                    let productImageUrl: string | undefined;
                    let storeName = 'Magasin inconnu';

                    if (priceData.productId) {
                        const productSnap = await getDoc(doc(firestore, 'products', priceData.productId));
                        if (productSnap.exists()) {
                            const productData = productSnap.data() as Product;
                            productName = productData.name;
                            productImageUrl = productData.imageUrl;
                        }
                    }
                    
                    if (priceData.storeId) {
                        const storeSnap = await getDoc(doc(firestore, 'stores', priceData.storeId));
                        if (storeSnap.exists()) {
                            storeName = (storeSnap.data() as Store).name;
                        }
                    }

                    return { ...priceData, productName, productImageUrl, storeName };
                }));
                setContributions(fetchedContributions);
            } catch (error) {
                console.error("Failed to fetch user contributions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContributions();
    }, [contributionsQuery, firestore]);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
            </div>
        );
    }
    
    if (contributions.length === 0) {
        return (
            <div className="text-center py-10 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Aucune contribution pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {contributions.map(item => (
                <Link key={item.id} href={`/product/${item.productId}`} passHref>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-3 flex items-center gap-4">
                             <div className="w-16 h-16 bg-muted rounded-md relative overflow-hidden flex-shrink-0">
                                {item.productImageUrl ? (
                                    <Image src={item.productImageUrl} alt={item.productName} fill className="object-cover" sizes="64px"/>
                                ) : (
                                    <ImageIcon className="w-6 h-6 text-muted-foreground m-auto"/>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate">{item.productName}</p>
                                <p className="text-sm text-muted-foreground truncate">{item.storeName}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Il y a {formatDistanceToNow(item.createdAt.toDate(), { locale: fr })}
                                </p>
                            </div>
                            <div className="font-bold text-primary text-lg">
                                {item.price.toFixed(2)} DH
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

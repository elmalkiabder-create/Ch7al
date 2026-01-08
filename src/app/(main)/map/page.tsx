
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Price, Store } from '@/lib/types';
import { MapClient } from './map-client';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

type StoreForMap = {
  id: string; 
  name: string;
  position: { lat: number; lng: number };
}

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const firestore = useFirestore();
  const [storesForMap, setStoresForMap] = useState<StoreForMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContributions() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const pricesRef = collection(firestore, 'prices');
        const pricesSnapshot = await getDocs(pricesRef);
        
        const storesMap = new Map<string, StoreForMap>();

        for (const priceDoc of pricesSnapshot.docs) {
          const price = priceDoc.data() as Price;
          if (price.storeId && !storesMap.has(price.storeId)) {
            const storeRef = doc(firestore, 'stores', price.storeId);
            const storeSnap = await getDoc(storeRef);
            if (storeSnap.exists()) {
              const storeData = storeSnap.data() as Store;
              if (storeData.latitude && storeData.longitude) {
                storesMap.set(price.storeId, {
                  id: storeSnap.id,
                  name: storeData.name,
                  position: { lat: storeData.latitude, lng: storeData.longitude },
                });
              }
            }
          }
        }
        setStoresForMap(Array.from(storesMap.values()));

      } catch (error) {
        console.error("Failed to fetch contributions for map:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContributions();
  }, [firestore]);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col">
       <div className="p-4 border-b text-center">
         <h1 className="text-2xl font-headline font-bold text-center">Carte des Bons Plans</h1>
      </div>
      <div className="flex-1">
        {isLoading ? (
            <div className="flex items-center justify-center h-full bg-muted/20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : apiKey ? (
            <MapClient apiKey={apiKey} stores={storesForMap} />
        ) : (
            <div className="flex items-center justify-center h-full bg-muted/20">
                <div className="text-center text-muted-foreground p-4">
                    <p className="font-bold">Carte non disponible</p>
                    <p className="text-sm">Veuillez fournir une clé API Google Maps dans votre fichier `.env` pour afficher la carte.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

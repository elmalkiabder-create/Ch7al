
'use client';

import { useState, useTransition, Suspense, useEffect } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { Search, MapPin, Loader2, Frown, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/product-card';
import { searchProducts } from '@/ai/flows/search-products-flow';
import type { Product } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

// Ensure you have these in your .env.local file
const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaSearchApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!;

const searchClient = algoliasearch(algoliaAppId, algoliaSearchApiKey);
const index = searchClient.initIndex('products'); // Make sure your index name matches

function SearchPageComponent() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Product[]>([]);
  const [isAiSearching, startAiSearchTransition] = useTransition();
  const [isAlgoliaSearching, setIsAlgoliaSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([100]);
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);


  const debouncedQuery = useDebounce(query, 300);

  const performSearch = async (searchQuery: string, filters: Record<string, any> = {}) => {
      if (!searchQuery && !filters.price && !filters.location) {
        setHits([]);
        return;
      }
      setIsAlgoliaSearching(true);
      setError(null);

      try {
        // AI-powered search structuring
        const aiSearchPayload = {
            query: searchQuery,
            ...(filters.location && userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : {})
        };
        
        const structuredSearch = await searchProducts(aiSearchPayload);
        
        let searchOptions: any = {
            query: structuredSearch.query || searchQuery || '', // Fallback to original query
        };
        
        let allFilters = structuredSearch.filters ? [structuredSearch.filters] : [];
        if (filters.price < 100) { // Only apply price filter if it's not the max value
            allFilters.push(`price <= ${filters.price}`);
        }
        searchOptions.filters = allFilters.join(' AND ');

        if (structuredSearch.aroundLatLng) {
            searchOptions.aroundLatLng = structuredSearch.aroundLatLng;
            searchOptions.aroundRadius = 10000; // 10km radius
        }
        
        const { hits } = await index.search<Product>(searchOptions.query, searchOptions);

        // Map Algolia hits to our Product type
        const formattedHits = hits.map(hit => ({
            id: hit.objectID,
            name: hit.name,
            brand: hit.brand,
            category: hit.category,
            imageUrl: hit.imageUrl,
            price: hit.price,
        }));
        
        setHits(formattedHits);
      } catch (e) {
        console.error("Search error:", e);
        setError("La recherche a échoué. Veuillez réessayer.");
      } finally {
        setIsAlgoliaSearching(false);
      }
  }
  
  useEffect(() => {
    startAiSearchTransition(() => {
        performSearch(debouncedQuery, { price: priceRange[0], location: useLocation });
    });
  }, [debouncedQuery, priceRange, useLocation, userLocation]);


  const handleGetLocation = () => {
    if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setUseLocation(true);
                setIsLocating(false);
            },
            () => {
                setError("Impossible d'accéder à votre position.");
                setIsLocating(false);
                setUseLocation(false);
            }
        );
    } else {
        setError("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };


  const isSearching = isAiSearching || isAlgoliaSearching;

  const FilterPanel = () => (
    <div className="p-4 space-y-6">
        <div>
            <Label htmlFor="price-range" className="mb-2 block">Prix maximum: <span className="font-bold text-primary">{priceRange[0]} DH</span></Label>
            <Slider
                id="price-range"
                max={100}
                step={1}
                value={priceRange}
                onValueChange={setPriceRange}
            />
        </div>
        <div>
            <Button 
                onClick={handleGetLocation} 
                variant={useLocation ? "secondary" : "outline"} 
                className="w-full"
                disabled={isLocating}
            >
                {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4" />}
                Rechercher à proximité
            </Button>
            {useLocation && (
                <Button onClick={() => setUseLocation(false)} variant="ghost" size="sm" className="w-full mt-2 text-xs">
                    <X className="mr-1 h-3 w-3"/>
                    Effacer la localisation
                </Button>
            )}
        </div>
    </div>
  );


  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold text-center mb-4">Recherche</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un produit, une marque..."
            className="pl-10 h-12 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
           <div className="absolute right-1 top-1/2 -translate-y-1/2">
             <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Filter className="h-5 w-5 text-primary"/>
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Filtres de recherche</SheetTitle>
                    </SheetHeader>
                    <FilterPanel />
                </SheetContent>
            </Sheet>
           </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-destructive">{error}</p>
          </div>
        ) : hits.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {hits.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : debouncedQuery ? (
           <div className="text-center py-20 px-4">
                <Frown className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-lg font-semibold">Aucun résultat</h3>
                <p className="text-muted-foreground text-sm">
                    Nous n'avons rien trouvé pour "{debouncedQuery}". Essayez un autre terme de recherche.
                </p>
            </div>
        ) : (
             <div className="text-center py-20 px-4">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-lg font-semibold">Commencez votre recherche</h3>
                <p className="text-muted-foreground text-sm">
                    Utilisez la barre ci-dessus pour trouver les meilleurs prix.
                </p>
            </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SearchPageComponent />
        </Suspense>
    );
}

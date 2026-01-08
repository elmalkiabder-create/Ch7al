
'use client';

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

type StoreForMap = {
  id: string; 
  name: string;
  position: { lat: number; lng: number };
}

interface MapClientProps {
    apiKey: string;
    stores?: StoreForMap[];
}

// Component to display a clear, actionable error message.
const ErrorDisplay = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex items-center justify-center h-full bg-destructive/10 text-destructive-foreground p-4">
        <div className="text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive mb-3" />
            <h3 className="font-bold text-lg text-destructive">{title}</h3>
            <div className="text-sm text-destructive/80 max-w-md mx-auto">{children}</div>
        </div>
    </div>
);

export function MapClient({ apiKey, stores }: MapClientProps) {
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [isMapBlocked, setIsMapBlocked] = useState(false);

  useEffect(() => {
    // This is a global listener to detect the specific error from the Google Maps SDK.
    const originalConsoleError = window.console.error;
    const errorInterceptor = (...args: any[]) => {
      const errorMessage = args[0] || '';
      if (typeof errorMessage === 'string' && errorMessage.includes('ApiTargetBlockedMapError')) {
        // If we detect the error, we set a state to stop rendering the map.
        setIsMapBlocked(true);
      }
      // We still call the original console.error to not hide other potential issues.
      originalConsoleError.apply(console, args);
    };
    
    window.console.error = errorInterceptor;

    // Cleanup the interceptor when the component unmounts.
    return () => {
      window.console.error = originalConsoleError;
    };
  }, []);

  // First, check if the API key is provided at all.
  if (!apiKey || apiKey.includes('your-google-maps-api-key-here')) {
    return (
        <ErrorDisplay title="Carte non disponible">
          <p>
            La clé API Google Maps est manquante. Veuillez suivre les instructions
            dans votre fichier <code>README.md</code> pour la configurer.
          </p>
        </ErrorDisplay>
    );
  }

  // If the ApiTargetBlockedMapError has been detected, show the specific instructions.
  // This prevents the app from crashing with the 'getRootNode' error.
  if (isMapBlocked) {
     return (
        <ErrorDisplay title="Accès à la carte bloqué par Google">
          <p className="mb-4">
            Pour votre sécurité, votre clé API ne fonctionne que sur les sites web que vous autorisez.
          </p>
          <p className="font-semibold mb-2">Pour résoudre ce problème :</p>
          <ol className="text-left list-decimal list-inside text-xs space-y-1">
              <li>Ouvrez la <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-bold">console Google Cloud</a>.</li>
              <li>Cliquez sur votre clé API (<code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>).</li>
              <li>Sous "Restrictions de sites web", cliquez sur "AJOUTER".</li>
              <li>Ajoutez une nouvelle entrée : <code>*.cloudworkstations.dev</code></li>
              <li>Cliquez sur "Enregistrer" et attendez 2 minutes avant de rafraîchir la page.</li>
          </ol>
        </ErrorDisplay>
    );
  }
  
  const defaultCenter = stores && stores.length > 0 
    ? stores[0].position 
    : { lat: 33.8935, lng: -5.5473 }; // Center on Meknès

  const validStores = stores || [];

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={13}
        mapId="ch7al-map"
        gestureHandling={'cooperative'}
        disableDefaultUI={false}
        zoomControl={true}
        onClick={() => setActiveStoreId(null)}
      >
        {!isMapBlocked && validStores.map(store => (
            <AdvancedMarker 
                key={store.id} 
                position={store.position}
                onClick={() => setActiveStoreId(store.id)}
            >
              <Pin 
                background={'hsl(var(--primary))'} 
                borderColor={'white'} 
                glyphColor={'white'}
              />
            </AdvancedMarker>
        ))}

        {!isMapBlocked && activeStoreId && (
          <InfoWindow
            position={validStores.find(s => s.id === activeStoreId)?.position}
            onCloseClick={() => setActiveStoreId(null)}
          >
            <div className="p-1">
              <p className="font-semibold text-foreground">{validStores.find(s => s.id === activeStoreId)?.name}</p>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}

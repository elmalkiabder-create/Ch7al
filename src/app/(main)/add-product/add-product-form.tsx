
'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { identifyProduct } from '@/ai/flows/identify-product-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MapPin, X, Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { runTransaction, doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { z } from 'zod';

// Correction TypeScript pour Image constructor
declare global {
    interface Window {
        Image: typeof Image;
    }
}


const meknèsQuartiers = [
    "Agdal", "Al Bassatine", "Belle Vue", "Berrima", "Diour Salam", 
    "El Hedim (Médina)", "El Menzeh", "Hamria", "Hay Salam", "Kamal", 
    "Marjane", "Plaisance", "Riad", "Rouamzine", "Touarga", "Wislane", "Zitoune"
];

const CameraView = ({ onCapture, onBack }: { onCapture: (dataUri: string) => void, onBack: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [currentFacingMode, setCurrentFacingMode] = useState('environment');
    const [showTips, setShowTips] = useState(true);
    const [isHighQualityMode, setIsHighQualityMode] = useState(false);

    const getCameraStream = useCallback(async (facingMode: 'user' | 'environment') => {
        // Stop any existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
            video: { 
                facingMode: { exact: facingMode },
                width: { ideal: isHighQualityMode ? 1920 : 1280 },
                height: { ideal: isHighQualityMode ? 1080 : 720 },
                aspectRatio: { ideal: 16/9 }
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
            setCurrentFacingMode(facingMode);
        } catch (error) {
            console.warn(`Could not get ${facingMode} camera, trying any camera.`);
            try {
                const anyStream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = anyStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = anyStream;
                }
                setHasCameraPermission(true);
                // Determine the facing mode of the fallback stream
                const settings = anyStream.getVideoTracks()[0].getSettings();
                setCurrentFacingMode(settings.facingMode === 'user' ? 'user' : 'environment');

            } catch (finalError) {
                console.error('Error accessing any camera:', finalError);
                setHasCameraPermission(false);
            }
        }
    }, []);

    useEffect(() => {
        getCameraStream('environment'); // Attempt to open the back camera first

        return () => {
            // Stop the stream when the component unmounts
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [getCameraStream]);


    const handleCaptureClick = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    };
    
    const switchCamera = () => {
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        getCameraStream(newFacingMode);
    }

    return (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Button onClick={onBack} variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                    <CardTitle className="text-lg">Identifier avec l'IA</CardTitle>
                    <div className="w-16"></div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {showTips && (
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertTitle className="text-blue-800">💡 Conseils pour une meilleure reconnaissance</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            <ul className="text-sm space-y-1 mt-2">
                                <li>• Bon éclairage, évitez les ombres</li>
                                <li>• Photo centrée sur le produit</li>
                                <li>• Arrière-plan simple et uni</li>
                                <li>• Étiquette du produit bien visible</li>
                            </ul>
                            <Button 
                                variant="link" 
                                size="sm" 
                                onClick={() => setShowTips(false)}
                                className="text-blue-600 p-0 h-auto mt-2"
                            >
                                Masquer les conseils
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                 <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    {hasCameraPermission === null && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Accès à la caméra refusé</AlertTitle>
                        <AlertDescription>
                            Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonction.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex gap-2">
                    <Button onClick={switchCamera} variant="outline" className="w-full" disabled={!hasCameraPermission}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Changer
                    </Button>
                    <Button 
                        onClick={() => setIsHighQualityMode(!isHighQualityMode)} 
                        variant={isHighQualityMode ? "default" : "outline"} 
                        className="w-full" 
                        disabled={!hasCameraPermission}
                    >
                        {isHighQualityMode ? "HD" : "SD"}
                    </Button>
                    <Button onClick={handleCaptureClick} className="w-full" disabled={!hasCameraPermission}>
                        <Camera className="mr-2 h-4 w-4" />
                        Prendre la photo
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const FormSchema = z.object({
  productName: z.string().min(1, "Le nom du produit est requis."),
  price: z.string().refine(val => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0, {
    message: "Le prix doit être un nombre positif.",
  }),
  storeName: z.string().min(1, "Le nom du magasin est requis."),
});


export function AddProductForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const storage = firestore ? getStorage(firestore.app) : null;

    const [isSubmittingPrice, startPriceTransition] = useTransition();

    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [storeName, setStoreName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [photoDataUri, setPhotoDataUri] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Meknès');
    const [neighborhood, setNeighborhood] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    
    const [formErrors, setFormErrors] = useState<{productName?: string, price?: string, storeName?: string, userId?: string}>({});

    const [isLocating, setIsLocating] = useState(false);
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
    
    useEffect(() => {
        const nameParam = searchParams.get('name');
        const brandParam = searchParams.get('brand');
        const categoryParam = searchParams.get('category');
        const photoParam = searchParams.get('photoDataUri');

        if (nameParam) setProductName(nameParam);
        if (brandParam) setBrand(brandParam);
        if (categoryParam) setCategory(categoryParam);
        if (photoParam) setPhotoDataUri(photoParam);
    }, [searchParams]);


    const handleCapture = async (dataUri: string | null) => {
        if (!dataUri) {
            setIsCameraOpen(false);
            return;
        }
        setIsIdentifying(true);
        setIsCameraOpen(false);
        
        try {
            // Améliorer la qualité de l'image pour une meilleure reconnaissance
            const enhancedDataUri = await enhanceImageForRecognition(dataUri);
            
            const finalDataUri = enhancedDataUri.startsWith('data:image/jpeg;base64,') 
                ? enhancedDataUri 
                : 'data:image/jpeg;base64,' + enhancedDataUri.split(',')[1];

            setPhotoDataUri(finalDataUri);
            
            const result = await identifyProduct({ photoDataUri: finalDataUri });
            setProductName(result.name);
            setBrand(result.brand);
            setCategory(result.category);
            if (result.price) {
                setPrice(result.price.toString().replace('.', ','));
            }
            
            toast({
                title: "Produit Identifié! 🎯",
                description: `C'est un(e) ${result.name}. ${result.price ? `Prix détecté: ${result.price} DH.` : ''}`,
            })
        } catch (e: any) {
            console.error("Erreur d'identification IA:", e);
            toast({
                variant: "destructive",
                title: "Erreur d'identification",
                description: "L'IA n'a pas pu identifier le produit. Essayez de prendre une photo plus claire ou remplissez les champs manuellement.",
            });
        } finally {
            setIsIdentifying(false);
        }
    };

    // Fonction pour améliorer la qualité de l'image pour la reconnaissance IA
    const enhanceImageForRecognition = async (dataUri: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = document.createElement('img'); // Correction TypeScript
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    resolve(dataUri);
                    return;
                }

                // Dimensions optimales pour l'IA (max 1024px pour le plus grand côté)
                const maxSize = 1024;
                let { width, height } = img;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Améliorer le contraste et la netteté
                ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
                ctx.drawImage(img, 0, 0, width, height);
                
                // Réinitialiser le filtre pour éviter les artefacts
                ctx.filter = 'none';
                
                // Appliquer une légère netteté
                ctx.globalCompositeOperation = 'overlay';
                ctx.globalAlpha = 0.1;
                ctx.drawImage(canvas, 0, 0);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;

                // Qualité élevée pour la reconnaissance
                const enhancedDataUri = canvas.toDataURL('image/jpeg', 0.95);
                resolve(enhancedDataUri);
            };
            
            img.onerror = () => resolve(dataUri);
            img.src = dataUri;
        });
    };

    const uploadImage = async (dataUri: string, userId: string): Promise<string | null> => {
        if (!storage) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Le service de stockage n'est pas initialisé." });
            return null;
        }
        
        try {
            const imagePath = `product-images/${Date.now()}-${userId}.jpg`;
            const imageRef = storageRef(storage, imagePath);
    
            const snapshot = await uploadString(imageRef, dataUri, 'data_url');
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error: any) {
            console.error("Erreur de téléversement d'image:", error);
            if (error.code === 'storage/unauthorized') {
                 toast({
                    variant: 'destructive',
                    title: 'Erreur de permission',
                    description: "Vous n'avez pas la permission de téléverser des images. Vérifiez les règles de sécurité de Firebase Storage et la configuration CORS.",
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Erreur de téléversement',
                    description: "Impossible d'enregistrer l'image du produit.",
                });
            }
            return null;
        }
    }


    const handlePriceSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Utilisateur non connecté ou service indisponible.' });
            return;
        }

        const validation = FormSchema.safeParse({ productName, price, storeName });
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            setFormErrors({
                productName: errors.productName?.[0],
                price: errors.price?.[0],
                storeName: errors.storeName?.[0],
            });
            return;
        }
        setFormErrors({});

        startPriceTransition(async () => {
            try {
                let finalImageUrl: string | undefined | null = photoDataUri;
                
                if (photoDataUri && photoDataUri.startsWith('data:image')) {
                  finalImageUrl = await uploadImage(photoDataUri, user.uid);
                  if (finalImageUrl === null) {
                      throw new Error("Le téléversement de l'image a échoué, la soumission du prix est annulée.");
                  }
                }
                
                const parsedPrice = parseFloat(price.replace(',', '.'));

                await runTransaction(firestore, async (transaction) => {
                  const productsCollection = collection(firestore, 'products');
                  const storesCollection = collection(firestore, 'stores');
                  const pricesCollection = collection(firestore, 'prices');
                  const usersCollection = collection(firestore, 'users');

                  const productDocId = productName.trim().toLowerCase().replace(/\s+/g, '-');
                  const productRef = doc(productsCollection, productDocId);
                  const productSnap = await transaction.get(productRef);
                  
                  const storeDocId = storeName.trim().toLowerCase().replace(/\s+/g, '-');
                  const storeRef = doc(storesCollection, storeDocId);
                  const storeSnap = await transaction.get(storeRef);
                  
                  if (!storeSnap.exists()) {
                    transaction.set(storeRef, {
                      name: storeName.trim(),
                      address: address || null,
                      city: city || null,
                      neighborhood: neighborhood || null,
                      latitude: latitude || null,
                      longitude: longitude || null,
                      createdAt: serverTimestamp(),
                      addedBy: user.uid,
                    });
                  } else {
                    // Optionally update store data if it exists, e.g., last seen timestamp
                    // transaction.update(storeRef, { updatedAt: serverTimestamp() });
                  }
                  
                  const productData: any = {
                      name: productName.trim(),
                      brand: brand || '',
                      category: category || '',
                      updatedAt: serverTimestamp(),
                  };

                  if (!productSnap.exists()) {
                    productData.createdAt = serverTimestamp();
                    productData.uploadedBy = user.uid; // Add this line
                    if(finalImageUrl) productData.imageUrl = finalImageUrl;
                    transaction.set(productRef, productData);
                  } else {
                    const updateData: any = { updatedAt: serverTimestamp() };
                    if (finalImageUrl && !productSnap.data()?.imageUrl) {
                        updateData.imageUrl = finalImageUrl;
                    }
                    transaction.update(productRef, updateData);
                  }

                  const priceRef = doc(pricesCollection);
                  transaction.set(priceRef, {
                    productId: productRef.id,
                    storeId: storeRef.id,
                    userId: user.uid,
                    price: parsedPrice,
                    createdAt: serverTimestamp(),
                    verified: false,
                    upvotes: [],
                    downvotes: [],
                    voteScore: 0,
                  });

                  const userRef = doc(usersCollection, user.uid);
                  // Use set with merge: true to create or update the user document safely.
                  transaction.set(userRef, {
                    points: increment(10),
                    contributions: increment(1),
                  }, { merge: true });
                });
                
                toast({
                    title: 'Succès !',
                    description: `Prix pour ${productName} ajouté avec succès ! (+10 points)`,
                    duration: 4000,
                });
                router.push('/dashboard');

            } catch (error: any) {
                console.error("Erreur lors de l'ajout du prix:", error);
                const errorMessage = typeof error.message === 'string' 
                    ? error.message 
                    : "Une erreur est survenue lors de l'ajout du prix.";
                toast({
                    variant: 'destructive',
                    title: 'Erreur de soumission',
                    description: errorMessage,
                });
            }
        });
    }

    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Géolocalisation non supportée par votre navigateur.' });
            return;
        }
    
        setIsLocating(true);
    
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude);
                setLongitude(longitude);
                setAddress(`Position GPS : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                toast({ title: 'Localisation obtenue !' });
                setIsLocating(false);
            },
            (error) => {
                let title = 'Erreur de localisation';
                let description = "Impossible d'obtenir votre position actuelle.";
    
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        title = 'Permission refusée';
                        description = "Vous avez refusé l'accès à la géolocalisation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        title = 'Position non disponible';
                        description = "Les informations de localisation ne sont pas disponibles.";
                        break;
                    case error.TIMEOUT:
                        title = 'Timeout';
                        description = "La demande de localisation a expiré.";
                        break;
                }
    
                toast({ variant: 'destructive', title, description });
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [toast]);
    
    const stopLocating = () => {
        setIsLocating(false);
        toast({ title: 'Recherche de localisation annulée.' });
    };

    const removeImage = () => {
        setPhotoDataUri('');
    }

    if (isCameraOpen) {
        return <CameraView onCapture={handleCapture} onBack={() => setIsCameraOpen(false)} />;
    }

  return (
    <div className="space-y-8">
        <Card className="overflow-hidden">
            <CardHeader className="text-center">
                 <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        {isIdentifying ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Camera className="h-8 w-8 text-primary" />}
                    </div>
                </div>
                <CardTitle className="font-headline text-3xl text-primary">Ajouter un prix</CardTitle>
                <CardDescription>
                    {isIdentifying ? "Identification du produit en cours..." : "Prenez une photo pour identifier un produit et ajouter son prix."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-6">
                    <Button onClick={() => setIsCameraOpen(true)} size="lg" className="w-full h-auto py-4 flex-col gap-2" disabled={isIdentifying}>
                        <Camera className="h-6 w-6" />
                        <span>Prendre une photo</span>
                    </Button>
                </div>
                 <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Ou remplir manuellement</span>
                    </div>
                </div>

                <form onSubmit={handlePriceSubmit} className="space-y-6">
                    {formErrors.userId && <p className="text-sm font-medium text-destructive">{formErrors.userId}</p>}

                    {photoDataUri && (
                        <div className="space-y-2">
                            <Label>Aperçu de l'image</Label>
                            <div className="relative aspect-video w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
                                <Image src={photoDataUri} alt="Aperçu du produit" fill className="object-contain" sizes="50vw" />
                                 <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={removeImage}
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Supprimer l'image</span>
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="productName">Nom du produit</Label>
                                <Input id="productName" name="productName" placeholder="ex: Canette de Coca-Cola" value={productName} onChange={(e) => setProductName(e.target.value)} required/>
                                {formErrors.productName && <p className="text-sm font-medium text-destructive">{formErrors.productName}</p>}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="price">Prix</Label>
                                <div className="relative">
                                    <Input id="price" name="price" type="text" inputMode="decimal" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} className="pl-4 pr-12" required/>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground text-sm">
                                        DH
                                    </span>
                                </div>
                                {formErrors.price && <p className="text-sm font-medium text-destructive">{formErrors.price}</p>}
                            </div>
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">Lieu (Hanout)</Label>
                            <Input id="storeName" name="storeName" placeholder="ex: Epicerie Al Amal" value={storeName} onChange={e => setStoreName(e.target.value)} required />
                            {formErrors.storeName && <p className="text-sm font-medium text-destructive">{formErrors.storeName}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Adresse ou point de repère</Label>
                            <div className="flex gap-2">
                                <Input id="address" name="address" placeholder="Près de la mosquée, etc." value={address} onChange={(e) => setAddress(e.target.value)} />
                                 <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin"/> : <MapPin className="h-4 w-4 text-primary" />}
                                    <span className="sr-only">Géolocaliser</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">Ville</Label>
                            <Input id="city" name="city" value={city} readOnly disabled className="bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="neighborhood">Quartier</Label>
                             <Select onValueChange={setNeighborhood} value={neighborhood}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un quartier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {meknèsQuartiers.sort().map(quartier => (
                                        <SelectItem key={quartier} value={quartier}>
                                            {quartier}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button type="submit" disabled={isSubmittingPrice || !user} className="w-full text-lg h-12">
                        {isSubmittingPrice ? (
                            <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Ajout en cours...
                            </>
                        ) : (
                            "Ajouter le prix"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}

    
    

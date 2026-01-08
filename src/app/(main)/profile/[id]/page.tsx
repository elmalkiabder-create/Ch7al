'use client';

import React, { useState, useRef, useTransition, useEffect } from "react";
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { useAuth } from "@/firebase/provider";
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, BarChart3, ArrowLeft, Award, List, Settings, Camera, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserContributions } from "./user-contributions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";


export default function PublicProfilePage({ params }: { params: { id: string }}) {
    const firestore = useFirestore();
    const storage = firestore ? getStorage(firestore.app) : null;
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { id: userId } = params;
    const { user: currentUser } = useUser();
    
    const [isUploading, startUploadingTransition] = useTransition();
    const [isUpdatingName, startNameUpdateTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newUsername, setNewUsername] = useState("");

    const isOwner = currentUser?.uid === userId;

    const userProfileRef = useMemoFirebase(
      () => (userId ? doc(firestore, 'users', userId) : null),
      [userId, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (userProfile?.name) {
            setNewUsername(userProfile.name);
        }
    }, [userProfile?.name]);
    

    const getInitials = (name?: string | null) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1 && names[1]) {
            return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUri = e.target?.result as string;
                if (dataUri) {
                    handleUploadConfirm(dataUri);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleUploadConfirm = async (dataUri: string) => {
        if (!currentUser || !storage || !firestore || !auth?.currentUser) return;
        
        startUploadingTransition(async () => {
            try {
                const imagePath = `profile-pictures/${currentUser.uid}/profile.jpg`;
                const imageRef = storageRef(storage, imagePath);

                const snapshot = await uploadString(imageRef, dataUri, 'data_url');
                const downloadURL = await getDownloadURL(snapshot.ref);

                const finalUrl = `${downloadURL}?t=${new Date().getTime()}`;

                await updateAuthProfile(auth.currentUser, { photoURL: finalUrl });
                await updateDoc(doc(firestore, 'users', currentUser.uid), { photoURL: finalUrl });

                toast({ title: 'Succès !', description: "Photo de profil mise à jour." });
            } catch (error: any) {
                 console.error("Error uploading profile picture:", error);
                 let description = 'Impossible de téléverser la photo.';
                 if (error.code === 'storage/unauthorized') {
                    description = "Permission refusée. Vérifiez les règles de sécurité de Firebase Storage.";
                 }
                 toast({ variant: 'destructive', title: 'Erreur', description });
            }
        });
    };

    const handleNameUpdate = async () => {
        if (!currentUser || !firestore || !auth?.currentUser || !newUsername.trim()) return;

        startNameUpdateTransition(async () => {
            try {
                await updateAuthProfile(auth.currentUser, { displayName: newUsername });
                await updateDoc(doc(firestore, 'users', currentUser.uid), { name: newUsername });
                 toast({ title: 'Succès !', description: "Votre nom a été mis à jour." });
            } catch (error) {
                console.error("Error updating name:", error);
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le nom.' });
            }
        });
    }

    if (isProfileLoading) {
        return (
             <div className="bg-gradient-to-b from-primary/90 via-primary to-primary/90 h-full p-4 space-y-6 flex flex-col">
                 <div className="absolute top-4 left-4">
                    <Skeleton className="h-10 w-24 bg-white/20" />
                 </div>
                <div className="flex-grow flex flex-col items-center justify-center text-center text-primary-foreground">
                    <Skeleton className="w-28 h-28 rounded-full mb-4 bg-white/20"/>
                    <Skeleton className="h-8 w-40 mb-2 bg-white/20"/>
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-20 w-full rounded-lg bg-white/20"/>
                    <Skeleton className="h-20 w-full rounded-lg bg-white/20"/>
                    <Skeleton className="h-12 w-full rounded-lg bg-white/20"/>
                </div>
            </div>
        );
    }
    
    if (!userProfile) {
        return (
            <div className="container mx-auto text-center py-10">
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <p>Profil utilisateur non trouvé.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="bg-gradient-to-b from-primary/90 via-primary to-primary/90 p-4 space-y-6">
                
                <div className="absolute top-4 left-4 z-10">
                    <Button variant="ghost" onClick={() => router.back()} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                </div>
                 {isOwner && (
                    <div className="absolute top-4 right-4 z-10">
                        <Link href="/settings" passHref>
                            <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20">
                                <Settings className="h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                )}


                <div className="flex flex-col items-center justify-center text-center text-primary-foreground pt-12">
                    <div className="relative group">
                        <Avatar className="w-28 h-28 mb-4 border-4 border-white shadow-lg">
                            <AvatarImage src={userProfile?.photoURL} alt={userProfile?.name} />
                            <AvatarFallback className="text-4xl bg-white text-primary">
                                {getInitials(userProfile?.name)}
                            </AvatarFallback>
                        </Avatar>
                        {isOwner && (
                             <>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-4 -right-2 bg-white h-10 w-10 rounded-full flex items-center justify-center shadow-md border-2 border-primary hover:bg-gray-100 transition-colors"
                                    aria-label="Changer la photo de profil"
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <Camera className="h-5 w-5 text-primary" />}
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    hidden 
                                    accept="image/png, image/jpeg, image/webp" 
                                    onChange={handleFileChange}
                                />
                             </>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <h1 className="text-3xl font-bold">{userProfile?.name || 'Utilisateur'}</h1>
                         {isOwner && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 rounded-full h-8 w-8">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Changer votre nom d'affichage</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Ce nom sera visible par les autres utilisateurs.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-2">
                                        <Input 
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="Nouveau nom"
                                            disabled={isUpdatingName}
                                        />
                                    </div>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleNameUpdate} disabled={isUpdatingName || !newUsername.trim() || newUsername.trim() === userProfile.name}>
                                        {isUpdatingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Sauvegarder"}
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                    </div>
                     <p className="text-sm text-primary-foreground/80">{userProfile.email}</p>
                </div>

                <div className="space-y-2">
                     <Card className="bg-card/90 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Trophy className="w-8 h-8 text-primary" />
                            <div>
                                <p className="font-bold text-2xl">{userProfile?.points || 0}</p>
                                <p className="text-sm text-muted-foreground">Points Cumulés</p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="bg-card/90 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <BarChart3 className="w-8 h-8 text-primary" />
                            <div>
                                <p className="font-bold text-2xl">{userProfile?.contributions || 0}</p>
                                <p className="text-sm text-muted-foreground">Contributions</p>
                            </div>
                        </CardContent>
                    </Card>
                    {userProfile.badges && userProfile.badges.length > 0 && (
                     <Card className="bg-card/90 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Award className="w-8 h-8 text-primary" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground mb-2">Badges Obtenus</p>
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.badges.map((badge, index) => (
                                        <Badge key={index} variant="secondary" className="text-sm border-primary/50">
                                           🥉 {badge}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                </div>
            </div>
            <div className="flex-1 bg-background p-4 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <List className="w-5 h-5 text-primary" />
                    Contributions Récentes
                </h2>
                <UserContributions userId={userId} />
            </div>
        </div>
    );
}

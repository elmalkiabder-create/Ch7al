
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import type { LeaderboardEntry, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, orderBy('points', 'desc'), limit(50));
        
        const querySnapshot = await getDocs(q);
        
        const fetchedContributors = querySnapshot.docs.map((doc, index) => {
          const userData = doc.data() as UserProfile;
          return {
            id: doc.id,
            userId: doc.id,
            username: userData.name || 'Utilisateur anonyme',
            points: userData.points || 0,
            rank: index + 1,
            avatar: userData.photoURL || '',
          };
        });

        setContributors(fetchedContributors);

      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, [firestore]);
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const getRankCardClass = (rank: number) => {
    switch(rank) {
        case 1: return "bg-amber-400/20 border-amber-500";
        case 2: return "bg-slate-400/20 border-slate-500";
        case 3: return "bg-orange-400/20 border-orange-500";
        default: return "bg-card";
    }
  }

   const getRankTextColor = (rank: number) => {
    switch(rank) {
        case 1: return "text-amber-500";
        case 2: return "text-slate-600 dark:text-slate-300";
        case 3: return "text-orange-600 dark:text-orange-400";
        default: return "text-muted-foreground";
    }
  }


  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
            <Trophy className="mx-auto h-12 w-12 text-primary mb-2"/>
            <h1 className="text-3xl font-bold text-center">Classement</h1>
            <p className="text-muted-foreground">Qui sont les meilleurs contributeurs ?</p>
        </div>
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {contributors.map((contributor) => (
                <Card key={contributor.id} className={cn("p-4 flex items-center gap-4 transition-all border-2", getRankCardClass(contributor.rank))}>
                    <div className={cn("flex items-center justify-center h-8 w-8 rounded-full font-bold text-lg", getRankTextColor(contributor.rank))}>
                        {contributor.rank}
                    </div>

                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={contributor.avatar} alt={contributor.username} />
                    <AvatarFallback>{getInitials(contributor.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{contributor.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">{contributor.points || 0}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
    </div>
  );
}

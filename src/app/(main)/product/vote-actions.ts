
'use server';

import { doc, runTransaction, type Firestore } from 'firebase/firestore';
import { z } from 'zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { VoteFormState } from '@/lib/types';

const voteSchema = z.object({
  priceId: z.string().min(1),
  userId: z.string().min(1, 'Utilisateur non connecté.'),
  voteType: z.enum(['upvote', 'downvote']),
});

export async function handleVote(
    db: Firestore,
    data: z.infer<typeof voteSchema>
): Promise<VoteFormState> {

    const validatedFields = voteSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'Données de vote invalides.',
        };
    }

    const { priceId, userId, voteType } = validatedFields.data;
    const priceRef = doc(db, 'prices', priceId);

    try {
        await runTransaction(db, async (transaction) => {
            const priceDoc = await transaction.get(priceRef);
            if (!priceDoc.exists()) {
                throw new Error("La soumission de prix n'existe pas.");
            }

            const priceData = priceDoc.data();
            let upvotes: string[] = priceData.upvotes || [];
            let downvotes: string[] = priceData.downvotes || [];

            const hasUpvoted = upvotes.includes(userId);
            const hasDownvoted = downvotes.includes(userId);

            if (voteType === 'upvote') {
                upvotes = hasUpvoted ? upvotes.filter(id => id !== userId) : [...upvotes, userId];
                if (!hasUpvoted && hasDownvoted) {
                    downvotes = downvotes.filter(id => id !== userId);
                }
            } else if (voteType === 'downvote') {
                downvotes = hasDownvoted ? downvotes.filter(id => id !== userId) : [...downvotes, userId];
                if (!hasDownvoted && hasUpvoted) {
                    upvotes = upvotes.filter(id => id !== userId);
                }
            }
            
            const voteScore = upvotes.length - downvotes.length;
            
            const updatedData = { upvotes, downvotes, voteScore };
            transaction.update(priceRef, updatedData);
        });

        return { status: 'success' as const, message: 'Vote enregistré !' };

    } catch (error: any) {
        console.error("Erreur lors du vote:", error);
        
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: priceRef.path,
                operation: 'update',
                requestResourceData: { 
                    userId, 
                    voteType 
                }
            });
            errorEmitter.emit('permission-error', permissionError);
            return { status: 'error' as const, message: 'Permission refusée par les règles de sécurité.' };
        }

        return { status: 'error' as const, message: error.message || 'Une erreur est survenue.' };
    }
}

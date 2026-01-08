

import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type Contribution = {
  id: string;
  productName: string;
  storeName: string;
  price: number;
  date: Date;
  latitude: number | null;
  longitude: number | null;
  imageUrl?: string;
  userId: string;
  product: Product | null;
  store: Store | null;
  user: UserProfile | null;
  upvotes: string[];
  downvotes: string[];
  voteScore: number;
  createdAt: Timestamp; // Keep original timestamp
};

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageHint: z.string().optional(),
  price: z.number().optional(),
  uploadedBy: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  description: z.string().optional(),
});
export type Product = z.infer<typeof ProductSchema>;


export type Price = {
    id: string;
    productId: string;
    storeId: string;
    userId: string;
    price: number;
    createdAt: Timestamp;
    verified: boolean;
    upvotes: string[];
    downvotes: string[];
    voteScore: number;
}

export type Store = {
    id: string;
    name: string;
    address?: string;
    city?: string;
    neighborhood?: string;
    addedBy?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    latitude: number | null;
    longitude: number | null;
}

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    points?: number;
    contributions?: number;
    badges?: string[];
    language: string;
    createdAt: Timestamp;
    role?: 'admin' | 'user';
}

export type Comment = {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    text: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | Date | Timestamp;
}

export type LeaderboardEntry = {
    id: string;
    userId: string;
    username: string;
    points: number;
    rank: number;
    avatar: string;
};

export type VoteFormState = {
    status: 'idle' | 'success' | 'error';
    message: string;
}

// ===== Genkit Flow Schemas and Types =====

// --- Identify Product Flow ---
export const IdentifyProductInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyProductInput = z.infer<typeof IdentifyProductInputSchema>;

export const IdentifyProductOutputSchema = z.object({
  name: z.string().describe('Le nom du produit identifié.'),
  brand: z.string().describe('La marque du produit identifié.'),
  category: z.string().describe('La catégorie à laquelle le produit appartient (par exemple, Boissons, Snacks, etc.).'),
  price: z.number().optional().describe("Le prix du produit identifié, si visible sur l'image."),
});
export type IdentifyProductOutput = z.infer<typeof IdentifyProductOutputSchema>;

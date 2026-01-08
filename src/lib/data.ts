
import type { Contribution, Contributor, Product, UserProfile } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const userBadges: { name: string, emoji: string }[] = [
    { name: 'débutant', emoji: '🥉' },
    { name: 'contributeur', emoji: '🥈' },
    { name: 'expert', emoji: '🥇' },
];

const mockUsers: UserProfile[] = [
    { id: 'user-1', name: 'Fatima', email: 'fatima@example.com', photoURL: PlaceHolderImages.find(p => p.id === 'user-avatar-2')?.imageUrl, points: 150, contributions: 12, language: 'fr', createdAt: new Date() as any },
    { id: 'user-2', name: 'Youssef', email: 'youssef@example.com', photoURL: PlaceHolderImages.find(p => p.id === 'user-avatar-1')?.imageUrl, points: 90, contributions: 8, language: 'fr', createdAt: new Date() as any },
    { id: 'user-3', name: 'Amine', email: 'amine@example.com', photoURL: PlaceHolderImages.find(p => p.id === 'user-avatar-3')?.imageUrl, points: 210, contributions: 25, language: 'fr', createdAt: new Date() as any },
    { id: 'user-4', name: 'Sofia', email: 'sofia@example.com', photoURL: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', points: 50, contributions: 5, language: 'fr', createdAt: new Date() as any },
    { id: 'user-5', name: 'Mehdi', email: 'mehdi@example.com', photoURL: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', points: 120, contributions: 15, language: 'fr', createdAt: new Date() as any },
];

const mockProducts: Product[] = [
    { id: 'prod-1', name: 'Canette de Coca-Cola', brand: 'Coca-Cola', category: 'Boissons', imageUrl: PlaceHolderImages.find(p => p.id === 'product-1')?.imageUrl },
    { id: 'prod-2', name: 'Paquet de chips Lay\'s Nature', brand: 'Lay\'s', category: 'Snacks', imageUrl: PlaceHolderImages.find(p => p.id === 'product-2')?.imageUrl },
    { id: 'prod-3', name: 'Bouteille d\'eau Sidi Ali (1.5L)', brand: 'Sidi Ali', category: 'Boissons', imageUrl: PlaceHolderImages.find(p => p.id === 'product-3')?.imageUrl },
    { id: 'prod-4', name: 'Yaourt Danone Velouté', brand: 'Danone', category: 'Produits laitiers' },
    { id: 'prod-5', name: 'Pain de mie complet', brand: 'Bimbo', category: 'Boulangerie' },
];

const mockStores = [
    { id: 'store-1', name: 'Épicerie Al Amal', neighborhood: 'Hamria' },
    { id: 'store-2', name: 'Hanout Omar', neighborhood: 'Agdal' },
    { id: 'store-3', name: 'Superette an-Najah', neighborhood: 'Al Bassatine' },
    { id: 'store-4', name: 'Chez Rachid', neighborhood: 'Hay Salam' },
];

export const mockContributions: Contribution[] = [
    {
        id: 'price-1',
        productId: 'prod-1',
        storeId: 'store-1',
        userId: 'user-1',
        price: 3.50,
        createdAt: new Date(Date.now() - 2 * 60 * 1000) as any, // 2 minutes ago
        productName: mockProducts[0].name,
        storeName: mockStores[0].name,
        imageUrl: mockProducts[0].imageUrl,
        user: mockUsers[0],
        product: mockProducts[0],
        store: mockStores[0] as any,
        upvotes: ['user-2', 'user-3'],
        downvotes: [],
        voteScore: 2,
        date: new Date(Date.now() - 2 * 60 * 1000) as any,
        latitude: 33.8935,
        longitude: -5.5473,
    },
    {
        id: 'price-2',
        productId: 'prod-2',
        storeId: 'store-2',
        userId: 'user-2',
        price: 5.00,
        createdAt: new Date(Date.now() - 15 * 60 * 1000) as any, // 15 minutes ago
        productName: mockProducts[1].name,
        storeName: mockStores[1].name,
        imageUrl: mockProducts[1].imageUrl,
        user: mockUsers[1],
        product: mockProducts[1],
        store: mockStores[1] as any,
        upvotes: ['user-1', 'user-3', 'user-4'],
        downvotes: ['user-5'],
        voteScore: 2,
        date: new Date(Date.now() - 15 * 60 * 1000) as any,
        latitude: 33.8910,
        longitude: -5.5501,
    },
    {
        id: 'price-3',
        productId: 'prod-3',
        storeId: 'store-3',
        userId: 'user-3',
        price: 6.00,
        createdAt: new Date(Date.now() - 60 * 60 * 1000) as any, // 1 hour ago
        productName: mockProducts[2].name,
        storeName: mockStores[2].name,
        imageUrl: mockProducts[2].imageUrl,
        user: mockUsers[2],
        product: mockProducts[2],
        store: mockStores[2] as any,
        upvotes: [],
        downvotes: [],
        voteScore: 0,
        date: new Date(Date.now() - 60 * 60 * 1000) as any,
        latitude: 33.9021,
        longitude: -5.5458,
    },
    {
        id: 'price-4',
        productId: 'prod-4',
        storeId: 'store-4',
        userId: 'user-5',
        price: 2.50,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) as any, // 5 hours ago
        productName: mockProducts[3].name,
        storeName: mockStores[3].name,
        user: mockUsers[4],
        product: mockProducts[3],
        store: mockStores[3] as any,
        upvotes: ['user-1'],
        downvotes: [],
        voteScore: 1,
        date: new Date(Date.now() - 5 * 60 * 60 * 1000) as any,
        latitude: 33.8888,
        longitude: -5.5555,
    },
    {
        id: 'price-5',
        productId: 'prod-5',
        storeId: 'store-1',
        userId: 'user-4',
        price: 10.00,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) as any, // 1 day ago
        productName: mockProducts[4].name,
        storeName: mockStores[0].name,
        user: mockUsers[3],
        product: mockProducts[4],
        store: mockStores[0] as any,
        upvotes: [],
        downvotes: [],
        voteScore: 0,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) as any,
        latitude: 33.8935,
        longitude: -5.5473,
    },
];

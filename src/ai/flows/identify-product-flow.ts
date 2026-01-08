'use server';
/**
 * @fileOverview This file defines a Genkit flow for identifying a product from an image.
 *
 * It takes an image data URI and returns the identified product's name, brand, and category.
 *
 * @exports `identifyProduct` - The main function to trigger the flow.
 * @exports `IdentifyProductInput` - The input type for the flow.
 * @exports `IdentifyProductOutput` - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {
  IdentifyProductInput,
  IdentifyProductOutput,
  IdentifyProductInputSchema,
  IdentifyProductOutputSchema
} from '@/lib/types';


export async function identifyProduct(
  input: IdentifyProductInput
): Promise<IdentifyProductOutput> {
  return identifyProductFlow(input);
}

const identifyProductPrompt = ai.definePrompt({
  name: 'identifyProductPrompt',
  input: {schema: IdentifyProductInputSchema},
  output: {schema: IdentifyProductOutputSchema},
  prompt: `Tu es un expert en identification de produits pour le marché marocain. Ton rôle est d'identifier n'importe quel type de produit (alimentaire, électronique, etc.) à partir d'une image.
Ta tâche est d'analyser l'image fournie et d'en extraire les informations demandées.
  
Analyse l'image suivante:
{{media url=photoDataUri}}
  
En te basant sur l'image, fournis les informations suivantes en français. Sois aussi précis que possible.

1.  **Nom du produit**: Le nom spécifique et complet du produit (par exemple, "Bouteille de Coca-Cola Zero 1L", "Manette de jeu mobile", "Paquet de chips Lay's Sel & Vinaigre").
2.  **Marque**: La marque du produit (par exemple, "Coca-Cola", "Lay's", "Sidi Ali").
3.  **Catégorie**: La catégorie générale du produit (par exemple, "Boisson gazeuse", "Électronique", "Snack", "Produit laitier", "Eau minérale").
4.  **Prix**: Le prix du produit **uniquement si un prix est clairement visible sur une étiquette dans l'image**. Si aucun prix n'est visible, n'inclus pas le champ "price" dans ta réponse.

Si l'image est trop floue pour être identifiée, fais de ton mieux pour remplir les champs ou indique que l'identification est incertaine. Retourne le résultat dans le format JSON spécifié.`,
});

const identifyProductFlow = ai.defineFlow(
  {
    name: 'identifyProductFlow',
    inputSchema: IdentifyProductInputSchema,
    outputSchema: IdentifyProductOutputSchema,
  },
  async input => {
    const {output} = await identifyProductPrompt(input);
    return output!;
  }
);

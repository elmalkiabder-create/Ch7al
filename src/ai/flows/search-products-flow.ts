'use server';
/**
 * @fileOverview Defines a Genkit flow for searching products using natural language.
 * It translates a user's query into a structured search format for Algolia.
 *
 * @exports `searchProducts` - The main function to trigger the flow.
 * @exports `SearchProductsInput` - The input type for the flow.
 * @exports `SearchProductsOutput` - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchProductsInputSchema = z.object({
  query: z.string().describe('The user\'s natural language search query.'),
  latitude: z.number().optional().describe('The latitude for location-based searches.'),
  longitude: z.number().optional().describe('The longitude for location-based searches.'),
});
export type SearchProductsInput = z.infer<typeof SearchProductsInputSchema>;

const SearchProductsOutputSchema = z.object({
  query: z.string().describe('The cleaned-up search query to be used in Algolia.'),
  filters: z.string().describe('Algolia-compatible filters (e.g., "category:Boissons" or "price < 10").'),
  aroundLatLng: z.string().optional().describe('The latitude and longitude for a geo-search, in "lat,lng" format.'),
});
export type SearchProductsOutput = z.infer<typeof SearchProductsOutputSchema>;

export async function searchProducts(
  input: SearchProductsInput
): Promise<SearchProductsOutput> {
  return searchProductsFlow(input);
}

const searchProductsPrompt = ai.definePrompt({
  name: 'searchProductsPrompt',
  input: { schema: SearchProductsInputSchema },
  output: { schema: SearchProductsOutputSchema },
  prompt: `You are an intelligent search assistant for a Moroccan price-sharing app called Ch7al. Your task is to convert a user's natural language query into a structured search payload for Algolia.

You have the following fields to work with in the Algolia index:
- 'name' (string)
- 'brand' (string)
- 'category' (string)
- 'storeName' (string)
- 'price' (numeric)
- '_geoloc' (geographic coordinates)

Analyze the user's query: "{{query}}".

Rules:
1.  **Extract Keywords**: Identify the main keywords for the 'query' field. This should be the core subject of the search (e.g., "coca-cola", "chips", "eau minérale").
2.  **Identify Filters**: Look for specific attributes to use as 'filters'.
    - If a category is mentioned (e.g., "boissons", "snacks"), create a filter like 'category:"Snacks"'.
    - If a brand is mentioned (e.g., "lay's", "sidi ali"), add it to the main query or create a filter 'brand:"Sidi Ali"'.
    - If a price constraint is mentioned (e.g., "moins de 10 dh", "pas cher"), create a numeric filter like 'price < 10'.
    - Combine multiple filters with 'AND'.
3.  **Handle Geolocation**:
    - If the query contains "près de moi", "autour de moi", or similar phrases, AND if latitude and longitude are provided, set the 'aroundLatLng' field to "{{latitude}},{{longitude}}".
    - If no location-based terms are used, leave 'aroundLatLng' empty.

Examples:
- User query: "coca-cola zéro près de moi" -> query: "coca-cola zéro", aroundLatLng: "..."
- User query: "chips lay's moins de 5 dirhams" -> query: "chips lay's", filters: "price < 5"
- User query: "boissons gazeuses" -> query: "boissons gazeuses", filters: "category:\"Boissons gazeuses\""

Now, process the user's request.`,
});


const searchProductsFlow = ai.defineFlow(
  {
    name: 'searchProductsFlow',
    inputSchema: SearchProductsInputSchema,
    outputSchema: SearchProductsOutputSchema,
  },
  async (input) => {
    const { output } = await searchProductsPrompt(input);
    return output!;
  }
);

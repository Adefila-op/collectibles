import type { Art } from "./art-data";

export type Offer = {
  id: string;
  buyer: string;
  buyerInitials: string;
  buyerCity: string;
  category: string;
  artistWanted?: string;
  cash: number;
  offeredArt?: Art;
  placedAgo: string;
  top?: boolean;
};

// All offers data is fetched from the API - no mock data
// Use offersAPI from api.ts to fetch offers

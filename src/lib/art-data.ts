// Art data types and utilities
// All data is fetched from the API - no mock data

export type Art = {
  id: string;
  name: string;
  artist: string;
  city: string;
  year: number;
  category: string;
  price: number;
  image: string;
  token?: string;
  uniqueId?: string;
  createdAt?: string;
  ownershipHistory?: Array<{ title: string; date: string; detail: string; reference: string; value?: number }>;
  exhibitionHistory?: Array<{ title: string; date: string; detail: string; reference: string }>;
  restorationHistory?: Array<{ title: string; date: string; detail: string; reference: string }>;
  valuationHistory?: Array<{ amount: number; source: string; reference?: string; date?: string }>;
  collectionName?: string;
  supplyName?: string;
  artistSignature?: string;
};

// Currency formatter utility
export const fmt = (n: number) => `₦${n.toLocaleString()}`;

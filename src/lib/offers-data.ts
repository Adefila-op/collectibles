import { ARTWORKS, type Art } from "./art-data";

export type Offer = {
  id: string;
  buyer: string;
  buyerInitials: string;
  buyerCity: string;
  category: string; // category they want
  artistWanted?: string; // optional artist filter
  cash: number; // cash component
  offeredArt?: Art; // optional art they offer in swap
  placedAgo: string;
  top?: boolean;
};

// Standing offers placed by buyers, waiting for any matching seller.
export const OFFERS: Offer[] = [
  {
    id: "OFR-0091",
    buyer: "Adeola Okafor",
    buyerInitials: "AO",
    buyerCity: "Lagos",
    category: "Painting",
    cash: 520000,
    offeredArt: ARTWORKS[3],
    placedAgo: "2h ago",
    top: true,
  },
  {
    id: "OFR-0088",
    buyer: "Kwame Asante",
    buyerInitials: "KA",
    buyerCity: "Accra",
    category: "Painting",
    cash: 410000,
    placedAgo: "1d ago",
  },
  {
    id: "OFR-0084",
    buyer: "Fatima Diallo",
    buyerInitials: "FD",
    buyerCity: "Dakar",
    category: "Sculpture",
    cash: 700000,
    offeredArt: ARTWORKS[1],
    placedAgo: "3d ago",
    top: true,
  },
  {
    id: "OFR-0079",
    buyer: "Tunde Bello",
    buyerInitials: "TB",
    buyerCity: "Ibadan",
    category: "Textile",
    cash: 240000,
    placedAgo: "5d ago",
    top: true,
  },
];

export const topOfferForCategory = (cat: string) =>
  OFFERS.filter((o) => o.category === cat).sort((a, b) => b.cash - a.cash)[0];

export const getOffer = (id: string) => OFFERS.find((o) => o.id === id) ?? OFFERS[0];

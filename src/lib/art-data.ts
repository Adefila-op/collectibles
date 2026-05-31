import art1 from "@/assets/art-1.jpg";
import art2 from "@/assets/art-2.jpg";
import art3 from "@/assets/art-3.jpg";
import art4 from "@/assets/art-4.jpg";
import { getArtworks, getArtworkById, type Art as DbArt } from "@/lib/db";

export type Art = DbArt;

export const ARTWORKS: Art[] = [
  { id: "harmattan", name: "Harmattan Haze", artist: "Emeka Osei", city: "Lagos", year: 2023, category: "Painting", price: 480000, image: art1, token: "0x4e3f…a91f" },
  { id: "lagoon", name: "Blue Lagoon Weave", artist: "Fatima Diallo", city: "Dakar", year: 2024, category: "Textile", price: 210000, image: art2, token: "0x9b2c…f44a" },
  { id: "bronze", name: "Mother of Ife", artist: "Kwame Asante", city: "Accra", year: 2022, category: "Sculpture", price: 650000, image: art3, token: "0x3d7a…cc12" },
  { id: "mask", name: "Earth Rhythm III", artist: "Adunni Bello", city: "Ibadan", year: 2024, category: "Beadwork", price: 320000, image: art4, token: "0x77a1…b03e" },
];

// Get all artworks: static + user-created
export function getAllArtworks(): Art[] {
  const dynamicArtworks = getArtworks();
  return [...ARTWORKS, ...dynamicArtworks];
}

export const fmt = (n: number) => `₦${n.toLocaleString()}`;

// Get single artwork from static + dynamic sources
export function getArt(id: string): Art {
  // First check dynamic artworks
  const dynamicArt = getArtworkById(id);
  if (dynamicArt) return dynamicArt;
  
  // Then check static artworks
  return ARTWORKS.find((a) => a.id === id) ?? ARTWORKS[0];
}

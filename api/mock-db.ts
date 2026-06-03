// Mock in-memory database for development when Supabase is unavailable
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  wallet_balance: number;
  wallet_address: string;
  artist_status: 'collector' | 'pending' | 'approved';
  created_at: string;
}

interface Artwork {
  id: string;
  name: string;
  artist: string;
  city: string;
  year: number;
  category: string;
  price: number;
  image: string;
  current_owner_id: string;
  created_at: string;
}

interface Holding {
  id: string;
  user_id: string;
  art_id: string;
  status: 'owned' | 'listed' | 'swapped' | 'withdrawn';
  listed_price?: number;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'offer' | 'swap' | 'withdrawal' | 'deposit';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  details?: Record<string, any>;
  created_at: string;
}

interface Offer {
  id: string;
  buyer_id: string;
  art_id: string;
  amount: number;
  status: 'open' | 'accepted' | 'rejected';
  created_at: string;
}

class MockDatabase {
  private users = new Map<string, User>();
  private artworks = new Map<string, Artwork>();
  private holdings = new Map<string, Holding>();
  private transactions = new Map<string, Transaction>();
  private offers = new Map<string, Offer>();

  async init() {
    console.log('✅ Mock in-memory database initialized');
    return true;
  }

  // User methods
  async createUser(email: string, name: string, passwordHash: string): Promise<User> {
    const id = uuidv4();
    const user: User = {
      id,
      email,
      name,
      password_hash: passwordHash,
      wallet_balance: 1000000, // Start with 1M Naira
      wallet_address: `0x${id.replace(/-/g, '').slice(0, 40)}`,
      artist_status: 'collector',
      created_at: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUserWallet(userId: string, balance: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.wallet_balance = balance;
    }
  }

  // Artwork methods
  async createArtwork(data: Omit<Artwork, 'id' | 'created_at'>): Promise<Artwork> {
    const id = uuidv4();
    const artwork: Artwork = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    this.artworks.set(id, artwork);
    return artwork;
  }

  async getArtworkById(id: string): Promise<Artwork | null> {
    return this.artworks.get(id) || null;
  }

  async getAllArtworks(): Promise<Artwork[]> {
    return Array.from(this.artworks.values());
  }

  // Holding methods
  async createHolding(userId: string, artId: string, status: Holding['status']): Promise<Holding> {
    const id = uuidv4();
    const holding: Holding = {
      id,
      user_id: userId,
      art_id: artId,
      status,
      created_at: new Date().toISOString(),
    };
    this.holdings.set(id, holding);
    return holding;
  }

  async getHoldingsByUser(userId: string): Promise<Holding[]> {
    return Array.from(this.holdings.values()).filter(h => h.user_id === userId);
  }

  async updateHoldingStatus(holdingId: string, status: Holding['status']): Promise<void> {
    const holding = this.holdings.get(holdingId);
    if (holding) {
      holding.status = status;
    }
  }

  // Transaction methods
  async createTransaction(data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const id = uuidv4();
    const transaction: Transaction = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.user_id === userId);
  }

  // Offer methods
  async createOffer(data: Omit<Offer, 'id' | 'created_at'>): Promise<Offer> {
    const id = uuidv4();
    const offer: Offer = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };
    this.offers.set(id, offer);
    return offer;
  }

  async getOffersByArtwork(artId: string): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter(o => o.art_id === artId);
  }

  async updateOfferStatus(offerId: string, status: Offer['status']): Promise<void> {
    const offer = this.offers.get(offerId);
    if (offer) {
      offer.status = status;
    }
  }

  async seedDemoData(): Promise<void> {
    // Create demo artworks
    const demoArtworks = [
      {
        name: 'Harmattan Haze',
        artist: 'Adekunle Olayinka',
        city: 'Lagos',
        year: 2023,
        category: 'Painting',
        price: 480000,
        image: 'https://images.unsplash.com/photo-1578987184166-12fe0a9bf3c4?w=400&h=400&fit=crop',
        current_owner_id: 'demo-artist-1',
      },
      {
        name: 'Urban Dreams',
        artist: 'Chioma Uwandu',
        city: 'Lagos',
        year: 2024,
        category: 'Sculpture',
        price: 320000,
        image: 'https://images.unsplash.com/photo-1578987184166-12fe0a9bf3c4?w=400&h=400&fit=crop',
        current_owner_id: 'demo-artist-2',
      },
      {
        name: 'Kente Dreams',
        artist: 'Yaw Mensah',
        city: 'Accra',
        year: 2023,
        category: 'Textile',
        price: 250000,
        image: 'https://images.unsplash.com/photo-1578987184166-12fe0a9bf3c4?w=400&h=400&fit=crop',
        current_owner_id: 'demo-artist-3',
      },
      {
        name: 'Ancient Stories',
        artist: 'Fatima Ba',
        city: 'Dakar',
        year: 2023,
        category: 'Beadwork',
        price: 180000,
        image: 'https://images.unsplash.com/photo-1578987184166-12fe0a9bf3c4?w=400&h=400&fit=crop',
        current_owner_id: 'demo-artist-4',
      },
    ];

    for (const artwork of demoArtworks) {
      await this.createArtwork(artwork);
    }

    console.log('✅ Demo data seeded');
  }
}

export const mockDb = new MockDatabase();

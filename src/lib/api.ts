const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Add property aliases for backward compatibility
function addUserAliases(user: any): any {
  if (!user) return user;
  return {
    ...user,
    walletBalance: user.wallet_balance,
    walletAddress: user.wallet_address,
    artistStatus: user.artist_status,
    createdAt: user.created_at,
  };
}

function addArtAliases(art: any): any {
  if (!art) return art;
  return { ...art };
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  wallet_balance: number;
  wallet_address?: string;
  artist_status: 'collector' | 'pending' | 'approved';
  artist_type?: string;
  artist_bio?: string;
  portfolio_url?: string;
  social_url?: string;
  live_location?: string;
  call_url?: string;
  created_at: string;
  
  // Aliases for backward compatibility
  walletBalance?: number;
  walletAddress?: string;
  artistStatus?: 'collector' | 'pending' | 'approved';
  createdAt?: string;
}

export interface Art {
  id: string;
  token: string;
  name: string;
  artist: string;
  category: string;
  city: string;
  year: number;
  price: number;
  image: string;
  description: string;
  unique_id: string;
}

export interface Transaction {
  id: string;
  type: string;
  buyer_id?: string;
  seller_id?: string;
  amount: number;
  art_id?: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// User API
export const userAPI = {
  getAll: async () => {
    const users = await apiCall('/api/users');
    return users.map(addUserAliases);
  },
  getById: async (id: string) => {
    const user = await apiCall(`/api/users/${id}`);
    return addUserAliases(user);
  },
  create: async (user: Partial<User> & { password: string }) => {
    const newUser = await apiCall('/api/users', { method: 'POST', body: JSON.stringify(user) });
    return addUserAliases(newUser);
  },
  updateWallet: async (userId: string, amount: number) => {
    const user = await apiCall(`/api/users/${userId}/wallet`, { 
      method: 'PATCH', 
      body: JSON.stringify({ amount }) 
    });
    return addUserAliases(user);
  },
  updateArtistStatus: async (userId: string, data: any) => {
    const user = await apiCall(`/api/users/${userId}/artist-status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return addUserAliases(user);
  },
};

// Artwork API
export const artAPI = {
  getAll: () => apiCall('/api/artworks'),
  getById: (id: string) => apiCall(`/api/artworks/${id}`),
};

// Holdings API
export const holdingsAPI = {
  getByUserId: (userId: string) => apiCall(`/api/holdings/${userId}`),
  create: (userId: string, artId: string, status: string = 'owned') =>
    apiCall('/api/holdings', {
      method: 'POST',
      body: JSON.stringify({ userId, artId, status }),
    }),
};

// Offers API
export const offersAPI = {
  getAll: () => apiCall('/api/offers'),
  getByArtId: (artId: string) => apiCall(`/api/offers/art/${artId}`),
  create: (buyerId: string, artId: string, amount: number) =>
    apiCall('/api/offers', {
      method: 'POST',
      body: JSON.stringify({ buyerId, artId, amount }),
    }),
  accept: (offerId: string, sellerId: string) =>
    apiCall(`/api/offers/${offerId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ sellerId }),
    }),
  reject: (offerId: string) =>
    apiCall(`/api/offers/${offerId}/reject`, {
      method: 'PATCH',
    }),
};

// Direct Purchase API
export const purchaseAPI = {
  buy: (buyerId: string, artId: string, amount: number, sellerId: string) =>
    apiCall('/api/buy', {
      method: 'POST',
      body: JSON.stringify({ buyerId, artId, amount, sellerId }),
    }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (limit: number = 50) => apiCall(`/api/transactions?limit=${limit}`),
  getByUserId: (userId: string) => apiCall(`/api/transactions/${userId}`),
  create: (data: any) =>
    apiCall('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  complete: (transactionId: string) =>
    apiCall(`/api/transactions/${transactionId}/complete`, {
      method: 'PATCH',
    }),
};

// Escrow API
export const escrowAPI = {
  getByTransactionId: (transactionId: string) =>
    apiCall(`/api/escrow/${transactionId}`),
  create: (data: any) =>
    apiCall('/api/escrow', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  release: (escrowId: string) =>
    apiCall(`/api/escrow/${escrowId}/release`, {
      method: 'PATCH',
    }),
};

// Admin API
export const adminAPI = {
  getEvents: (limit: number = 50) => apiCall(`/api/admin/events?limit=${limit}`),
  logEvent: (data: any) =>
    apiCall('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Wallet API
export const walletAPI = {
  /**
   * Get wallet balance for a specific chain
   */
  getBalance: async (address: string, chain: 'base' | 'ethereum' | 'polygon' = 'base') => {
    return apiCall(`/api/wallet/${address}/balance/${chain}`);
  },

  /**
   * Get wallet balance from all supported chains
   */
  getBalanceAllChains: async (address: string) => {
    return apiCall(`/api/wallet/${address}/balance`);
  },

  /**
   * Get estimated gas fee for a transaction
   */
  getGasFee: async (chain: 'base' | 'ethereum' | 'polygon' = 'base') => {
    return apiCall(`/api/wallet/gas-fee/${chain}`);
  },

  /**
   * Create a top-up deposit request
   */
  createTopup: async (userId: string, amount: number, chain: string = 'base', paymentMethod: string = 'stripe') => {
    return apiCall('/api/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, chain, paymentMethod }),
    });
  },

  /**
   * Confirm a top-up after payment
   */
  confirmTopup: async (transactionId: string) => {
    return apiCall(`/api/wallet/topup/${transactionId}/confirm`, {
      method: 'PATCH',
    });
  },

  /**
   * Get user's top-up history
   */
  getTopupHistory: async (userId: string) => {
    return apiCall(`/api/wallet/topups/${userId}`);
  },

  /**
   * Sync wallet balance with blockchain
   */
  syncBalance: async (userId: string, chain: string = 'base') => {
    return apiCall(`/api/wallet/sync/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ chain }),
    });
  },
};

// Health check
export const healthCheck = () => apiCall('/api/health');

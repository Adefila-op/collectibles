/**
 * Transaction API client - wraps backend endpoints
 * Replaces localStorage-based transaction storage in db.ts
 */

const API_URL = '/api';

export interface OfferPayload {
  buyerId: string;
  artId: string;
  amount: number;
}

export interface HoldingPayload {
  userId: string;
  artId: string;
  status: 'owned' | 'listed' | 'swapped';
  listedPrice?: number;
}

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

// ========== Holdings API ==========
export const holdingsAPI = {
  // Get all user holdings
  getByUser: async (userId: string) => {
    return apiCall(`/api/holdings/${userId}`);
  },

  // Create a holding (user acquires artwork)
  create: async (payload: HoldingPayload) => {
    return apiCall('/api/holdings', {
      method: 'POST',
      body: JSON.stringify({
        userId: payload.userId,
        artId: payload.artId,
        status: payload.status,
      }),
    });
  },

  // Update holding (list, unlist, mark as swapped)
  update: async (holdingId: string, userId: string, status: string, listedPrice?: number) => {
    return apiCall(`/api/holdings/${holdingId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        userId,
        status,
        listedPrice,
      }),
    });
  },
};

// ========== Offers API ==========
export const offersAPI = {
  // Get all pending offers
  getAll: async () => {
    return apiCall('/api/offers');
  },

  // Get offers for a specific artwork
  getByArt: async (artId: string) => {
    return apiCall(`/api/offers/art/${artId}`);
  },

  // Create offer with escrow
  create: async (payload: OfferPayload) => {
    return apiCall('/api/offers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Accept offer (release escrow to seller)
  accept: async (offerId: string, sellerId: string) => {
    return apiCall(`/api/offers/${offerId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ sellerId }),
    });
  },

  // Reject offer (refund escrow to buyer)
  reject: async (offerId: string) => {
    return apiCall(`/api/offers/${offerId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },
};

// ========== Transactions API ==========
export const transactionsAPI = {
  // Get all transactions for user
  getByUser: async (userId: string, limit: number = 50) => {
    return apiCall(`/api/transactions?user_id=${userId}&limit=${limit}`);
  },

  // Get transaction by ID
  getById: async (txId: string) => {
    return apiCall(`/api/transactions/${txId}`);
  },
};

// ========== Swaps API ==========
export const swapsAPI = {
  // Get all swaps
  getAll: async () => {
    return apiCall('/api/swaps');
  },

  // Get swaps for user
  getByUser: async (userId: string) => {
    return apiCall(`/api/swaps?user_id=${userId}`);
  },

  // Propose swap
  propose: async (fromUserId: string, toUserId: string, fromArtId: string, toArtId: string) => {
    return apiCall('/api/swaps', {
      method: 'POST',
      body: JSON.stringify({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        from_art_id: fromArtId,
        to_art_id: toArtId,
      }),
    });
  },

  // Accept swap
  accept: async (swapId: string) => {
    return apiCall(`/api/swaps/${swapId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },

  // Reject swap
  reject: async (swapId: string) => {
    return apiCall(`/api/swaps/${swapId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },
};

// ========== Withdrawals API ==========
export const withdrawalsAPI = {
  // Get user withdrawals
  getByUser: async (userId: string) => {
    return apiCall(`/api/withdrawals?user_id=${userId}`);
  },

  // Create withdrawal request
  create: async (userId: string, amount: number, toAddress: string, assetType: 'liquid' | 'holding' = 'liquid') => {
    return apiCall('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        amount,
        to_address: toAddress,
        asset_type: assetType,
      }),
    });
  },
};

// API Client for Vercel Backend
// Replaces localStorage with remote API calls

const API_BASE = process.env.VITE_API_URL || '/api';

interface RequestOptions {
  action?: 'create' | 'read' | 'update' | 'delete';
  table: string;
  data?: any;
  filter?: any;
}

async function apiCall(options: RequestOptions, method: 'GET' | 'POST' = 'POST'): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/db`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(options) : undefined,
      ...(method === 'GET' && {
        method: 'GET',
        url: `${API_BASE}/db?table=${options.table}${options.filter ? `&filter=${JSON.stringify(options.filter)}` : ''}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
}

export const apiClient = {
  // Users
  getUsers: () => apiCall({ table: 'users' }, 'GET'),
  getUserByEmail: (email: string) => apiCall({ 
    action: 'read', 
    table: 'users', 
    filter: { email: email.toLowerCase() } 
  }),
  createUser: (data: any) => apiCall({ action: 'create', table: 'users', data }),
  updateUser: (id: string, data: any) => apiCall({ 
    action: 'update', 
    table: 'users', 
    data: { ...data, id } 
  }),

  // Sessions
  getSession: () => apiCall({ table: 'sessions' }, 'GET'),
  createSession: (data: any) => apiCall({ action: 'create', table: 'sessions', data }),
  clearSession: (id: string) => apiCall({ action: 'delete', table: 'sessions', data: { id } }),

  // Holdings
  getHoldings: (userId?: string) => apiCall({ 
    table: 'holdings',
    filter: userId ? { userId } : undefined 
  }, 'GET'),
  addHolding: (data: any) => apiCall({ action: 'create', table: 'holdings', data }),
  updateHolding: (id: string, data: any) => apiCall({ 
    action: 'update', 
    table: 'holdings', 
    data: { ...data, id } 
  }),

  // Offers
  getOffers: (filter?: any) => apiCall({ 
    table: 'offers',
    filter 
  }, 'GET'),
  createOffer: (data: any) => apiCall({ action: 'create', table: 'offers', data }),
  updateOffer: (id: string, data: any) => apiCall({ 
    action: 'update', 
    table: 'offers', 
    data: { ...data, id } 
  }),

  // Swaps
  getSwaps: (filter?: any) => apiCall({ 
    table: 'swaps',
    filter 
  }, 'GET'),
  createSwap: (data: any) => apiCall({ action: 'create', table: 'swaps', data }),
  updateSwap: (id: string, data: any) => apiCall({ 
    action: 'update', 
    table: 'swaps', 
    data: { ...data, id } 
  }),

  // Artworks
  getArtworks: () => apiCall({ table: 'artworks' }, 'GET'),
  getArtworkById: (id: string) => apiCall({ 
    table: 'artworks',
    filter: { id } 
  }, 'GET'),
  createArtwork: (data: any) => apiCall({ action: 'create', table: 'artworks', data }),
  updateArtwork: (id: string, data: any) => apiCall({ 
    action: 'update', 
    table: 'artworks', 
    data: { ...data, id } 
  }),
};

export default apiClient;

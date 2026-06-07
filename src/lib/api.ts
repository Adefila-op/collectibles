import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE = import.meta.env.VITE_API_URL || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not set. Using REST API.');
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Helper to ensure supabase is initialized
function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase configuration missing. Using REST API fallback.');
  }
  return supabase;
}

// REST API helper
async function fetchAPI(endpoint: string, options: any = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Add property aliases for backward compatibility
function addUserAliases(user: any): any {
  if (!user) return user;
  return {
    ...user,
    walletBalance: user.wallet_balance,
    walletAddress: user.wallet_address,
    isAdmin: user.is_admin,
    artistStatus: user.artist_status,
    createdAt: user.created_at,
  };
}

function addArtAliases(art: any): any {
  if (!art) return art;
  return {
    ...art,
    uniqueId: art.unique_id,
    currentOwnerId: art.current_owner_id,
    holdingId: art.holding_id,
    holdingStatus: art.holding_status,
    listedPrice: art.listed_price,
    receiptStatus: art.receipt_status,
    transferStatus: art.transfer_status,
    marketPrice: art.market_price,
    price: art.market_price ?? art.listed_price ?? art.price,
  };
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  wallet_balance: number;
  wallet_address?: string;
  is_admin?: boolean;
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
  isAdmin?: boolean;
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
  current_owner_id?: string;
  holding_id?: string;
  holding_status?: string;
  listed_price?: number;
  receipt_status?: string;
  transfer_status?: string;
  market_price?: number;
  uniqueId?: string;
  currentOwnerId?: string;
  holdingId?: string;
  holdingStatus?: string;
  listedPrice?: number;
  receiptStatus?: string;
  transferStatus?: string;
  marketPrice?: number;
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

export interface ArtworkSubmission {
  id: string;
  artist_id: string;
  art_id: string;
  proof_image_url?: string;
  proof_document_url?: string;
  description?: string;
  submission_status: 'submitted' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  nft_transaction_hash?: string;
  nft_token_id?: string;
  created_at: string;
  updated_at: string;
  artist_name?: string;
  artist_email?: string;
  artwork_name?: string;
  artwork_image?: string;
}

export interface Certificate {
  id: string;
  holding_id: string;
  art_id: string;
  buyer_id: string;
  artist_id: string;
  certificate_number: string;
  issued_at: string;
  authenticity_verified: boolean;
  verification_method?: string;
  details?: any;
  created_at: string;
}

// User API
export const userAPI = {
  getAll: async () => {
    if (!supabase) {
      const users = await fetchAPI('/api/users');
      return (Array.isArray(users) ? users : []).map(addUserAliases);
    }
    const { data, error } = await getSupabase().from('users').select('*');
    if (error) throw error;
    return (data || []).map(addUserAliases);
  },
  getById: async (id: string) => {
    if (!supabase) {
      return addUserAliases(await fetchAPI(`/api/users/${id}`));
    }
    const { data, error } = await getSupabase().from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return addUserAliases(data);
  },
  create: async (user: Partial<User> & { password: string }) => {
    if (!supabase) {
      return addUserAliases(await fetchAPI('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }));
    }
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await getSupabase().auth.signUp({
      email: user.email || '',
      password: user.password,
    });
    if (authError) throw authError;

    // Create user profile in database
    const { data, error } = await getSupabase().from('users').insert({
      id: authData.user?.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      wallet_balance: 0,
      artist_status: 'collector',
    }).select().single();
    if (error) throw error;
    return addUserAliases(data);
  },
  updateWallet: async (userId: string, amount: number) => {
    if (!supabase) {
      return addUserAliases(await fetchAPI(`/api/users/${userId}/wallet`, {
        method: 'PATCH',
        body: JSON.stringify({ amount }),
      }));
    }
    const { data, error } = await getSupabase().from('users')
      .update({ wallet_balance: amount })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return addUserAliases(data);
  },
  updateArtistStatus: async (userId: string, data: any) => {
    // Handle both string status and object
    const statusData = typeof data === 'string' ? { artist_status: data } : {
      artist_status: data.artist_status ?? data.status,
      artist_type: data.artist_type ?? data.artistType,
      artist_bio: data.artist_bio ?? data.artistBio,
      portfolio_url: data.portfolio_url ?? data.portfolioUrl,
      social_url: data.social_url ?? data.socialUrl,
      live_location: data.live_location ?? data.liveLocation,
      call_url: data.call_url ?? data.callUrl,
    };
    
    if (!supabase) {
      return addUserAliases(await fetchAPI(`/api/users/${userId}/artist-status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }));
    }

    // For admin operations, use REST API
    const userId_current = localStorage.getItem('artchain_user_id');
    if (typeof data === 'string') {
      // Admin approval/rejection - use REST API
      const response = await fetch(`/api/users/${userId}/artist-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId_current || '',
        },
        body: JSON.stringify(statusData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update artist status');
      }
      return addUserAliases(await response.json());
    }
    
    // For user self-updates, use Supabase
    const { data: updatedUser, error } = await getSupabase().from('users')
      .update(statusData)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return addUserAliases(updatedUser);
  },
};

// Artwork API
export const artAPI = {
  getAll: async () => {
    try {
      // Try REST API first
      const response = await fetchAPI('/api/artworks');
      // Ensure we return an array
      const data = Array.isArray(response) ? response : (response?.rows || response?.data || []);
      return data.map((art: any) => addArtAliases(art));
    } catch (error) {
      console.warn('REST API failed, trying Supabase:', error);
      try {
        // Fallback to Supabase
        const { data, error: supabaseError } = await getSupabase().from('artworks').select('*');
        if (supabaseError) throw supabaseError;
        return (data || []).map(addArtAliases);
      } catch (supabaseErr) {
        console.error('Both API and Supabase failed:', supabaseErr);
        return []; // Return empty array if both fail
      }
    }
  },
  getById: async (id: string) => {
    try {
      const response = await fetchAPI(`/api/artworks/${id}`);
      return addArtAliases(response);
    } catch (error) {
      const { data, error: supabaseError } = await getSupabase().from('artworks').select('*').eq('id', id).single();
      if (supabaseError) throw supabaseError;
      return addArtAliases(data);
    }
  },
  create: async (artwork: any) => {
    try {
      const response = await fetchAPI('/api/artworks', {
        method: 'POST',
        body: JSON.stringify(artwork),
      });
      return addArtAliases(response);
    } catch (error) {
      const { data, error: supabaseError } = await getSupabase().from('artworks')
        .insert(artwork)
        .select()
        .single();
      if (supabaseError) throw supabaseError;
      return addArtAliases(data);
    }
  },
};

// Holdings API
export const holdingsAPI = {
  getByUserId: async (userId: string) => {
    if (!supabase) {
      const holdings = await fetchAPI(`/api/holdings/${userId}`);
      return (Array.isArray(holdings) ? holdings : []).map(addArtAliases);
    }
    const { data, error } = await getSupabase().from('holdings')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(addArtAliases);
  },
  getByUser: async (userId: string) => {
    if (!supabase) {
      const holdings = await fetchAPI(`/api/holdings/${userId}`);
      return (Array.isArray(holdings) ? holdings : []).map(addArtAliases);
    }
    const { data, error } = await getSupabase().from('holdings')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(addArtAliases);
  },
  create: async (holding: any) => {
    if (!supabase) {
      return addArtAliases(await fetchAPI('/api/holdings', {
        method: 'POST',
        body: JSON.stringify({
          userId: holding.userId ?? holding.user_id,
          artId: holding.artId ?? holding.art_id,
          status: holding.status,
        }),
      }));
    }
    const { data, error } = await getSupabase().from('holdings')
      .insert(holding)
      .select()
      .single();
    if (error) throw error;
    return addArtAliases(data);
  },
  update: async (holdingId: string, userId: string, updateData: any) => {
    if (!supabase) {
      return addArtAliases(await fetchAPI(`/api/holdings/${holdingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          userId,
          status: updateData.status,
          listedPrice: updateData.listedPrice ?? updateData.listed_price,
        }),
      }));
    }
    const { data, error } = await getSupabase().from('holdings')
      .update(updateData)
      .eq('id', holdingId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return addArtAliases(data);
  },
};

// Offers API
export const offersAPI = {
  getAll: async () => {
    const { data, error } = await getSupabase().from('offers').select('*');
    if (error) throw error;
    return data || [];
  },
  getByArtId: async (artId: string) => {
    const { data, error } = await getSupabase().from('offers')
      .select('*')
      .eq('art_id', artId);
    if (error) throw error;
    return data || [];
  },
  create: async (buyerId: string, artId: string, amount: number) => {
    const { data, error } = await getSupabase().from('offers')
      .insert({ buyer_id: buyerId, art_id: artId, amount, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  accept: async (offerId: string, sellerId: string) => {
    const { data, error } = await getSupabase().from('offers')
      .update({ status: 'accepted' })
      .eq('id', offerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  reject: async (offerId: string) => {
    const { data, error } = await getSupabase().from('offers')
      .update({ status: 'rejected' })
      .eq('id', offerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Swap API
export const swapAPI = {
  propose: async (userId1: string, userId2: string, artId1: string, artId2: string, cashAmount: number = 0) => {
    const { data, error } = await getSupabase().from('transactions')
      .insert({
        type: 'swap',
        from_user_id: userId1,
        to_user_id: userId2,
        art_id: artId1,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  accept: async (transactionId: string) => {
    const { data, error } = await getSupabase().from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  reject: async (transactionId: string) => {
    const { data, error } = await getSupabase().from('transactions')
      .update({ status: 'rejected' })
      .eq('id', transactionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (limit: number = 50) => {
    const { data, error } = await getSupabase().from('transactions').select('*').limit(limit);
    if (error) throw error;
    return data || [];
  },
  getByUserId: async (userId: string) => {
    const { data, error } = await getSupabase().from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
    if (error) throw error;
    return data || [];
  },
};

// Purchase API
export const purchaseAPI = {
  buy: async (buyerId: string, artId: string, amount: number, sellerId: string) => {
    // Create a transaction record for the purchase
    const { data, error } = await getSupabase().from('transactions')
      .insert({
        type: 'purchase',
        buyer_id: buyerId,
        seller_id: sellerId,
        amount: amount,
        art_id: artId,
        status: 'pending',
        details: { purchased: true },
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Submission API
export const submissionAPI = {
  submit: async (submission: any) => {
    const { data, error } = await getSupabase().from('artwork_submissions')
      .insert(submission)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  getAll: async () => {
    const { data, error } = await getSupabase().from('artwork_submissions').select('*');
    if (error) throw error;
    return data || [];
  },
  approve: async (submissionId: string) => {
    const userId = localStorage.getItem('artchain_user_id');
    const response = await fetch(`/api/artwork-submissions/${submissionId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId || '',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve submission');
    }
    return await response.json();
  },
  reject: async (submissionId: string, adminNotes?: string) => {
    const userId = localStorage.getItem('artchain_user_id');
    const response = await fetch(`/api/artwork-submissions/${submissionId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId || '',
      },
      body: JSON.stringify({ adminNotes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject submission');
    }
    return await response.json();
  },
};




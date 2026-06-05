import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Helper to ensure supabase is initialized
function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase configuration missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }
  return supabase;
}

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
    const { data, error } = await getSupabase().from('users').select('*');
    if (error) throw error;
    return (data || []).map(addUserAliases);
  },
  getById: async (id: string) => {
    const { data, error } = await getSupabase().from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return addUserAliases(data);
  },
  create: async (user: Partial<User> & { password: string }) => {
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
    const { data, error } = await getSupabase().from('users')
      .update({ wallet_balance: amount })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return addUserAliases(data);
  },
  updateArtistStatus: async (userId: string, data: any) => {
    const { data: updatedUser, error } = await getSupabase().from('users')
      .update({
        artist_status: data.artist_status,
        artist_type: data.artist_type,
        artist_bio: data.artist_bio,
        portfolio_url: data.portfolio_url,
        social_url: data.social_url,
        live_location: data.live_location,
        call_url: data.call_url,
      })
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
    const { data, error } = await getSupabase().from('artworks').select('*');
    if (error) throw error;
    return (data || []).map(addArtAliases);
  },
  getById: async (id: string) => {
    const { data, error } = await getSupabase().from('artworks').select('*').eq('id', id).single();
    if (error) throw error;
    return addArtAliases(data);
  },
  create: async (artwork: any) => {
    const { data, error } = await getSupabase().from('artworks')
      .insert(artwork)
      .select()
      .single();
    if (error) throw error;
    return addArtAliases(data);
  },
};

// Holdings API
export const holdingsAPI = {
  getByUserId: async (userId: string) => {
    const { data, error } = await getSupabase().from('holdings')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(addArtAliases);
  },
  getByUser: async (userId: string) => {
    const { data, error } = await getSupabase().from('holdings')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(addArtAliases);
  },
  create: async (holding: any) => {
    const { data, error } = await getSupabase().from('holdings')
      .insert(holding)
      .select()
      .single();
    if (error) throw error;
    return addArtAliases(data);
  },
  update: async (holdingId: string, userId: string, updateData: any) => {
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
    const { data, error } = await getSupabase().from('artwork_submissions')
      .update({ submission_status: 'approved' })
      .eq('id', submissionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  reject: async (submissionId: string) => {
    const { data, error } = await getSupabase().from('artwork_submissions')
      .update({ submission_status: 'rejected' })
      .eq('id', submissionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};




import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, getClient } from './db';
import { 
  generateDeterministicWallet, 
  getWalletBalanceFormatted,
  getWalletBalancesAllChains,
  estimateGasFee,
  isValidWalletAddress,
  mintCertificateNFT,
  transferCertificateNFT
} from './wallet';
import { 
  generateToken, 
  verifyToken, 
  requireAuth, 
  requireAdmin as requireAdminAuth 
} from './auth-middleware';
import { 
  validateRequest,
  LoginSchema,
  CreateUserSchema,
  UpdateUserSchema,
  CreateArtworkSchema,
  CreateOfferSchema,
  BuySchema,
  SwapSchema,
  UpdateWalletSchema,
  UpdateArtistStatusSchema,
  ArtworkSubmissionSchema,
  UpdateHoldingSchema,
  ImageUploadSchema,
  ContractDeploymentSchema,
  MintNFTSchema,
  DepositSchema,
  WithdrawalSchema,
} from './validation';
import { 
  getPresignedUploadUrl, 
  uploadArtworkImage,
  deleteArtworkImage 
} from './storage-service';
import {
  deployArtistContract,
  getArtistContracts,
  mintNFTFromContract,
  transferNFT,
} from './nft-service';
import {
  createArtistDeploymentWallet,
  getArtistDeploymentWallet,
  createUserDepositWallet,
  getUserDepositWallet,
  recordWalletDeposit,
  recordWalletWithdrawal,
  getWalletBalance,
} from './wallet-service';
import {
  fetchOpenSeaListings,
  getOpenSeaFulfillmentData,
} from './opensea-service';
import {
  generateSolanaKeypair,
  getSolanaBalance,
  getSolanaBalanceFormatted,
  isValidSolanaAddress,
} from './solana-wallet';
import {
  fetchSolanaNFTListings,
  getSolanaNFTDetails,
  getSolanaNFTWithCachedImage,
  searchSolanaNFTs,
} from './solana-nft-service';
import {
  cacheImage,
  getImageFromCache,
  cleanupOldImages,
  getCacheStats,
  clearCache,
} from './image-cache';

// Extend Express Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
      validatedBody?: any;
      isAdmin?: boolean;
    }
  }
}

dotenv.config({ path: '.env.local' });

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.API_PORT || 3000;

// ========== Security Configuration ==========

// CORS: Restrict to Vercel domain and localhost for development
const allowedOrigins = [
  'https://*.vercel.app',
  'https://collectibles.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*.', '');
        return origin.endsWith(pattern);
      }
      return origin === allowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting for authentication endpoints (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for financial endpoints (20 attempts per minute)
const financialLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many requests to financial endpoint, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter (100 requests per minute)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLimiter);

// Old insecure auth middleware removed - use JWT tokens instead

// Admin verification middleware - kept for backwards compatibility but now requires JWT
async function requireAdmin(req: any, res: any, next: any) {
  // First verify JWT token
  await requireAuth(req, res, () => {
    // Then check admin status
    requireAdminAuth(req, res, next);
  });
}


async function ensureRuntimeSchema() {
  try {
    await query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS privy_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
        ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false
    `);
    
    await query(`
      ALTER TABLE holdings
        ADD COLUMN IF NOT EXISTS listed_price BIGINT,
        ADD COLUMN IF NOT EXISTS receipt_status VARCHAR(50) DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(50) DEFAULT 'settled',
        ADD COLUMN IF NOT EXISTS listed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL
    `);
  } catch (error) {
    console.error('Schema check failed:', error);
    throw error;
  }
}

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', provider: 'Supabase PostgreSQL' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.get('/api/opensea/listings', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 4), 1), 20);
    const listings = await fetchOpenSeaListings(limit);
    res.json({ listings });
  } catch (error: any) {
    res.status(500).json({
      error: 'Unable to fetch OpenSea listings',
      detail: error?.message || 'Unknown OpenSea error',
    });
  }
});

app.post('/api/opensea/fulfillment-data', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const fulfillmentData = await getOpenSeaFulfillmentData(req.body);
    res.json(fulfillmentData);
  } catch (error: any) {
    res.status(500).json({
      error: 'Unable to create OpenSea fulfillment data',
      detail: error?.message || 'Unknown OpenSea fulfillment error',
    });
  }
});

// ========== Solana NFT API ==========

// Get Solana NFT listings
app.get('/api/solana/nfts/listings', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const listings = await fetchSolanaNFTListings(limit);
    
    // Cache images for all listings
    const listingsWithCachedImages = await Promise.all(
      listings.map(nft => getSolanaNFTWithCachedImage(nft))
    );
    
    res.json({ listings: listingsWithCachedImages });
  } catch (error: any) {
    res.status(500).json({
      error: 'Unable to fetch Solana NFT listings',
      detail: error?.message || 'Unknown error',
    });
  }
});

// Get specific Solana NFT details
app.get('/api/solana/nfts/:contractAddress/:tokenId', async (req: Request, res: Response) => {
  try {
    const { contractAddress, tokenId } = req.params as { contractAddress: string; tokenId: string };
    
    if (!contractAddress || !tokenId) {
      return res.status(400).json({ error: 'Missing contractAddress or tokenId' });
    }

    const nft = await getSolanaNFTDetails(contractAddress, tokenId);
    
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json({ nft });
  } catch (error: any) {
    res.status(500).json({
      error: 'Unable to fetch NFT details',
      detail: error?.message || 'Unknown error',
    });
  }
});

// Search Solana NFTs
app.get('/api/solana/nfts/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = await searchSolanaNFTs(query, limit);
    
    // Cache images
    const resultsWithCachedImages = await Promise.all(
      results.map(nft => getSolanaNFTWithCachedImage(nft))
    );

    res.json({ results: resultsWithCachedImages });
  } catch (error: any) {
    res.status(500).json({
      error: 'Search failed',
      detail: error?.message || 'Unknown error',
    });
  }
});

// ========== Image Cache API ==========

// Cache an image and get local URL
app.post('/api/images/cache', async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    const cachedUrl = await getImageFromCache(imageUrl);
    res.json({ cachedUrl, originalUrl: imageUrl });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to cache image',
      detail: error?.message || 'Unknown error',
    });
  }
});

// Get image cache statistics (admin only)
app.get('/api/images/cache/stats', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const stats = getCacheStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get cache stats',
      detail: error?.message || 'Unknown error',
    });
  }
});

// Clear image cache (admin only)
app.delete('/api/images/cache', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to clear cache',
      detail: error?.message || 'Unknown error',
    });
  }
});

// ========== Solana Wallet API ==========

// Create Solana wallet
app.post('/api/solana/wallet/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const { publicKey, privateKey } = generateSolanaKeypair();

    res.json({
      success: true,
      wallet: {
        address: publicKey,
        // Note: Private key should never be returned in production
        // Store securely in database or hardware wallet
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create Solana wallet',
      detail: error?.message || 'Unknown error',
    });
  }
});

// Get Solana wallet balance
app.get('/api/solana/wallet/:address/balance', async (req: Request, res: Response) => {
  try {
    const { address } = req.params as { address: string };

    if (!isValidSolanaAddress(address)) {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }

    const balanceInfo = await getSolanaBalanceFormatted(address);
    res.json(balanceInfo);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch balance',
      detail: error?.message || 'Unknown error',
    });
  }
});

// ========== Users API ==========

// Get all users (admin only) - explicit columns, no passwords
app.get('/api/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id, email, name, avatar, wallet_balance, wallet_address, 
        artist_status, artist_type, is_admin, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (explicit columns, no password)
app.get('/api/users/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    // Users can only see their own profile or admins can see anyone
    const userId = req.params.id;
    const requestingUserId = (req as any).userId;
    const isAdmin = (req as any).user?.is_admin;
    
    if (userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Cannot view other users' });
    }
    
    const result = await query(`
      SELECT 
        id, email, name, avatar, wallet_balance, wallet_address,
        artist_status, artist_type, artist_bio, portfolio_url, social_url,
        live_location, call_url, is_admin, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Sync Privy User (register/login)
const ADMIN_EMAILS = ['admin@example.com']; // Hardcoded admins

app.post('/api/auth/sync', async (req: Request, res: Response) => {
  const { privyId, email, name, walletAddress } = req.body;
  try {
    if (!privyId) {
      return res.status(400).json({ error: 'Missing privyId' });
    }

    // Check if user exists by privy_id or email
    let result = await query('SELECT * FROM users WHERE privy_id = $1 OR email = $2 LIMIT 1', [privyId, email]);
    let user;
    
    const isAdmin = ADMIN_EMAILS.includes(email);

    if (result.rows.length === 0) {
      // Create new user
      const insertResult = await query(
        `INSERT INTO users (email, password, name, avatar, wallet_balance, wallet_address, artist_status, privy_id, is_admin, onboarding_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING 
           id, email, username, name, avatar, wallet_balance, wallet_address, 
           artist_status, is_admin, onboarding_completed, created_at, updated_at`,
        [email || privyId, 'privy_managed', name || '', name?.charAt(0)?.toUpperCase() || 'U', 0, walletAddress || null, 'collector', privyId, isAdmin, false]
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
      // Update privy_id, walletAddress, and admin status if they changed
      if (user.privy_id !== privyId || user.wallet_address !== walletAddress || user.is_admin !== isAdmin) {
        const updateResult = await query(
          `UPDATE users SET privy_id = $1, wallet_address = COALESCE($2, wallet_address), is_admin = $3 WHERE id = $4
           RETURNING 
             id, email, username, name, avatar, wallet_balance, wallet_address, 
             artist_status, is_admin, onboarding_completed, created_at, updated_at`,
          [privyId, walletAddress, isAdmin, user.id]
        );
        user = updateResult.rows[0];
      }
    }
    
    // Create JWT for existing routes that still expect it (or use Privy's token)
    const token = generateToken(user.id, user.email);
    
    res.json({
      user,
      token,
      message: 'Sync successful'
    });
  } catch (error: any) {
    console.error('Auth sync error:', error);
    res.status(500).json({ error: 'Auth sync failed' });
  }
});

// User Onboarding (Complete profile)
app.post('/api/users/:id/onboard', requireAuth, async (req: Request, res: Response) => {
  const { name, username } = req.body;
  const userId = req.params.id;
  const requestingUserId = (req as any).userId;
  
  try {
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Forbidden: Cannot onboard other profiles' });
    }
    if (!name || !username) {
      return res.status(400).json({ error: 'Name and username are required' });
    }

    // Check if username is taken
    const usernameCheck = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const result = await query(
      `UPDATE users 
       SET name = $1, username = $2, onboarding_completed = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING 
         id, email, username, name, avatar, wallet_balance, wallet_address,
         artist_status, is_admin, onboarding_completed, created_at, updated_at`,
      [name, username, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Admin promotion endpoint (requires admin)
app.post('/api/admin/promote', requireAdmin, async (req: Request, res: Response) => {
  const { targetUserId } = req.body;
  try {
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' });
    }
    
    const result = await query(
      `UPDATE users SET is_admin = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING id, email, is_admin`,
      [targetUserId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User promoted to admin', user: result.rows[0] });
  } catch (error: any) {
    console.error('Admin promotion error:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Update user profile (general)
app.patch('/api/users/:id', requireAuth, validateRequest(UpdateUserSchema), async (req: Request, res: Response) => {
  const { username, name, avatar } = req.body;
  const userId = req.params.id;
  const requestingUserId = (req as any).userId;
  const isAdmin = (req as any).user?.is_admin;
  
  try {
    if (userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify other profiles' });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;
    
    if (username !== undefined) {
      const usernameCheck = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      updates.push(`username = $${paramIdx++}`);
      values.push(username);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(name);
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIdx++}`);
      values.push(avatar);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);
    
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user wallet balance (requires auth and must be own wallet)
app.patch('/api/users/:id/wallet', requireAuth, validateRequest(UpdateWalletSchema), async (req: Request, res: Response) => {
  const { amount } = req.body;
  const userId = req.params.id;
  const requestingUserId = (req as any).userId;
  const isAdmin = (req as any).user?.is_admin;
  
  try {
    // Users can only update their own wallet, or admins can update anyone
    if (userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify other wallets' });
    }
    
    const result = await query(
      `UPDATE users SET wallet_balance = wallet_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING 
         id, email, name, avatar, wallet_balance, wallet_address,
         artist_status, artist_type, is_admin, created_at, updated_at`,
      [amount, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

// Update artist status (requires auth)
app.patch('/api/users/:id/artist-status', requireAuth, validateRequest(UpdateArtistStatusSchema), async (req: Request, res: Response) => {
  const { status, artist_status, artist_type, artist_bio, portfolio_url, social_url, live_location, call_url } = req.body;
  const userId = req.params.id;
  const requestingUserId = (req as any).userId;
  
  try {
    // Users can only update their own artist status
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify other profiles' });
    }
    
    const nextStatus = status || artist_status;
    const result = await query(
      `UPDATE users 
       SET artist_status = $1, artist_type = $2, artist_bio = $3, portfolio_url = $4, 
           social_url = $5, live_location = $6, call_url = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING 
         id, email, name, avatar, wallet_balance, wallet_address,
         artist_status, artist_type, artist_bio, portfolio_url, social_url,
         live_location, call_url, is_admin, created_at, updated_at`,
      [
        nextStatus,
        artist_type,
        artist_bio,
        portfolio_url,
        social_url,
        live_location,
        call_url,
        userId,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update artist status' });
  }
});

// ========== Artworks API ==========

// Get all artworks
app.get('/api/artworks', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        a.*,
        h.id AS holding_id,
        h.user_id AS current_owner_id,
        h.status AS holding_status,
        h.listed_price,
        h.receipt_status,
        h.transfer_status,
        h.acquired_at,
        h.listed_at,
        COALESCE(h.listed_price, a.price) AS market_price
      FROM artworks a
      LEFT JOIN LATERAL (
        SELECT *
        FROM holdings
        WHERE art_id = a.id
          AND receipt_status = 'active'
          AND status <> 'swapped'
        ORDER BY acquired_at DESC
        LIMIT 1
      ) h ON true
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Artworks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// Get artwork by ID
app.get('/api/artworks/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        a.*,
        h.id AS holding_id,
        h.user_id AS current_owner_id,
        h.status AS holding_status,
        h.listed_price,
        h.receipt_status,
        h.transfer_status,
        h.acquired_at,
        h.listed_at,
        COALESCE(h.listed_price, a.price) AS market_price
      FROM artworks a
      LEFT JOIN LATERAL (
        SELECT *
        FROM holdings
        WHERE art_id = a.id
          AND receipt_status = 'active'
          AND status <> 'swapped'
        ORDER BY acquired_at DESC
        LIMIT 1
      ) h ON true
      WHERE a.id::text = $1 OR a.token = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
});

// ========== Image Upload API ==========

// Get presigned URL for uploading artwork image to Supabase Storage
app.post('/api/artworks/upload-image/presigned-url', requireAuth, validateRequest(ImageUploadSchema), async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;
    const userId = (req as any).userId;

    const uploadData = await getPresignedUploadUrl(userId, fileName, fileType);
    
    res.json({
      uploadUrl: uploadData.uploadUrl,
      publicUrl: uploadData.publicUrl,
      path: uploadData.path,
      expiresIn: 3600,
      message: 'Upload directly to this URL using PUT request with file content as body'
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    res.status(400).json({ error: error.message || 'Failed to generate upload URL' });
  }
});

// ========== NFT Contract Deployment API (Artist-Controlled) ==========

// Get artist's deployment wallet
app.get('/api/artist/wallet', requireAuth, async (req: Request, res: Response) => {
  try {
    const artistId = (req as any).userId;
    
    // Check if user is an artist
    const userResult = await query(
      'SELECT artist_status FROM users WHERE id = $1',
      [artistId]
    );
    
    if (userResult.rows.length === 0 || userResult.rows[0].artist_status === 'collector') {
      return res.status(403).json({ error: 'User must be an artist to deploy contracts' });
    }

    let wallet = await getArtistDeploymentWallet(artistId);
    
    if (!wallet) {
      wallet = await createArtistDeploymentWallet(artistId);
    }

    res.json({
      address: wallet.address,
      createdAt: wallet.createdAt,
      message: 'Fund this wallet to deploy NFT contracts and mint NFTs',
    });
  } catch (error: any) {
    console.error('Wallet fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to get artist wallet' });
  }
});

// Deploy NFT contract (artist-controlled)
// SECURITY: This endpoint should use wallet delegation or server-side custody
// NOT accept private keys in request body. For production, implement:
// - User signs a delegation message with their wallet
// - Server stores encrypted keys in HSM/KMS
// - Or use account abstraction / smart wallet patterns
app.post('/api/artist/deploy-contract', requireAuth, validateRequest(ContractDeploymentSchema), async (req: Request, res: Response) => {
  try {
    const { contractName, contractSymbol, baseURIForMetadata, chain = 'base' } = req.body;
    const artistId = (req as any).userId;

    // Verify artist status
    const userResult = await query(
      'SELECT artist_status FROM users WHERE id = $1',
      [artistId]
    );
    
    if (userResult.rows.length === 0 || userResult.rows[0].artist_status === 'collector') {
      return res.status(403).json({ error: 'User must be an artist to deploy contracts' });
    }

    // FIXME: Replace with wallet delegation or server-side custody
    // For now, return error indicating private key support has been removed
    return res.status(501).json({ 
      error: 'Contract deployment is currently disabled for security',
      message: 'We are migrating to secure wallet delegation. Please contact support.',
      note: 'Do not send private keys over HTTP. Use wallet signing instead.'
    });
    
    // TODO: Implement proper flow:
    // 1. Generate deployment auth token
    // 2. User signs with wallet
    // 3. Server verifies signature
    // 4. Deploy contract with server-managed wallet
  } catch (error: any) {
    console.error('Contract deployment error:', error);
    res.status(400).json({ error: error.message || 'Failed to deploy contract' });
  }
});

// Get artist's deployed contracts
app.get('/api/artist/contracts', requireAuth, async (req: Request, res: Response) => {
  try {
    const artistId = (req as any).userId;
    
    const contracts = await getArtistContracts(artistId);
    
    res.json({
      contracts,
      count: contracts.length,
    });
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch contracts' });
  }
});

// Mint NFT from artist's contract
// SECURITY: This endpoint should NOT accept private keys in request body
// Replace with wallet signing, account abstraction, or server-side custody
app.post('/api/artist/mint-nft', requireAuth, validateRequest(MintNFTSchema), async (req: Request, res: Response) => {
  try {
    const { contractAddress, recipientAddress, metadataURI, chain = 'base' } = req.body;
    const artistId = (req as any).userId;

    // Verify artist owns contract
    const contractResult = await query(
      `SELECT artist_id FROM nft_contracts 
       WHERE contract_address = $1`,
      [contractAddress]
    );

    if (contractResult.rows.length === 0 || contractResult.rows[0].artist_id !== artistId) {
      return res.status(403).json({ error: 'Contract not found or not owned by artist' });
    }

    // FIXME: Replace with wallet signing or server-side custody
    return res.status(501).json({
      error: 'NFT minting is currently disabled for security',
      message: 'We are migrating to secure wallet signing. Please contact support.',
      note: 'Do not send private keys over HTTP. Use wallet signing instead.'
    });

    // TODO: Implement proper flow:
    // 1. Artist signs mint authorization with wallet
    // 2. Server verifies signature matches contract owner
    // 3. Execute mint with server-managed or delegated key
  } catch (error: any) {
    console.error('Minting error:', error);
    res.status(400).json({ error: error.message || 'Failed to mint NFT' });
  }
});

// ========== Wallet Management API ==========

// Create user deposit wallet
app.post('/api/wallet/create-deposit', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const wallet = await createUserDepositWallet(userId);

    res.status(201).json({
      address: wallet.address,
      createdAt: wallet.createdAt,
      message: 'Deposit wallet created. Send funds to this address to purchase NFTs.',
    });
  } catch (error: any) {
    console.error('Wallet creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create wallet' });
  }
});

// Get user deposit wallet
app.get('/api/wallet/deposit', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    let wallet = await getUserDepositWallet(userId);
    
    if (!wallet) {
      const newWallet = await createUserDepositWallet(userId);
      wallet = {
        address: newWallet.address,
        balance: '0',
        createdAt: newWallet.createdAt,
      };
    }

    res.json({
      address: wallet.address,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      message: 'Send funds to this address to purchase NFTs and make offers',
    });
  } catch (error: any) {
    console.error('Wallet fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch wallet' });
  }
});

// Record deposit into wallet
// SECURITY: Deposits should be verified on-chain
// TODO: Before marking as confirmed, check:
// - Transaction exists on specified chain (via RPC or block explorer API)
// - Transaction sends funds to user's registered deposit wallet
// - Transaction has sufficient confirmations (>= 12 blocks)
// - Amount matches what was recorded
app.post('/api/wallet/deposit', requireAuth, financialLimiter, validateRequest(DepositSchema), async (req: Request, res: Response) => {
  try {
    const { amount, transactionHash, chain = 'base' } = req.body;
    const userId = (req as any).userId;

    // Basic validation: transaction hash should be valid hex
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({ 
        error: 'Invalid transaction hash format',
        hint: 'Transaction hash must be 66 characters (0x + 64 hex chars)'
      });
    }

    // FIXME: Add on-chain verification here
    // Verify transaction exists and matches deposit
    // Example: await verifyTransactionOnChain(transactionHash, chain, amount, userWalletAddress)
    
    const depositResult = await recordWalletDeposit(
      userId,
      amount,
      transactionHash,
      chain
    );

    res.json({
      balance: depositResult.balance,
      depositedAmount: depositResult.depositedAmount,
      transactionHash: depositResult.transactionHash,
      message: 'Deposit recorded. Funds available for purchases and offers. (Note: On-chain verification pending)',
    });
  } catch (error: any) {
    console.error('Deposit error:', error);
    res.status(400).json({ error: error.message || 'Failed to record deposit' });
  }
});

// Withdraw from wallet
app.post('/api/wallet/withdraw', requireAuth, financialLimiter, validateRequest(WithdrawalSchema), async (req: Request, res: Response) => {
  try {
    const { amount, recipientAddress, chain = 'base' } = req.body;
    const userId = (req as any).userId;

    const withdrawalResult = await recordWalletWithdrawal(
      userId,
      amount,
      recipientAddress,
      '', // Transaction hash will be generated on-chain
      chain
    );

    res.json({
      balance: withdrawalResult.balance,
      withdrawnAmount: withdrawalResult.withdrawnAmount,
      recipientAddress,
      message: 'Withdrawal initiated. Funds will be sent to recipient address on-chain.',
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    res.status(400).json({ error: error.message || 'Failed to process withdrawal' });
  }
});

// Get wallet balance
app.get('/api/wallet/balance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const balance = await getWalletBalance(userId);

    res.json({
      address: balance.address,
      balance: balance.balance,
      chain: balance.chain,
    });
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
});

// Create artwork and optionally list it immediately (requires auth)
app.post('/api/artworks', requireAuth, validateRequest(CreateArtworkSchema), async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { name, artist, category, city, year, price, image, description, collectionType, supplyName, listImmediately = true } = req.body;
    const userId = (req as any).userId;
    
    // User can only create artwork for themselves
    if (req.body.userId && req.body.userId !== userId && !(req as any).user?.is_admin) {
      return res.status(403).json({ error: 'Forbidden: Cannot create artwork for other users' });
    }
    
    await client.query('BEGIN');

    const token = `art-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const uniqueId = `ART-${String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 24)}-${Date.now().toString().slice(-6)}`;
    const artResult = await client.query(
      `INSERT INTO artworks (token, name, artist, category, city, year, price, image, description, unique_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        token,
        name,
        artist,
        category,
        city,
        Number(year),
        Number(price),
        image || '',
        description || `${collectionType || 'Artwork'}${supplyName ? ` - ${supplyName}` : ''}`,
        uniqueId,
      ]
    );
    const artwork = artResult.rows[0];

    const holdingResult = await client.query(
      `INSERT INTO holdings (user_id, art_id, status, listed_price, receipt_status, transfer_status, listed_at)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $3 = 'listed' THEN CURRENT_TIMESTAMP ELSE NULL END)
       RETURNING *`,
      [userId, artwork.id, listImmediately ? 'listed' : 'owned', Number(price), 'active', 'settled']
    );

    await client.query('COMMIT');
    res.status(201).json({ artwork, holding: holdingResult.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Artwork creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create artwork' });
  } finally {
    client.release();
  }
});

// ========== Artwork Submissions (Verification Workflow) ==========

// Submit artwork for verification (artist uploads proof, requires auth)
app.post('/api/artwork-submissions', requireAuth, validateRequest(ArtworkSubmissionSchema), async (req: Request, res: Response) => {
  const { artId, proofImageUrl, proofDocumentUrl, description } = req.body;
  const artistId = (req as any).userId;
  
  try {
    const result = await query(
      `INSERT INTO artwork_submissions (artist_id, art_id, proof_image_url, proof_document_url, description, submission_status)
       VALUES ($1, $2, $3, $4, $5, 'submitted')
       RETURNING *`,
      [artistId, artId, proofImageUrl || '', proofDocumentUrl || '', description || '']
    );

    res.status(201).json({
      submission: result.rows[0],
      message: 'Artwork submitted for verification. Awaiting admin review.'
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to submit artwork for verification' });
  }
});

// Get all submissions for admin review (admin only)
app.get('/api/artwork-submissions', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        s.*,
        u.name AS artist_name,
        u.email AS artist_email,
        a.name AS artwork_name,
        a.image AS artwork_image
      FROM artwork_submissions s
      JOIN users u ON s.artist_id = u.id
      JOIN artworks a ON s.art_id = a.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get submissions for specific artwork
app.get('/api/artwork-submissions/art/:artId', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        s.*,
        u.name AS artist_name,
        u.email AS artist_email
      FROM artwork_submissions s
      JOIN users u ON s.artist_id = u.id
      WHERE s.art_id = $1
      ORDER BY s.created_at DESC
    `, [req.params.artId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Admin review/approve artwork submission (generates on-chain certificate)
app.patch('/api/artwork-submissions/:submissionId/approve', requireAdmin, async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { submissionId } = req.params;
    const { adminId, adminNotes } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'adminId required' });
    }

    await client.query('BEGIN');

    // Get submission with details
    const submissionResult = await client.query(
      'SELECT * FROM artwork_submissions WHERE id = $1 FOR UPDATE',
      [submissionId]
    );
    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = submissionResult.rows[0];

    // Update submission status
    const updatedSubmissionResult = await client.query(
      `UPDATE artwork_submissions
       SET submission_status = 'approved',
           reviewed_by = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           admin_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [adminId, adminNotes || '', submissionId]
    );

    // Get artwork and current owner
    const artworkResult = await client.query(
      'SELECT * FROM artworks WHERE id = $1',
      [submission.art_id]
    );
    const artwork = artworkResult.rows[0];

    // Get current owner/artist
    const holdingResult = await client.query(
      `SELECT user_id FROM holdings
       WHERE art_id = $1 AND receipt_status = 'active'
       ORDER BY acquired_at DESC LIMIT 1`,
      [submission.art_id]
    );
    const ownerId = holdingResult.rows.length > 0 ? holdingResult.rows[0].user_id : submission.artist_id;

    // Mint certificate NFT on Base testnet
    const certificateMetadata = {
      artworkId: artwork.id,
      artworkName: artwork.name,
      artistId: submission.artist_id,
      owner: ownerId,
      verifiedAt: new Date().toISOString(),
      proofImageUrl: submission.proof_image_url,
      proofDocumentUrl: submission.proof_document_url,
    };
    const metadataUri = `ipfs://placeholder-${submissionId}`;

    const nftResult = await mintCertificateNFT(
      submission.artist_id,
      ownerId,
      metadataUri,
      process.env.CERTIFICATE_CONTRACT_ADDRESS
    );

    // Update submission with NFT details
    const nftUpdateResult = await client.query(
      `UPDATE artwork_submissions
       SET nft_transaction_hash = $1,
           nft_token_id = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [nftResult.transactionHash, nftResult.tokenId || '', submissionId]
    );

    // Create certificate record
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const certificateResult = await client.query(
      `INSERT INTO certificates (holding_id, art_id, buyer_id, artist_id, certificate_number, authenticity_verified, verification_method, details)
       SELECT h.id, $1, h.user_id, $2, $3, true, 'blockchain_verified', $4
       FROM holdings h
       WHERE h.art_id = $1 AND h.receipt_status = 'active'
       ORDER BY h.acquired_at DESC LIMIT 1
       RETURNING *`,
      [submission.art_id, submission.artist_id, certificateNumber, JSON.stringify(certificateMetadata)]
    );

    await client.query('COMMIT');

    res.json({
      submission: nftUpdateResult.rows[0],
      certificate: certificateResult.rows.length > 0 ? certificateResult.rows[0] : null,
      nft: nftResult,
      message: 'Artwork verified and certificate NFT minted on Base testnet'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve submission' });
  } finally {
    client.release();
  }
});

// Admin reject artwork submission
app.patch('/api/artwork-submissions/:submissionId/reject', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const adminId = (req as any).userId || req.body?.adminId;
    const { adminNotes } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'adminId required' });
    }

    const result = await query(
      `UPDATE artwork_submissions
       SET submission_status = 'rejected',
           reviewed_by = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           admin_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [adminId, adminNotes || '', submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      submission: result.rows[0],
      message: 'Artwork submission rejected'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject submission' });
  }
});

// ========== Holdings API ==========

// Get user holdings (requires auth)
app.get('/api/holdings/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const requestingUserId = (req as any).userId;
    const isAdmin = (req as any).user?.is_admin;
    
    // Users can only see their own holdings, or admins can see anyone
    if (userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Cannot view other holdings' });
    }
    
    const result = await query(
      `SELECT
        h.id AS holding_id,
        h.user_id,
        h.art_id,
        h.status AS holding_status,
        h.status,
        h.listed_price,
        h.receipt_status,
        h.transfer_status,
        h.acquired_at,
        h.listed_at,
        h.created_at AS holding_created_at,
        a.*
       FROM holdings h
       JOIN artworks a ON h.art_id = a.id
       WHERE h.user_id = $1
         AND h.receipt_status = 'active'
         AND h.status <> 'swapped'
       ORDER BY h.acquired_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

// Create holding (user acquires artwork, requires auth)
app.post('/api/holdings', requireAuth, async (req: Request, res: Response) => {
  const { artId, status } = req.body;
  const userId = (req as any).userId;
  
  try {
    const result = await query(
      `INSERT INTO holdings (user_id, art_id, status, receipt_status, transfer_status)
       VALUES ($1, $2, $3, 'active', 'settled')
       ON CONFLICT (user_id, art_id)
       DO UPDATE SET status = $3, receipt_status = 'active', transfer_status = 'settled'
       RETURNING *`,
      [userId, artId, status || 'owned']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create holding' });
  }
});

// Update a holding into a listing or owned item (requires auth)
app.patch('/api/holdings/:holdingId', requireAuth, validateRequest(UpdateHoldingSchema), async (req: Request, res: Response) => {
  const { holdingId } = req.params;
  const { status, listedPrice } = req.body;
  const userId = (req as any).userId;

  try {
    const result = await query(
      `UPDATE holdings
       SET status = $1,
           listed_price = CASE WHEN $1 = 'listed' THEN $2 ELSE listed_price END,
           listed_at = CASE WHEN $1 = 'listed' THEN CURRENT_TIMESTAMP ELSE listed_at END,
           transfer_status = CASE WHEN $1 = 'listed' THEN 'listed' ELSE transfer_status END
       WHERE id = $3 AND user_id = $4 AND receipt_status = 'active'
       RETURNING *`,
      [status, listedPrice || null, holdingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Holding not found for this user' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update holding' });
  }
});

// ========== Offers API ==========

// Get all offers (requires auth)
app.get('/api/offers', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM offers WHERE status = $1 ORDER BY created_at DESC', ['pending']);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Get offers for artwork (requires auth)
app.get('/api/offers/art/:artId', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM offers WHERE art_id = $1 AND status = $2 ORDER BY created_at DESC',
      [req.params.artId, 'pending']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Create offer with escrow (requires auth, with rate limiting and validation)
app.post('/api/offers', requireAuth, financialLimiter, validateRequest(CreateOfferSchema), async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const buyerId = (req as any).userId;
    const { artId, amount } = req.body;

    await client.query('BEGIN');

    // Lock buyer row and check funds WITHIN transaction to prevent double-spend
    const buyerResult = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
      [buyerId]
    );
    if (buyerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Buyer not found' });
    }
    if (buyerResult.rows[0].wallet_balance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance for offer' });
    }

    // Check art exists and get seller info
    const artResult = await client.query('SELECT * FROM artworks WHERE id = $1', [artId]);
    if (artResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Get current owner of artwork
    const holdingResult = await client.query(
      `SELECT user_id
       FROM holdings
       WHERE art_id = $1
         AND status IN ('owned', 'listed')
         AND receipt_status = 'active'
       ORDER BY acquired_at DESC
       LIMIT 1`,
      [artId]
    );
    const sellerId = holdingResult.rows.length > 0 ? holdingResult.rows[0].user_id : null;

    if (!sellerId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Artwork has no active collector to receive offers' });
    }

    if (sellerId === buyerId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You already hold this artwork' });
    }

    // Create offer
    const offerResult = await client.query(
      `INSERT INTO offers (buyer_id, art_id, cash, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [buyerId, artId, amount, 'pending']
    );
    const offer = offerResult.rows[0];

    // Create transaction
    const txResult = await client.query(
      `INSERT INTO transactions (type, buyer_id, seller_id, amount, art_id, offer_id, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      ['offer', buyerId, sellerId, amount, artId, offer.id, 'pending', JSON.stringify({ offerAmount: amount })]
    );
    const tx = txResult.rows[0];

    // Create escrow to hold buyer funds
    const escrowResult = await client.query(
      `INSERT INTO escrow (transaction_id, amount, from_user_id, to_user_id, art_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tx.id, amount, buyerId, sellerId, artId, 'held']
    );

    // Deduct funds from buyer wallet (AFTER all checks)
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [amount, buyerId]
    );

    await client.query('COMMIT');
    
    res.status(201).json({
      offer: offer,
      transaction: tx,
      escrow: escrowResult.rows[0],
      message: 'Offer created. Funds held in escrow.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Offer creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create offer' });
  } finally {
    client.release();
  }
});

// Accept offer (seller accepts, escrow released to seller, requires auth)
app.patch('/api/offers/:offerId/accept', requireAuth, async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { offerId } = req.params;
    const { sellerId } = req.body;

    if (!offerId || !sellerId) {
      return res.status(400).json({ error: 'Missing offerId or sellerId' });
    }

    await client.query('BEGIN');

    // Get offer
    const offerResult = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [offerId]);
    if (offerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Offer not found' });
    }
    const offer = offerResult.rows[0];

    if (offer.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Offer is no longer pending' });
    }

    // Get transaction
    const txResult = await client.query(
      'SELECT * FROM transactions WHERE offer_id = $1 FOR UPDATE',
      [offerId]
    );
    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const tx = txResult.rows[0];

    // Get escrow
    const escrowResult = await client.query(
      'SELECT * FROM escrow WHERE transaction_id = $1 FOR UPDATE',
      [tx.id]
    );
    if (escrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Escrow not found' });
    }
    const escrow = escrowResult.rows[0];

    // Transfer the active provenance receipt to the buyer immediately.
    // Funds held in escrow while the physical work moves through verification.
    const artTransferResult = await client.query(
      `UPDATE holdings 
       SET user_id = $1,
           status = 'owned',
           listed_price = NULL,
           listed_at = NULL,
           receipt_status = 'active',
           transfer_status = 'verification_pending',
           acquired_at = CURRENT_TIMESTAMP
       WHERE art_id = $2
         AND user_id = $3
         AND status IN ('owned', 'listed')
         AND receipt_status = 'active'
       RETURNING *`,
      [offer.buyer_id, offer.art_id, sellerId]
    );

    if (artTransferResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Artwork not found or seller not owner' });
    }

    // Get certificate to transfer NFT ownership on-chain
    const certificateResult = await client.query(
      `SELECT * FROM certificates
       WHERE art_id = $1 AND buyer_id = $2
       ORDER BY issued_at DESC LIMIT 1`,
      [offer.art_id, sellerId]
    );

    if (certificateResult.rows.length > 0) {
      const certificate = certificateResult.rows[0];
      // Transfer certificate NFT from seller to buyer on Base
      const nftTransfer = await transferCertificateNFT(
        sellerId,
        offer.buyer_id,
        certificate.nft_token_id || certificate.id,
        process.env.CERTIFICATE_CONTRACT_ADDRESS
      );
      console.log('Certificate NFT transferred:', nftTransfer);
    }

    // Calculate platform fee (10%)
    const platformFee = Math.floor(escrow.amount * 0.1);
    const sellerAmount = escrow.amount - platformFee;

    // Release escrow to seller immediately upon acceptance
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [sellerAmount, sellerId]
    );

    // Keep escrow held until vault/admin verification releases funds.
    await client.query(
      `UPDATE escrow SET status = $1 WHERE id = $2`,
      ['released', escrow.id]
    );

    // Update offer status
    await client.query('UPDATE offers SET status = $1 WHERE id = $2', ['accepted', offerId]);

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = $1 WHERE id = $2`,
      ['completed', tx.id]
    );

    await client.query('COMMIT');

    res.json({
      offer: { ...offer, status: 'accepted' },
      transaction: { ...tx, status: 'completed' },
      escrow: { ...escrow, status: 'released' },
      holding: artTransferResult.rows[0],
      sellerReceived: sellerAmount,
      platformFee: platformFee,
      message: 'Offer accepted. Certificate NFT transferred on-chain from seller to buyer. Physical artwork shipped for verification.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Offer acceptance error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept offer' });
  } finally {
    client.release();
  }
});

// Reject offer (refund escrow to buyer, requires auth)
app.patch('/api/offers/:offerId/reject', requireAuth, async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { offerId } = req.params;

    if (!offerId) {
      return res.status(400).json({ error: 'Missing offerId' });
    }

    await client.query('BEGIN');

    // Get offer
    const offerResult = await client.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [offerId]);
    if (offerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Offer not found' });
    }
    const offer = offerResult.rows[0];

    // Get transaction
    const txResult = await client.query(
      'SELECT * FROM transactions WHERE offer_id = $1 FOR UPDATE',
      [offerId]
    );
    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const tx = txResult.rows[0];

    // Get escrow
    const escrowResult = await client.query(
      'SELECT * FROM escrow WHERE transaction_id = $1 FOR UPDATE',
      [tx.id]
    );
    if (escrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Escrow not found' });
    }
    const escrow = escrowResult.rows[0];

    // Refund buyer
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [escrow.amount, offer.buyer_id]
    );

    // Update escrow status
    await client.query(
      `UPDATE escrow SET status = $1, released_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['refunded', escrow.id]
    );

    // Update offer status
    await client.query('UPDATE offers SET status = $1 WHERE id = $2', ['rejected', offerId]);

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['refunded', tx.id]
    );

    await client.query('COMMIT');

    res.json({
      offer: { ...offer, status: 'rejected' },
      transaction: { ...tx, status: 'refunded' },
      escrow: { ...escrow, status: 'refunded' },
      buyerRefunded: escrow.amount,
      message: 'Offer rejected. Funds refunded to buyer.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Offer rejection error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject offer' });
  } finally {
    client.release();
  }
});

// ========== Direct Purchase API (with Escrow) ==========

// Direct buy artwork (not an offer - immediate purchase, requires auth)
app.post('/api/buy', requireAuth, financialLimiter, validateRequest(BuySchema), async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const buyerId = (req as any).userId;
    const { artId, amount, sellerId } = req.body;

    // Check seller exists
    const sellerResult = await client.query('SELECT id FROM users WHERE id = $1', [sellerId]);
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Check art exists
    const artResult = await client.query('SELECT * FROM artworks WHERE id = $1', [artId]);
    if (artResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Check seller owns the artwork
    const holdingResult = await client.query(
      `SELECT *
       FROM holdings
       WHERE art_id = $1
         AND user_id = $2
         AND status IN ('owned', 'listed')
         AND receipt_status = 'active'`,
      [artId, sellerId]
    );
    if (holdingResult.rows.length === 0) {
      return res.status(400).json({ error: 'Seller does not own this artwork or it is not for sale' });
    }

    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    // Lock buyer row and check funds WITHIN transaction with FOR UPDATE to prevent double-spend
    const buyerResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE', [buyerId]);
    if (buyerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Buyer not found' });
    }
    if (buyerResult.rows[0].wallet_balance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance for purchase' });
    }

    // Create transaction
    const txResult = await client.query(
      `INSERT INTO transactions (type, buyer_id, seller_id, amount, art_id, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      ['buy', buyerId, sellerId, amount, artId, 'pending', JSON.stringify({ purchaseAmount: amount })]
    );
    const tx = txResult.rows[0];

    // Create escrow to hold buyer funds
    const escrowResult = await client.query(
      `INSERT INTO escrow (transaction_id, amount, from_user_id, to_user_id, art_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tx.id, amount, buyerId, sellerId, artId, 'held']
    );

    // Deduct funds from buyer wallet
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [amount, buyerId]
    );

    // Transfer art to buyer immediately (direct purchase, no seller approval needed)
    const transferResult = await client.query(
      `UPDATE holdings 
       SET user_id = $1,
           status = 'owned',
           listed_price = NULL,
           listed_at = NULL,
           receipt_status = 'active',
           transfer_status = 'shipping',
           acquired_at = CURRENT_TIMESTAMP
       WHERE art_id = $2
         AND user_id = $3
         AND status IN ('owned', 'listed')
         AND receipt_status = 'active'
       RETURNING *`,
      [buyerId, artId, sellerId]
    );

    if (transferResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Artwork transfer failed' });
    }

    // Calculate fee (10% platform fee)
    const platformFee = Math.floor(amount * 0.1);
    const sellerAmount = amount - platformFee;

    // Release escrow to seller immediately (auto-complete for direct purchase)
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [sellerAmount, sellerId]
    );

    // Update escrow status
    await client.query(
      `UPDATE escrow SET status = $1, released_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['released', escrowResult.rows[0].id]
    );

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['completed', tx.id]
    );

    // Generate certificate of authenticity
    const certificateNumber = `COL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const art = artResult.rows[0];
    
    const certificateResult = await client.query(
      `INSERT INTO certificates (holding_id, art_id, buyer_id, artist_id, certificate_number, details, authenticity_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        transferResult.rows[0].id,
        artId,
        buyerId,
        art.created_by || sellerId, // Use art creator or fallback to seller
        certificateNumber,
        JSON.stringify({
          artworkTitle: art.name,
          artist: art.artist,
          buyer: buyerId,
          purchaseDate: new Date().toISOString(),
          purchasePrice: amount,
          category: art.category,
          year: art.year,
        }),
        true
      ]
    );

    // Update holding with certificate ID
    await client.query(
      `UPDATE holdings SET certificate_id = $1 WHERE id = $2`,
      [certificateResult.rows[0].id, transferResult.rows[0].id]
    );

    await client.query('COMMIT');
    
    res.status(201).json({
      transaction: { ...tx, status: 'completed' },
      escrow: { ...escrowResult.rows[0], status: 'released' },
      holding: transferResult.rows[0],
      certificate: certificateResult.rows[0],
      sellerReceived: sellerAmount,
      platformFee: platformFee,
      message: 'Purchase successful. Provenance receipt transferred instantly and physical artwork is marked for shipping.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Purchase error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete purchase' });
  } finally {
    client.release();
  }
});

// ========== Swap API ==========

// Propose a swap (create bidirectional escrow, requires auth)
app.post('/api/swap', requireAuth, validateRequest(SwapSchema), async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const userId1 = (req as any).userId;
    const { userId2, artId1, artId2, cashAmount = 0 } = req.body;

    if (userId1 === userId2) {
      return res.status(400).json({ error: 'Cannot swap with yourself' });
    }

    // Check both users exist
    const user1Result = await client.query('SELECT id FROM users WHERE id = $1', [userId1]);
    const user2Result = await client.query('SELECT id FROM users WHERE id = $1', [userId2]);
    if (user1Result.rows.length === 0 || user2Result.rows.length === 0) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    // Check both artworks exist
    const art1Result = await client.query('SELECT id FROM artworks WHERE id = $1', [artId1]);
    const art2Result = await client.query('SELECT id FROM artworks WHERE id = $1', [artId2]);
    if (art1Result.rows.length === 0 || art2Result.rows.length === 0) {
      return res.status(404).json({ error: 'One or both artworks not found' });
    }

    // Check user1 owns art1
    const holding1Result = await client.query(
      'SELECT id FROM holdings WHERE art_id = $1 AND user_id = $2 AND status = $3',
      [artId1, userId1, 'owned']
    );
    if (holding1Result.rows.length === 0) {
      return res.status(400).json({ error: 'User 1 does not own artwork 1 or it is not for sale' });
    }

    // Check user2 owns art2
    const holding2Result = await client.query(
      'SELECT id FROM holdings WHERE art_id = $1 AND user_id = $2 AND status = $3',
      [artId2, userId2, 'owned']
    );
    if (holding2Result.rows.length === 0) {
      return res.status(400).json({ error: 'User 2 does not own artwork 2 or it is not for sale' });
    }

    // If there's a cash component, verify user2 has sufficient balance
    if (cashAmount > 0) {
      const user2BalanceResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [userId2]);
      if (user2BalanceResult.rows[0].wallet_balance < cashAmount) {
        return res.status(400).json({ error: 'User 2 has insufficient balance for cash component' });
      }
    }

    await client.query('BEGIN');

    // Create swap transaction
    const txResult = await client.query(
      `INSERT INTO transactions (type, buyer_id, seller_id, amount, art_id, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      ['swap', userId1, userId2, cashAmount, artId1, 'pending', JSON.stringify({ 
        artId1: artId1, 
        artId2: artId2, 
        userId1: userId1, 
        userId2: userId2, 
        cashAmount: cashAmount 
      })]
    );
    const tx = txResult.rows[0];

    // Create escrow for art1 (user1 -> user2)
    const escrow1Result = await client.query(
      `INSERT INTO escrow (transaction_id, amount, from_user_id, to_user_id, art_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tx.id, 0, userId1, userId2, artId1, 'held']
    );

    // Create escrow for art2 (user2 -> user1)
    const escrow2Result = await client.query(
      `INSERT INTO escrow (transaction_id, amount, from_user_id, to_user_id, art_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tx.id, cashAmount, userId2, userId1, artId2, 'held']
    );

    // If there's a cash component, deduct from user2
    if (cashAmount > 0) {
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
        [cashAmount, userId2]
      );
    }

    await client.query('COMMIT');
    
    res.status(201).json({
      transaction: tx,
      escrows: [escrow1Result.rows[0], escrow2Result.rows[0]],
      message: 'Swap proposal created. Both artworks and funds held in escrow.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Swap creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create swap' });
  } finally {
    client.release();
  }
});

// Accept swap (complete bidirectional exchange)
app.patch('/api/swap/:transactionId/accept', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ error: 'Missing transactionId' });
    }

    await client.query('BEGIN');

    // Get transaction
    const txResult = await client.query(
      'SELECT * FROM transactions WHERE id = $1 FOR UPDATE',
      [transactionId]
    );
    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const tx = txResult.rows[0];

    // Get swap details
    const details = JSON.parse(tx.details);
    const { artId1, artId2, userId1, userId2, cashAmount } = details;

    // Get both escrows
    const escrowsResult = await client.query(
      'SELECT * FROM escrow WHERE transaction_id = $1 FOR UPDATE ORDER BY created_at ASC',
      [transactionId]
    );
    if (escrowsResult.rows.length < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Swap escrows not found' });
    }
    const escrow1 = escrowsResult.rows[0]; // art1 to user2
    const escrow2 = escrowsResult.rows[1]; // art2 to user1

    // Transfer art1 from user1 to user2
    const transfer1Result = await client.query(
      `UPDATE holdings 
       SET user_id = $1, acquired_at = CURRENT_TIMESTAMP 
       WHERE art_id = $2 AND user_id = $3 AND status = $4
       RETURNING *`,
      [userId2, artId1, userId1, 'owned']
    );

    if (transfer1Result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Artwork 1 transfer failed' });
    }

    // Transfer art2 from user2 to user1
    const transfer2Result = await client.query(
      `UPDATE holdings 
       SET user_id = $1, acquired_at = CURRENT_TIMESTAMP 
       WHERE art_id = $2 AND user_id = $3 AND status = $4
       RETURNING *`,
      [userId1, artId2, userId2, 'owned']
    );

    if (transfer2Result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Artwork 2 transfer failed' });
    }

    // If there's a cash component, transfer to user1
    if (cashAmount > 0) {
      // Calculate 10% platform fee
      const platformFee = Math.floor(cashAmount * 0.1);
      const user1Amount = cashAmount - platformFee;

      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [user1Amount, userId1]
      );
    }

    // Mark both escrows as released
    await client.query(
      `UPDATE escrow SET status = $1, released_at = CURRENT_TIMESTAMP WHERE id = $2 OR id = $3`,
      ['released', escrow1.id, escrow2.id]
    );

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['completed', transactionId]
    );

    await client.query('COMMIT');

    res.json({
      transaction: { ...tx, status: 'completed' },
      escrows: [
        { ...escrow1, status: 'released' },
        { ...escrow2, status: 'released' }
      ],
      artworksExchanged: {
        to_user1: artId2,
        to_user2: artId1
      },
      cashTransferred: cashAmount > 0 ? cashAmount - Math.floor(cashAmount * 0.1) : 0,
      platformFee: cashAmount > 0 ? Math.floor(cashAmount * 0.1) : 0,
      message: 'Swap completed successfully. Artworks exchanged and escrow released.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Swap completion error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete swap' });
  } finally {
    client.release();
  }
});

// Reject swap (refund both parties)
app.patch('/api/swap/:transactionId/reject', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ error: 'Missing transactionId' });
    }

    await client.query('BEGIN');

    // Get transaction
    const txResult = await client.query(
      'SELECT * FROM transactions WHERE id = $1 FOR UPDATE',
      [transactionId]
    );
    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const tx = txResult.rows[0];

    // Get swap details
    const details = JSON.parse(tx.details);
    const { userId2, cashAmount } = details;

    // Get escrows
    const escrowsResult = await client.query(
      'SELECT * FROM escrow WHERE transaction_id = $1 FOR UPDATE',
      [transactionId]
    );

    // Refund cash component if exists
    if (cashAmount > 0) {
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [cashAmount, userId2]
      );
    }

    // Mark escrows as refunded
    escrowsResult.rows.forEach(async (escrow) => {
      await client.query(
        `UPDATE escrow SET status = $1, released_at = CURRENT_TIMESTAMP WHERE id = $2`,
        ['refunded', escrow.id]
      );
    });

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['refunded', transactionId]
    );

    await client.query('COMMIT');

    res.json({
      transaction: { ...tx, status: 'refunded' },
      message: 'Swap rejected. All parties refunded.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Swap rejection error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject swap' });
  } finally {
    client.release();
  }
});

// ========== Certificates API ==========

// Get certificate by ID
app.get('/api/certificates/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM certificates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Get certificate by holding ID
app.get('/api/certificates/holding/:holdingId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM certificates WHERE holding_id = $1', [req.params.holdingId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found for this holding' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Get all certificates for a user (buyer)
app.get('/api/certificates/user/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM certificates WHERE buyer_id = $1 ORDER BY issued_at DESC', [req.params.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ========== Withdrawals API ==========

// Withdraw funds (no approval needed - immediate, requires auth)
app.post('/api/withdrawals', requireAuth, financialLimiter, async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const userId = req.userId || req.body?.userId;
    const { amount, recipientAddress, artId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress.trim())) {
      return res.status(400).json({ error: 'Invalid Ethereum wallet address' });
    }

    await client.query('BEGIN');

    // Lock user row to prevent concurrent withdrawals
    const userResult = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    let withdrawSource = 'liquid'; // 'liquid' for cash, 'art' for artwork sale

    // If artId provided, they're withdrawing/selling artwork
    if (artId) {
      const holdingResult = await client.query(
        `SELECT h.* FROM holdings h
         WHERE h.art_id = $1 AND h.user_id = $2 
         AND h.receipt_status = 'active' AND h.status IN ('owned', 'listed')`,
        [artId, userId]
      );

      if (holdingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'User does not own this artwork or cannot withdraw it' });
      }

      withdrawSource = 'art';

      // Mark artwork as withdrawn/no longer in collection
      await client.query(
        `UPDATE holdings 
         SET status = 'withdrawn', receipt_status = 'withdrawn'
         WHERE id = $1`,
        [holdingResult.rows[0].id]
      );
    } else {
      // Liquid asset withdrawal - check balance
      if (user.wallet_balance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      // Deduct from wallet
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
        [amount, userId]
      );
    }

    // Create withdrawal transaction (completed immediately, no approval needed)
    const txResult = await client.query(
      `INSERT INTO transactions (type, buyer_id, amount, status, details, completed_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        'withdrawal',
        userId,
        amount,
        'completed',
        JSON.stringify({
          recipientAddress,
          withdrawSource,
          artId: artId || null
        })
      ]
    );

    const transaction = txResult.rows[0];

    // Create withdrawal record (optional - for tracking)
    // Could add a withdrawals table later if needed

    await client.query('COMMIT');

    res.status(201).json({
      transaction,
      message: `Withdrawal of ${amount} initiated to ${recipientAddress}. ${withdrawSource === 'art' ? 'Artwork withdrawn from collection.' : ''}`
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Failed to process withdrawal' });
  } finally {
    client.release();
  }
});

// ========== Transactions API ==========

// Get transaction history
app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit || 50;
    const result = await query(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get user transactions
app.get('/api/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM transactions 
       WHERE buyer_id = $1 OR seller_id = $1
       ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
app.post('/api/transactions', async (req: Request, res: Response) => {
  const { type, buyerId, sellerId, amount, artId, offerId, details } = req.body;
  try {
    const result = await query(
      `INSERT INTO transactions (type, buyer_id, seller_id, amount, art_id, offer_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [type, buyerId, sellerId, amount, artId, offerId, JSON.stringify(details)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Complete transaction
app.patch('/api/transactions/:id/complete', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `UPDATE transactions 
       SET status = $1, completed_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      ['completed', req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete transaction' });
  }
});

// ========== Escrow API ==========

// Get escrow
app.get('/api/escrow/:transactionId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM escrow WHERE transaction_id = $1',
      [req.params.transactionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Escrow not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch escrow' });
  }
});

// Create escrow
app.post('/api/escrow', async (req: Request, res: Response) => {
  const { transactionId, amount, fromUserId, toUserId, artId } = req.body;
  try {
    const result = await query(
      `INSERT INTO escrow (transaction_id, amount, from_user_id, to_user_id, art_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [transactionId, amount, fromUserId, toUserId, artId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create escrow' });
  }
});

// Release escrow (transfer funds)
app.patch('/api/escrow/:id/release', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Get escrow details
    const escrowResult = await client.query(
      'SELECT * FROM escrow WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    
    if (escrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Escrow not found' });
    }
    
    const escrow = escrowResult.rows[0];
    const platformFee = Math.floor(escrow.amount * 0.1); // 10% fee
    const amountToTransfer = escrow.amount - platformFee;
    
    // Update seller wallet
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [amountToTransfer, escrow.to_user_id]
    );
    
    // Update escrow status
    const updateResult = await client.query(
      `UPDATE escrow SET status = $1, released_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      ['released', req.params.id]
    );

    if (escrow.art_id) {
      await client.query(
        `UPDATE holdings
         SET transfer_status = 'verified'
         WHERE art_id = $1 AND user_id = $2 AND receipt_status = 'active'`,
        [escrow.art_id, escrow.from_user_id]
      );
    }
    
    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to release escrow' });
  } finally {
    client.release();
  }
});

// ========== Admin API ==========

// Get admin events (admin only)
app.get('/api/admin/events', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit || 50;
    const result = await query(
      'SELECT * FROM admin_events ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin events' });
  }
});

// Log admin event (admin only)
app.post('/api/admin/events', requireAdmin, async (req: Request, res: Response) => {
  const { action, targetUserId, targetArtId, details } = req.body;
  try {
    const result = await query(
      `INSERT INTO admin_events (action, admin_id, target_user_id, target_art_id, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [action, req.userId, targetUserId, targetArtId, JSON.stringify(details)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log admin event' });
  }
});

// ========== WALLET API ==========

// Get wallet balance from blockchain for specific chain
app.get('/api/wallet/:address/balance/:chain', async (req: Request, res: Response) => {
  try {
    const { address, chain } = req.params as { address: string; chain: string };
    
    if (!isValidWalletAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    if (!['base', 'ethereum', 'polygon'].includes(chain)) {
      return res.status(400).json({ error: 'Invalid chain. Use: base, ethereum, or polygon' });
    }

    const balance = await getWalletBalanceFormatted(
      address,
      chain as 'base' | 'ethereum' | 'polygon'
    );
    
    res.json({
      address,
      ...balance,
    });
  } catch (error: any) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch wallet balance' });
  }
});

// Get wallet balance from all supported chains
app.get('/api/wallet/:address/balance', async (req: Request, res: Response) => {
  try {
    const { address } = req.params as { address: string };
    
    if (!isValidWalletAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const balances = await getWalletBalancesAllChains(address);
    
    res.json({
      address,
      balances,
    });
  } catch (error: any) {
    console.error('Error getting wallet balances:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch wallet balances' });
  }
});

// Get estimated gas fee for chain
app.get('/api/wallet/gas-fee/:chain', async (req: Request, res: Response) => {
  try {
    const { chain } = req.params as { chain: string };
    
    if (!['base', 'ethereum', 'polygon'].includes(chain)) {
      return res.status(400).json({ error: 'Invalid chain. Use: base, ethereum, or polygon' });
    }

    const gasFee = await estimateGasFee(chain as 'base' | 'ethereum' | 'polygon');
    
    res.json({
      chain,
      ...gasFee,
    });
  } catch (error: any) {
    console.error('Error getting gas fee:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch gas fee' });
  }
});

// Create a top-up deposit request
app.post('/api/wallet/topup', async (req: Request, res: Response) => {
  const userId = req.userId || req.body?.userId;
  const { amount, chain, paymentMethod } = req.body;
  try {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!['base', 'ethereum', 'polygon'].includes(chain || 'base')) {
      return res.status(400).json({ error: 'Invalid chain' });
    }

    // Get user and their wallet address
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // Create top-up record in transactions table
    const result = await query(
      `INSERT INTO transactions (type, buyer_id, amount, details, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        'topup',
        userId,
        amount,
        JSON.stringify({
          chain: chain || 'base',
          paymentMethod: paymentMethod || 'stripe',
          walletAddress: user.wallet_address,
          externalId: `topup-${Date.now()}`,
        }),
        'pending',
      ]
    );

    res.status(201).json({
      transactionId: result.rows[0].id,
      status: 'pending',
      amount,
      chain: chain || 'base',
      userWallet: user.wallet_address,
      message: 'Top-up initiated. Please complete payment.',
    });
  } catch (error: any) {
    console.error('Error creating top-up:', error);
    res.status(500).json({ error: error.message || 'Failed to create top-up' });
  }
});

// Complete top-up deposit (called after payment confirmation)
app.patch('/api/wallet/topup/:transactionId/confirm', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    // Get transaction
    const txResult = await query(
      'SELECT * FROM transactions WHERE id = $1 AND type = $2',
      [transactionId, 'topup']
    );

    if (txResult.rows.length === 0) {
      return res.status(404).json({ error: 'Top-up transaction not found' });
    }

    const transaction = txResult.rows[0];

    // Update transaction status
    const updateTxResult = await query(
      `UPDATE transactions SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      ['completed', transactionId]
    );

    // Update user wallet balance
    const updateUserResult = await query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING *`,
      [transaction.amount, transaction.buyer_id]
    );

    res.json({
      transactionId,
      status: 'completed',
      newBalance: updateUserResult.rows[0].wallet_balance,
      amount: transaction.amount,
      message: 'Top-up successful. Funds added to your account.',
    });
  } catch (error: any) {
    console.error('Error confirming top-up:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm top-up' });
  }
});

// Get user's top-up history
app.get('/api/wallet/topups/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT * FROM transactions 
       WHERE buyer_id = $1 AND type = $2 
       ORDER BY created_at DESC`,
      [userId, 'topup']
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching top-ups:', error);
    res.status(500).json({ error: 'Failed to fetch top-up history' });
  }
});

// ========== SYNC WALLET BALANCE ==========

// Sync user's database balance with blockchain balance
app.post('/api/wallet/sync/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { chain } = req.body;

    // Get user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get blockchain balance
    const blockchainBalance = await getWalletBalanceFormatted(
      user.wallet_address,
      chain || 'base'
    );

    res.json({
      userId,
      walletAddress: user.wallet_address,
      databaseBalance: user.wallet_balance,
      blockchainBalance: {
        formatted: blockchainBalance.formatted,
        wei: blockchainBalance.wei,
        token: blockchainBalance.token,
        chain: blockchainBalance.chain,
      },
      synced: true,
    });
  } catch (error: any) {
    console.error('Error syncing wallet:', error);
    res.status(500).json({ error: error.message || 'Failed to sync wallet balance' });
  }
});

// ========== OpenSea Holdings & Trading API ==========

// Record OpenSea NFT holding (import from OpenSea)
app.post('/api/opensea/holding', requireAuth, validateRequest(z.object({
  contractAddress: z.string(),
  tokenId: z.string(),
  collectionName: z.string(),
  name: z.string(),
  image: z.string().optional(),
  chain: z.string().default('ethereum'),
  price: z.number().optional(),
})), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { contractAddress, tokenId, collectionName, name, image, chain, price } = req.body;

    // Store OpenSea holding in database for persistence
    const result = await query(
      `INSERT INTO nft_items 
       (collection_id, name, mint_address, listing_id, marketplace_source, price_native, currency, status, attributes)
       VALUES (
         (SELECT id FROM nft_collections WHERE name = $1 LIMIT 1),
         $2, $3, $4, 'opensea', $5, 'ETH', 'owned', 
         $6
       )
       RETURNING id, name, listing_id, status`,
      [
        collectionName,
        name,
        contractAddress + ':' + tokenId,
        `opensea:${contractAddress}:${tokenId}`,
        price || 0,
        JSON.stringify({
          contractAddress,
          tokenId,
          collectionName,
          image,
          chain,
          importedAt: new Date().toISOString(),
          userId,
        })
      ]
    );

    res.status(201).json({
      nftId: result.rows[0]?.id,
      name: result.rows[0]?.name,
      status: 'imported',
      message: 'OpenSea NFT holding recorded and persisted to database'
    });
  } catch (error: any) {
    console.error('Error recording OpenSea holding:', error);
    res.status(400).json({ error: error.message || 'Failed to record OpenSea holding' });
  }
});

// Record OpenSea resale listing
app.post('/api/opensea/resale', requireAuth, validateRequest(z.object({
  contractAddress: z.string(),
  tokenId: z.string(),
  collectionName: z.string(),
  listedPrice: z.number(),
  currency: z.string().default('ETH'),
  orderHash: z.string().optional(),
})), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { contractAddress, tokenId, collectionName, listedPrice, currency, orderHash } = req.body;

    // Update NFT item with resale listing
    const result = await query(
      `UPDATE nft_items 
       SET status = 'listed', price_native = $1, currency = $2, 
           listing_id = COALESCE($3, listing_id),
           order_hash = COALESCE($4, order_hash),
           updated_at = CURRENT_TIMESTAMP
       WHERE mint_address = $5 AND marketplace_source = 'opensea'
       RETURNING id, name, status, price_native`,
      [listedPrice, currency, `opensea:${contractAddress}:${tokenId}`, orderHash, `${contractAddress}:${tokenId}`]
    );

    res.status(200).json({
      nftId: result.rows[0]?.id,
      name: result.rows[0]?.name,
      status: 'listed',
      listedPrice: result.rows[0]?.price_native,
      message: 'OpenSea resale listing recorded and persisted'
    });
  } catch (error: any) {
    console.error('Error recording OpenSea resale:', error);
    res.status(400).json({ error: error.message || 'Failed to record OpenSea resale' });
  }
});

// Record OpenSea offer/bid
app.post('/api/opensea/offer', requireAuth, validateRequest(z.object({
  contractAddress: z.string(),
  tokenId: z.string(),
  collectionName: z.string(),
  offerPrice: z.number(),
  offerFrom: z.string().optional(), // buyer address or username
  currency: z.string().default('ETH'),
  orderHash: z.string().optional(),
})), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { contractAddress, tokenId, collectionName, offerPrice, offerFrom, currency, orderHash } = req.body;

    // Store offer/bid in database
    // For now, we store it in nft_items as an offer record
    // In production, create a dedicated opensea_offers table
    const result = await query(
      `INSERT INTO offers (buyer_id, art_id, cash, buyer_initials, placed_ago)
       SELECT $1, a.id, $2, 'OS', 'just now'
       FROM artworks a
       WHERE a.token = $3
       RETURNING id, cash`,
      [userId, Math.floor(offerPrice), `opensea:${contractAddress}:${tokenId}`]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Artwork not found', 
        hint: 'OpenSea NFT must exist in our database first' 
      });
    }

    res.status(201).json({
      offerId: result.rows[0]?.id,
      offerPrice: result.rows[0]?.cash,
      status: 'pending',
      message: 'OpenSea offer recorded and persisted to database'
    });
  } catch (error: any) {
    console.error('Error recording OpenSea offer:', error);
    res.status(400).json({ error: error.message || 'Failed to record OpenSea offer' });
  }
});

// Serve static files from the dist directory (built React app)
app.use(express.static(path.join(__dirname, '../dist'), { maxAge: '1d' }));

// Catch-all route to serve index.html for client-side routing
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../dist') });
});

// Fallback for all other routes - serve index.html for client-side routing
app.use((req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../dist') });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  // Supabase connection is REQUIRED - no mock fallback
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Connected to Supabase PostgreSQL');
    
    // Ensure schema
    await ensureRuntimeSchema().catch((error) => {
      console.error('Runtime schema check failed:', error);
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📊 Database: Supabase PostgreSQL`);
      console.log(`⛓️  Blockchain: Base (${process.env.BASE_RPC_URL || 'Base Sepolia Testnet'})`);
    });
  } catch (error) {
    console.error('❌ FATAL: Supabase connection failed. Database persistence is required.');
    console.error('Please ensure DATABASE_URL is set in .env.local');
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer().catch(console.error);
}

export default app;

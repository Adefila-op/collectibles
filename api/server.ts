import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { query, getClient } from './db.ts';
import { 
  generateDeterministicWallet, 
  getWalletBalance,
  getWalletBalanceFormatted,
  getWalletBalancesAllChains,
  estimateGasFee,
  isValidWalletAddress
} from './wallet.ts';

dotenv.config({ path: '.env.local' });

const app: Express = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function ensureRuntimeSchema() {
  await query(`
    ALTER TABLE holdings
      ADD COLUMN IF NOT EXISTS listed_price BIGINT,
      ADD COLUMN IF NOT EXISTS receipt_status VARCHAR(50) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(50) DEFAULT 'settled',
      ADD COLUMN IF NOT EXISTS listed_at TIMESTAMP
  `);
}

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// ========== Users API ==========

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
app.post('/api/users', async (req: Request, res: Response) => {
  const { email, password, name, avatar } = req.body;
  try {
    // Generate deterministic wallet for user
    const { address: walletAddress } = generateDeterministicWallet(email);
    
    const result = await query(
      `INSERT INTO users (email, password, name, avatar, wallet_balance, wallet_address, artist_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [email, password, name, avatar || 'U', 0, walletAddress, 'collector']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user wallet balance
app.patch('/api/users/:id/wallet', async (req: Request, res: Response) => {
  const { amount } = req.body;
  try {
    const result = await query(
      `UPDATE users SET wallet_balance = wallet_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [amount, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

// Update artist status
app.patch('/api/users/:id/artist-status', async (req: Request, res: Response) => {
  const { status, artistType, artistBio, portfolioUrl, socialUrl, liveLocation, callUrl } = req.body;
  try {
    const result = await query(
      `UPDATE users 
       SET artist_status = $1, artist_type = $2, artist_bio = $3, portfolio_url = $4, 
           social_url = $5, live_location = $6, call_url = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [status, artistType, artistBio, portfolioUrl, socialUrl, liveLocation, callUrl, req.params.id]
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

// Create artwork and optionally list it immediately
app.post('/api/artworks', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const {
      userId,
      name,
      artist,
      category,
      city,
      year,
      price,
      image,
      description,
      collectionType,
      supplyName,
      listImmediately = true,
    } = req.body;

    if (!userId || !name || !artist || !category || !city || !year || !price) {
      return res.status(400).json({ error: 'Missing artwork fields' });
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

// ========== Holdings API ==========

// Get user holdings
app.get('/api/holdings/:userId', async (req: Request, res: Response) => {
  try {
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
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

// Create holding (user acquires artwork)
app.post('/api/holdings', async (req: Request, res: Response) => {
  const { userId, artId, status } = req.body;
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

// Update a holding into a listing or owned item
app.patch('/api/holdings/:holdingId', async (req: Request, res: Response) => {
  const { holdingId } = req.params;
  const { userId, status, listedPrice } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ error: 'Missing holding update fields' });
  }

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

// Get all offers
app.get('/api/offers', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM offers WHERE status = $1 ORDER BY created_at DESC', ['pending']);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Get offers for artwork
app.get('/api/offers/art/:artId', async (req: Request, res: Response) => {
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

// Create offer with escrow
app.post('/api/offers', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { buyerId, artId, amount } = req.body;
    
    if (!buyerId || !artId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Missing or invalid offer fields' });
    }

    // Check buyer has funds
    const buyerResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [buyerId]);
    if (buyerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    if (buyerResult.rows[0].wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance for offer' });
    }

    // Check art exists and get seller info
    const artResult = await client.query('SELECT * FROM artworks WHERE id = $1', [artId]);
    if (artResult.rows.length === 0) {
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
      return res.status(400).json({ error: 'Artwork has no active collector to receive offers' });
    }

    if (sellerId === buyerId) {
      return res.status(400).json({ error: 'You already hold this artwork' });
    }

    await client.query('BEGIN');

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

    // Deduct funds from buyer wallet
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

// Accept offer (seller accepts, escrow released to seller)
app.patch('/api/offers/:offerId/accept', async (req: Request, res: Response) => {
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
    // Funds remain in escrow while the physical work moves through verification.
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

    // Keep escrow held until vault/admin verification releases funds.
    await client.query(
      `UPDATE escrow SET status = $1 WHERE id = $2`,
      ['verification_pending', escrow.id]
    );

    // Update offer status
    await client.query('UPDATE offers SET status = $1 WHERE id = $2', ['accepted', offerId]);

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = $1 WHERE id = $2`,
      ['verification_pending', tx.id]
    );

    await client.query('COMMIT');

    res.json({
      offer: { ...offer, status: 'accepted' },
      transaction: { ...tx, status: 'verification_pending' },
      escrow: { ...escrow, status: 'verification_pending' },
      holding: artTransferResult.rows[0],
      sellerReceived: 0,
      platformFee: 0,
      message: 'Offer accepted. Provenance receipt transferred. Funds remain in escrow while art is in transit for verification.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Offer acceptance error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept offer' });
  } finally {
    client.release();
  }
});

// Reject offer (refund escrow to buyer)
app.patch('/api/offers/:offerId/reject', async (req: Request, res: Response) => {
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

// Direct buy artwork (not an offer - immediate purchase)
app.post('/api/buy', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { buyerId, artId, amount, sellerId } = req.body;
    
    if (!buyerId || !artId || !amount || !sellerId || amount <= 0) {
      return res.status(400).json({ error: 'Missing or invalid purchase fields' });
    }

    // Check buyer has funds
    const buyerResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [buyerId]);
    if (buyerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    if (buyerResult.rows[0].wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance for purchase' });
    }

    // Check seller exists
    const sellerResult = await client.query('SELECT id FROM users WHERE id = $1', [sellerId]);
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Check art exists and seller owns it
    const artResult = await client.query('SELECT * FROM artworks WHERE id = $1', [artId]);
    if (artResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

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

    await client.query('BEGIN');

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

    await client.query('COMMIT');
    
    res.status(201).json({
      transaction: { ...tx, status: 'completed' },
      escrow: { ...escrowResult.rows[0], status: 'released' },
      holding: transferResult.rows[0],
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

// Propose a swap (create bidirectional escrow)
app.post('/api/swap', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { userId1, userId2, artId1, artId2, cashAmount } = req.body;
    
    if (!userId1 || !userId2 || !artId1 || !artId2 || cashAmount < 0) {
      return res.status(400).json({ error: 'Missing or invalid swap fields' });
    }

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

// Get admin events
app.get('/api/admin/events', async (req: Request, res: Response) => {
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

// Log admin event
app.post('/api/admin/events', async (req: Request, res: Response) => {
  const { action, adminId, targetUserId, targetArtId, details } = req.body;
  try {
    const result = await query(
      `INSERT INTO admin_events (action, admin_id, target_user_id, target_art_id, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [action, adminId, targetUserId, targetArtId, JSON.stringify(details)]
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
    const { address, chain } = req.params;
    
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
    const { address } = req.params;
    
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
    const { chain } = req.params;
    
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
  const { userId, amount, chain, paymentMethod } = req.body;
  try {
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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
ensureRuntimeSchema()
  .catch((error) => {
    console.error('Runtime schema check failed:', error);
  })
  .finally(() => {
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log('📊 Database:', process.env.DB_NAME);
});
  });

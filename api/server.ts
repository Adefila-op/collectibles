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
    const result = await query('SELECT * FROM artworks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// Get artwork by ID
app.get('/api/artworks/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM artworks WHERE id = $1 OR token = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
});

// ========== Holdings API ==========

// Get user holdings
app.get('/api/holdings/:userId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT h.*, a.* FROM holdings h
       JOIN artworks a ON h.art_id = a.id
       WHERE h.user_id = $1
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
      `INSERT INTO holdings (user_id, art_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, art_id) DO UPDATE SET status = $3
       RETURNING *`,
      [userId, artId, status || 'owned']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create holding' });
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
      'SELECT user_id FROM holdings WHERE art_id = $1 AND status = $2 ORDER BY acquired_at DESC LIMIT 1',
      [artId, 'owned']
    );
    const sellerId = holdingResult.rows.length > 0 ? holdingResult.rows[0].user_id : null;

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

    // Calculate fee (10% platform fee)
    const platformFee = Math.floor(escrow.amount * 0.1);
    const sellerAmount = escrow.amount - platformFee;

    // Transfer art to buyer
    const artTransferResult = await client.query(
      `UPDATE holdings 
       SET user_id = $1, acquired_at = CURRENT_TIMESTAMP 
       WHERE art_id = $2 AND user_id = $3 AND status = $4
       RETURNING *`,
      [offer.buyer_id, offer.art_id, sellerId, 'owned']
    );

    if (artTransferResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Artwork not found or seller not owner' });
    }

    // Release escrow to seller
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [sellerAmount, sellerId]
    );

    // Update escrow status
    await client.query(
      `UPDATE escrow SET status = $1, released_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['released', escrow.id]
    );

    // Update offer status
    await client.query('UPDATE offers SET status = $1 WHERE id = $2', ['accepted', offerId]);

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['completed', tx.id]
    );

    await client.query('COMMIT');

    res.json({
      offer: { ...offer, status: 'accepted' },
      transaction: { ...tx, status: 'completed' },
      escrow: { ...escrow, status: 'released' },
      sellerReceived: sellerAmount,
      platformFee: platformFee,
      message: 'Offer accepted. Funds released to seller. Art transferred to buyer.'
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
      'SELECT * FROM holdings WHERE art_id = $1 AND user_id = $2 AND status = $3',
      [artId, sellerId, 'owned']
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
    await client.query(
      `UPDATE holdings 
       SET user_id = $1, acquired_at = CURRENT_TIMESTAMP 
       WHERE art_id = $2 AND user_id = $3 AND status = $4`,
      [buyerId, artId, sellerId, 'owned']
    );

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
      sellerReceived: sellerAmount,
      platformFee: platformFee,
      message: 'Purchase successful. Art transferred and funds released to seller.'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Purchase error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete purchase' });
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
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log('📊 Database:', process.env.DB_NAME);
});

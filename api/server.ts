import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { query, getClient } from './db.ts';

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
    const result = await query(
      `INSERT INTO users (email, password, name, avatar, wallet_balance, artist_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email, password, name, avatar || 'U', 0, 'collector']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
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

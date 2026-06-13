import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify JWT token and extract user ID
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; sub?: string; email?: string };
    const userId = decoded.userId || decoded.sub;
    if (!userId) return null;
    return { userId, email: decoded.email || '' };
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to verify JWT token from Authorization header
 * Sets req.userId and req.user if token is valid
 */
export async function requireAuth(req: any, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized: Missing or invalid Authorization header' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        error: 'Unauthorized: Invalid or expired token' 
      });
    }

    // Verify user still exists in database
    const result = await query(
      'SELECT id, email, is_admin FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Unauthorized: User not found' 
      });
    }

    req.userId = decoded.userId;
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Authorization verification failed' });
  }
}

/**
 * Middleware to verify user is admin
 * Must be used after requireAuth
 */
export async function requireAdmin(req: any, res: Response, next: any) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }

    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

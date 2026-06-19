import { z } from 'zod';
import { Response } from 'express';

/**
 * Validation schemas for API requests
 */

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  name: z.string().min(1, 'Name cannot be empty').optional(),
  avatar: z.string().optional(),
});

export const CreateArtworkSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  name: z.string().min(1, 'Artwork name is required'),
  artist: z.string().min(1, 'Artist name is required'),
  category: z.string().min(1, 'Category is required'),
  city: z.string().min(1, 'City is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear(), 'Invalid year'),
  price: z.number().positive('Price must be positive'),
  image: z.string().optional(),
  description: z.string().optional(),
  collectionType: z.string().optional(),
  supplyName: z.string().optional(),
  listImmediately: z.boolean().optional(),
});

export const CreateOfferSchema = z.object({
  artId: z.string().uuid('Invalid artwork ID'),
  amount: z.number().positive('Amount must be positive'),
});

export const BuySchema = z.object({
  artId: z.string().uuid('Invalid artwork ID'),
  amount: z.number().positive('Amount must be positive'),
  sellerId: z.string().uuid('Invalid seller ID'),
});

export const SwapSchema = z.object({
  userId2: z.string().uuid('Invalid user ID'),
  artId1: z.string().uuid('Invalid artwork ID'),
  artId2: z.string().uuid('Invalid artwork ID'),
  cashAmount: z.number().min(0, 'Cash amount must be non-negative').optional(),
});

export const UpdateWalletSchema = z.object({
  amount: z.number().int('Amount must be an integer'),
});

export const UpdateArtistStatusSchema = z.object({
  status: z.enum(['collector', 'artist', 'verified_artist']).optional(),
  artist_status: z.enum(['collector', 'artist', 'verified_artist']).optional(),
  artist_type: z.string().optional(),
  artist_bio: z.string().optional(),
  portfolio_url: z.string().url().optional(),
  social_url: z.string().url().optional(),
  live_location: z.string().optional(),
  call_url: z.string().url().optional(),
});

export const ArtworkSubmissionSchema = z.object({
  artId: z.string().uuid('Invalid artwork ID'),
  proofImageUrl: z.string().url('Invalid image URL').optional(),
  proofDocumentUrl: z.string().url('Invalid document URL').optional(),
  description: z.string().optional(),
});

export const UpdateHoldingSchema = z.object({
  status: z.enum(['owned', 'listed']),
  listedPrice: z.number().positive('Listed price must be positive').optional(),
});

export const ImageUploadSchema = z.object({
  fileName: z.string().min(1, 'File name required'),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

export const ContractDeploymentSchema = z.object({
  contractName: z.string().min(1, 'Contract name required'),
  contractSymbol: z.string().min(1, 'Contract symbol required').max(10),
  baseURIForMetadata: z.string().url('Invalid metadata URI'),
  chain: z.enum(['base', 'ethereum', 'polygon']).optional(),
  privateKey: z.string().min(1, 'Private key required for deployment'),
});

export const MintNFTSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  metadataURI: z.string().url('Invalid metadata URI'),
  privateKey: z.string().min(1, 'Private key required for minting'),
  chain: z.enum(['base', 'ethereum', 'polygon']).optional(),
});

export const DepositSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount format'),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  chain: z.enum(['base', 'ethereum', 'polygon']).optional(),
});

export const WithdrawalSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount format'),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  chain: z.enum(['base', 'ethereum', 'polygon']).optional(),
});

/**
 * Middleware factory for request validation
 */
export function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: Response, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors,
        });
      }
      res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

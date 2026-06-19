import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: any = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Image uploads will be disabled.');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

/**
 * Generate a presigned URL for uploading artwork images
 * Artist uploads directly to Supabase Storage, then shares URL with artwork
 */
export async function getPresignedUploadUrl(
  artistId: string,
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; publicUrl: string; path: string }> {
  try {
    if (!supabaseUrl) {
      throw new Error('Supabase not configured');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(fileType)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const ext = fileName.split('.').pop();
    const storagePath = `artwork/${artistId}/${timestamp}-${randomId}.${ext}`;

    // Get presigned URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('artworks')
      .createSignedUploadUrl(storagePath);

    if (error) {
      throw error;
    }

    // Generate public URL (for after upload)
    const { data: publicUrlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(storagePath);

    return {
      uploadUrl: data.signedUrl,
      publicUrl: publicUrlData.publicUrl,
      path: storagePath,
    };
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

/**
 * Upload file directly to Supabase Storage
 * Used for server-side uploads or fallback
 */
export async function uploadArtworkImage(
  artistId: string,
  fileName: string,
  fileBuffer: Buffer,
  fileType: string
): Promise<{ publicUrl: string; path: string }> {
  try {
    if (!supabaseUrl) {
      throw new Error('Supabase not configured');
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const ext = fileName.split('.').pop();
    const storagePath = `artwork/${artistId}/${timestamp}-${randomId}.${ext}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from('artworks')
      .upload(storagePath, fileBuffer, {
        contentType: fileType,
        cacheControl: '3600',
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(storagePath);

    return {
      publicUrl: publicUrlData.publicUrl,
      path: storagePath,
    };
  } catch (error: any) {
    console.error('Error uploading artwork image:', error);
    throw error;
  }
}

/**
 * Delete artwork image from storage
 */
export async function deleteArtworkImage(storagePath: string): Promise<void> {
  try {
    if (!supabaseUrl) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.storage
      .from('artworks')
      .remove([storagePath]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting artwork image:', error);
    throw error;
  }
}

/**
 * Get presigned download URL for accessing private artwork
 */
export async function getPresignedDownloadUrl(
  storagePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    if (!supabaseUrl) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.storage
      .from('artworks')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    throw error;
  }
}

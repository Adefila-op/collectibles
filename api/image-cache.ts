import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../dist/images/cache');
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Generate cache key from URL
 */
function generateCacheKey(imageUrl: string): string {
  return Buffer.from(imageUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Get cached image path
 */
function getCachePath(imageUrl: string): string {
  const key = generateCacheKey(imageUrl);
  const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
  return path.join(CACHE_DIR, `${key}${ext}`);
}

/**
 * Check if cache is valid (not expired)
 */
function isCacheValid(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;

  try {
    const stats = fs.statSync(filePath);
    const now = Date.now();
    return now - stats.mtime.getTime() < CACHE_EXPIRY;
  } catch {
    return false;
  }
}

/**
 * Download and cache image from URL
 */
export async function cacheImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      ensureCacheDir();

      const cachePath = getCachePath(imageUrl);

      // Return cached if valid
      if (isCacheValid(cachePath)) {
        resolve(`/images/cache/${path.basename(cachePath)}`);
        return;
      }

      // Download image
      const protocol = imageUrl.startsWith('https') ? https : http;
      const request = protocol.get(imageUrl, { timeout: 10000 }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
          return;
        }

        const file = fs.createWriteStream(cachePath);
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(`/images/cache/${path.basename(cachePath)}`);
        });

        file.on('error', (err) => {
          fs.unlink(cachePath, () => {}); // Delete incomplete file
          reject(err);
        });
      });

      request.on('error', (err) => {
        fs.unlink(cachePath, () => {}); // Delete incomplete file
        reject(err);
      });

      request.on('timeout', () => {
        request.destroy();
        fs.unlink(cachePath, () => {}); // Delete incomplete file
        reject(new Error('Request timeout'));
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get image from cache or download if not cached
 */
export async function getImageFromCache(imageUrl: string): Promise<string> {
  try {
    return await cacheImage(imageUrl);
  } catch (error) {
    console.error(`Error caching image ${imageUrl}:`, error);
    // Return original URL as fallback
    return imageUrl;
  }
}

/**
 * Clean up old cached images
 */
export function cleanupOldImages(): void {
  try {
    ensureCacheDir();

    const now = Date.now();
    fs.readdirSync(CACHE_DIR).forEach((file) => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > CACHE_EXPIRY) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old cache: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old images:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { totalSize: number; fileCount: number; files: string[] } {
  try {
    ensureCacheDir();

    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;

    files.forEach((file) => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });

    return {
      totalSize,
      fileCount: files.length,
      files,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalSize: 0, fileCount: 0, files: [] };
  }
}

/**
 * Clear all cached images
 */
export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      fs.readdirSync(CACHE_DIR).forEach((file) => {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      });
      console.log('Cache cleared');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

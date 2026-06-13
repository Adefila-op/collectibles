# Solana NFT API Reference

## Base URL
```
http://localhost:3000/api
```

---

## Solana NFT Endpoints

### 1. Get Solana NFT Listings

**Endpoint:** `GET /solana/nfts/listings`

**Query Parameters:**
| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| limit | number | 20 | 1-100 | Number of NFTs to return |

**Response:**
```json
{
  "listings": [
    {
      "id": "contract-tokenid",
      "name": "DeGod #1234",
      "description": "A legendary DeGod NFT",
      "imageUrl": "https://...",
      "imageUrlCached": "/images/cache/abc123.jpg",
      "floorPrice": "25.50",
      "currency": "SOL",
      "collectionName": "DeGods",
      "collectionAddress": "9B5...",
      "tokenAddress": "9B5...",
      "tokenId": "1234",
      "chain": "solana",
      "contractAddress": "9B5...",
      "permalinkUrl": "https://opensea.io/...",
      "rarity": "Rarity Rank: #456"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:3000/api/solana/nfts/listings?limit=10"
```

---

### 2. Get NFT Details

**Endpoint:** `GET /solana/nfts/:contractAddress/:tokenId`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| contractAddress | string | Solana contract address |
| tokenId | string | Token ID on contract |

**Response:**
```json
{
  "nft": {
    "id": "contract-tokenid",
    "name": "DeGod #1234",
    "description": "...",
    "imageUrl": "https://...",
    "imageUrlCached": "/images/cache/abc123.jpg",
    "floorPrice": "25.50",
    "currency": "SOL",
    "collectionName": "DeGods",
    "collectionAddress": "9B5...",
    "tokenAddress": "9B5...",
    "tokenId": "1234",
    "chain": "solana",
    "contractAddress": "9B5...",
    "permalinkUrl": "https://opensea.io/...",
    "rarity": "Rarity Rank: #456"
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/solana/nfts/9B5X6wrjCiak2oRM3KgMocEZwYvqSSizUX5C7JZCjLn/1234"
```

---

### 3. Search Solana NFTs

**Endpoint:** `GET /solana/nfts/search`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query (collection name) |
| limit | number | No | Number of results (1-100, default 20) |

**Response:**
```json
{
  "results": [
    {
      "id": "...",
      "name": "...",
      "imageUrl": "...",
      "imageUrlCached": "...",
      "floorPrice": "...",
      "currency": "SOL",
      "collectionName": "...",
      ...
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:3000/api/solana/nfts/search?q=degods&limit=20"
```

---

## Image Cache Endpoints

### 1. Cache an Image

**Endpoint:** `POST /images/cache`

**Request:**
```json
{
  "imageUrl": "https://..."
}
```

**Response:**
```json
{
  "cachedUrl": "/images/cache/abc123.jpg",
  "originalUrl": "https://..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/images/cache \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/nft.jpg"}'
```

---

### 2. Get Cache Statistics (Admin Only)

**Endpoint:** `GET /images/cache/stats`

**Authentication:** Requires JWT token + admin role

**Response:**
```json
{
  "totalSize": 52428800,
  "fileCount": 256,
  "files": ["abc123.jpg", "def456.png", ...]
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/images/cache/stats
```

---

### 3. Clear Cache (Admin Only)

**Endpoint:** `DELETE /images/cache`

**Authentication:** Requires JWT token + admin role

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

**Example:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/images/cache
```

---

## Solana Wallet Endpoints

### 1. Create Solana Wallet

**Endpoint:** `POST /solana/wallet/create`

**Authentication:** Requires JWT token

**Response:**
```json
{
  "success": true,
  "wallet": {
    "address": "9B5X6wrjCiak2oRM3KgMocEZwYvqSSizUX5C7JZCjLn"
  }
}
```

**Note:** Private key is NOT returned for security

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/solana/wallet/create
```

---

### 2. Get Wallet Balance

**Endpoint:** `GET /solana/wallet/:address/balance`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| address | string | Solana wallet address |

**Response:**
```json
{
  "address": "9B5X6wrjCiak2oRM3KgMocEZwYvqSSizUX5C7JZCjLn",
  "balance": "5000000000",
  "balanceFormatted": "5.0000 SOL",
  "chain": "solana-mainnet",
  "token": "SOL"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/solana/wallet/9B5X6wrjCiak2oRM3KgMocEZwYvqSSizUX5C7JZCjLn/balance"
```

---

## Error Responses

### Missing Required Parameters
```json
{
  "error": "Missing contractAddress or tokenId"
}
```

### Invalid Address
```json
{
  "error": "Invalid Solana address"
}
```

### Unauthenticated Request
```json
{
  "error": "Authentication required"
}
```

### Insufficient Permissions
```json
{
  "error": "Admin access required"
}
```

### Server Error
```json
{
  "error": "Unable to fetch Solana NFT listings",
  "detail": "OpenSea API error: Rate limit exceeded"
}
```

---

## Rate Limiting

- **NFT Endpoints:** 100 requests/minute
- **Search:** 50 requests/minute
- **Image Cache:** 200 requests/minute (per IP)
- **Wallet:** 100 requests/minute

---

## Authentication

For protected endpoints, include JWT token in Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## Response Headers

All responses include:
```
Content-Type: application/json
Cache-Control: public, max-age=3600
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

---

## Examples

### Complete Flow: Get NFT and Cache Image

```bash
# 1. Get listings
curl "http://localhost:3000/api/solana/nfts/listings?limit=1" > listings.json

# 2. Extract first NFT
NFT=$(jq '.listings[0]' listings.json)
IMAGE_URL=$(echo $NFT | jq -r '.imageUrl')

# 3. Cache the image
CACHED=$(curl -X POST http://localhost:3000/api/images/cache \
  -H "Content-Type: application/json" \
  -d "{\"imageUrl\":\"$IMAGE_URL\"}")

CACHED_URL=$(echo $CACHED | jq -r '.cachedUrl')

echo "NFT: $(echo $NFT | jq -r '.name')"
echo "Floor Price: $(echo $NFT | jq -r '.floorPrice')"
echo "Cached Image: $CACHED_URL"
```

### JavaScript/Fetch

```javascript
// Get NFT listings with caching
async function getNFTListings() {
  const response = await fetch('/api/solana/nfts/listings?limit=20');
  const data = await response.json();
  return data.listings;
}

// Cache image
async function cacheImage(imageUrl) {
  const response = await fetch('/api/images/cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });
  return response.json();
}

// Get wallet balance
async function getBalance(address) {
  const response = await fetch(`/api/solana/wallet/${address}/balance`);
  return response.json();
}

// Usage
const nfts = await getNFTListings();
const balance = await getBalance('9B5X6wrjCiak2oRM3KgMocEZwYvqSSizUX5C7JZCjLn');
```

### Python Example

```python
import requests

BASE_URL = 'http://localhost:3000/api'

# Get NFT listings
response = requests.get(f'{BASE_URL}/solana/nfts/listings', params={'limit': 20})
listings = response.json()['listings']

# Cache image
for nft in listings:
    cache_response = requests.post(
        f'{BASE_URL}/images/cache',
        json={'imageUrl': nft['imageUrl']}
    )
    cached_data = cache_response.json()
    print(f"{nft['name']}: {cached_data['cachedUrl']}")

# Get wallet balance
balance_response = requests.get(
    f'{BASE_URL}/solana/wallet/9B5X6wrjCiak2oRM3KgMocEZwYvqSSizUX5C7JZCjLn/balance'
)
balance_info = balance_response.json()
print(f"Balance: {balance_info['balanceFormatted']}")
```

---

## Webhooks (Optional Future Enhancement)

```
POST /api/webhooks/nft-events
- nft:sold
- nft:listed
- nft:offer:received
- nft:offer:accepted
```

---

## Pagination (Optional Future Enhancement)

```
GET /api/solana/nfts/listings?limit=20&offset=0&sort=price_low&filter=collection:degods
```

---

This API provides complete Solana NFT marketplace functionality! 🚀

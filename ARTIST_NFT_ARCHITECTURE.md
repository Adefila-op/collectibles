# Artist-Controlled NFT Contract Deployment & Supabase Integration

## Architecture Overview

### **User Wallets**
- Platform creates a **deposit wallet** for each user
- Users send funds to this wallet address
- Platform tracks balance internally
- Users use balance to purchase NFTs and make offers

### **Artist Contract Deployment**
- Artists get a **deployment wallet** to deploy their own ERC721 contracts
- Artist **controls and owns the contract**
- Artist mints NFTs from their contract
- Platform provides gas fee management and wallet infrastructure

### **Image Upload**
- Artwork images stored in **Supabase Storage**
- Artists get presigned URLs for direct upload
- Images are publicly accessible via CDN

---

## 1. Image Upload Flow

### Endpoint: Get Presigned Upload URL
```typescript
POST /api/artworks/upload-image/presigned-url
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request:
{
  "fileName": "my-artwork.jpg",
  "fileType": "image/jpeg"
}

Response:
{
  "uploadUrl": "https://storage.supabase.co/...",
  "publicUrl": "https://collectibles.supabase.co/storage/v1/object/public/artworks/...",
  "path": "artwork/artist-id/1718104800000-abc123.jpg",
  "expiresIn": 3600,
  "message": "Upload directly to this URL using PUT request with file content as body"
}
```

### Frontend Implementation
```typescript
// 1. Get presigned URL
const response = await fetch('/api/artworks/upload-image/presigned-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type
  })
});

const { uploadUrl, publicUrl } = await response.json();

// 2. Upload directly to Supabase Storage
const uploadResponse = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type,
  },
  body: file
});

// 3. Use publicUrl when creating artwork
const artworkResponse = await fetch('/api/artworks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'My NFT',
    artist: 'John Doe',
    category: 'Digital Art',
    city: 'New York',
    year: 2024,
    price: 1000,
    image: publicUrl  // Use the public URL here
  })
});
```

---

## 2. Artist Wallet & Contract Deployment

### Step 1: Get Artist Deployment Wallet
```typescript
GET /api/artist/wallet
Authorization: Bearer <jwt_token>

Response:
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f1e5b",
  "createdAt": "2024-06-08T12:00:00Z",
  "message": "Fund this wallet to deploy NFT contracts and mint NFTs"
}
```

**Next Step**: Artist sends ETH to this address on Base network (or Ethereum/Polygon)

### Step 2: Deploy NFT Contract
```typescript
POST /api/artist/deploy-contract
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request:
{
  "contractName": "My Art Collection",
  "contractSymbol": "ART",
  "baseURIForMetadata": "https://example.com/metadata/",
  "chain": "base",
  "privateKey": "0x..." // Artist's private key (MUST BE SECURE!)
}

Response:
{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "deploymentHash": "0xabc123def456...",
  "deploymentChain": "base",
  "gasCost": "0.05",
  "deployer": "0x742d35Cc6634C0532925a3b844Bc9e7595f1e5b",
  "message": "Contract deployed successfully. You are the owner and can mint NFTs."
}
```

### Step 3: Get Artist Contracts
```typescript
GET /api/artist/contracts
Authorization: Bearer <jwt_token>

Response:
{
  "contracts": [
    {
      "contractAddress": "0x1234567890123456789012345678901234567890",
      "contractName": "My Art Collection",
      "contractSymbol": "ART",
      "deploymentChain": "base",
      "deploymentHash": "0xabc123...",
      "deployedAt": "2024-06-08T12:05:00Z",
      "status": "deployed"
    }
  ],
  "count": 1
}
```

---

## 3. NFT Minting

### Mint NFT from Contract
```typescript
POST /api/artist/mint-nft
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request:
{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "recipientAddress": "0x9876543210987654321098765432109876543210", // Who receives the NFT
  "metadataURI": "https://example.com/metadata/1.json",
  "chain": "base",
  "privateKey": "0x..." // Artist's private key
}

Response:
{
  "transactionHash": "0xabc123...",
  "tokenId": "1",
  "mintedTo": "0x9876543210987654321098765432109876543210",
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "message": "NFT minted successfully"
}
```

### Metadata JSON Format
```json
{
  "name": "Artwork Title",
  "description": "Detailed description of the artwork",
  "image": "https://collectibles.supabase.co/storage/v1/object/public/artworks/...",
  "attributes": [
    {
      "trait_type": "Creator",
      "value": "Artist Name"
    },
    {
      "trait_type": "Year",
      "value": "2024"
    },
    {
      "trait_type": "Category",
      "value": "Digital Art"
    }
  ]
}
```

---

## 4. User Wallet & Deposits

### Create Deposit Wallet
```typescript
POST /api/wallet/create-deposit
Authorization: Bearer <jwt_token>

Response:
{
  "address": "0x1111111111111111111111111111111111111111",
  "createdAt": "2024-06-08T12:00:00Z",
  "message": "Deposit wallet created. Send funds to this address to purchase NFTs."
}
```

### Get Deposit Wallet
```typescript
GET /api/wallet/deposit
Authorization: Bearer <jwt_token>

Response:
{
  "address": "0x1111111111111111111111111111111111111111",
  "balance": "5.25", // in ETH or platform token
  "createdAt": "2024-06-08T12:00:00Z",
  "message": "Send funds to this address to purchase NFTs and make offers"
}
```

### Record Deposit
```typescript
POST /api/wallet/deposit
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request:
{
  "amount": "1.5",
  "transactionHash": "0x123abc456def789...",
  "chain": "base"
}

Response:
{
  "balance": "6.75",
  "depositedAmount": "1.5",
  "transactionHash": "0x123abc456def789...",
  "message": "Deposit recorded. Funds available for purchases and offers."
}
```

### Get Wallet Balance
```typescript
GET /api/wallet/balance
Authorization: Bearer <jwt_token>

Response:
{
  "address": "0x1111111111111111111111111111111111111111",
  "balance": "6.75",
  "chain": "base"
}
```

### Withdraw Funds
```typescript
POST /api/wallet/withdraw
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request:
{
  "amount": "2.0",
  "recipientAddress": "0x9999999999999999999999999999999999999999",
  "chain": "base"
}

Response:
{
  "balance": "4.75",
  "withdrawnAmount": "2.0",
  "recipientAddress": "0x9999999999999999999999999999999999999999",
  "message": "Withdrawal initiated. Funds will be sent to recipient address on-chain."
}
```

---

## 5. Complete Artist Flow

### For an Artist to Launch Their Collection:

```
1. Sign up / Login
   → Artist account created with artist_status = "artist"

2. Get deployment wallet
   GET /api/artist/wallet
   → Receive wallet address (0x742d35...)

3. Fund the wallet
   → Send ETH to 0x742d35... on Base network
   → Wait for confirmation

4. Deploy contract
   POST /api/artist/deploy-contract
   {
     "contractName": "My Collection",
     "contractSymbol": "MYC",
     "baseURIForMetadata": "https://example.com/metadata/",
     "chain": "base",
     "privateKey": "0x..." // YOUR PRIVATE KEY (keep secret!)
   }
   → Contract deployed at 0x1234...

5. Upload artwork image
   POST /api/artworks/upload-image/presigned-url
   {
     "fileName": "artwork.jpg",
     "fileType": "image/jpeg"
   }
   → Get publicUrl for artwork

6. Prepare metadata
   {
     "name": "Artwork Name",
     "description": "...",
     "image": "https://collectibles.supabase.co/...",
     "attributes": [...]
   }
   → Upload to IPFS or CDN
   → Get metadataURI

7. Mint NFT
   POST /api/artist/mint-nft
   {
     "contractAddress": "0x1234...",
     "recipientAddress": "0x9999...", // Buyer's address
     "metadataURI": "https://ipfs.io/ipfs/...",
     "chain": "base",
     "privateKey": "0x..."
   }
   → NFT minted and transferred to buyer

8. Buyer deposits funds to buy
   POST /api/wallet/deposit
   {
     "amount": "1.5",
     "transactionHash": "0x...",
     "chain": "base"
   }
   → Buyer can now purchase NFTs
```

---

## 6. Complete Buyer Flow

```
1. Sign up / Login
   → User account created with artist_status = "collector"

2. Create deposit wallet
   POST /api/wallet/create-deposit
   → Receive wallet address (0x1111...)

3. Deposit funds
   → Send ETH to 0x1111... on Base network
   → Record on platform:
     POST /api/wallet/deposit
     {
       "amount": "2.0",
       "transactionHash": "0x...",
       "chain": "base"
     }

4. Browse artworks
   GET /api/artworks
   → See all available NFTs

5. Make offer or buy
   POST /api/offers
   {
     "artId": "...",
     "amount": 1000
   }
   OR
   POST /api/buy
   {
     "artId": "...",
     "amount": 1000,
     "sellerId": "..."
   }

6. NFT transferred
   → Upon purchase, NFT transferred to buyer
   → Seller receives payment to their balance

7. Withdraw funds
   POST /api/wallet/withdraw
   {
     "amount": "1.0",
     "recipientAddress": "0xabcd...",
     "chain": "base"
   }
   → Funds sent to recipient address
```

---

## 7. Database Schema (Required Tables)

```sql
-- Artist deployment wallets
CREATE TABLE artist_wallets (
  id UUID PRIMARY KEY,
  artist_id UUID REFERENCES users(id),
  wallet_address VARCHAR(255) UNIQUE,
  wallet_type VARCHAR(50), -- 'deployment'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User deposit wallets
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  wallet_address VARCHAR(255) UNIQUE,
  wallet_balance NUMERIC(20,8) DEFAULT 0,
  wallet_type VARCHAR(50), -- 'deposit'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployed NFT contracts
CREATE TABLE nft_contracts (
  id UUID PRIMARY KEY,
  artist_id UUID REFERENCES users(id),
  contract_address VARCHAR(255) UNIQUE,
  contract_name VARCHAR(255),
  contract_symbol VARCHAR(10),
  deployment_chain VARCHAR(50), -- 'base', 'ethereum', 'polygon'
  deployment_hash VARCHAR(255),
  deployer_address VARCHAR(255),
  base_uri TEXT,
  gas_cost_eth NUMERIC(10,8),
  status VARCHAR(50), -- 'deployed', 'verified'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT mints
CREATE TABLE nft_mints (
  id UUID PRIMARY KEY,
  contract_address VARCHAR(255),
  token_id VARCHAR(255),
  minted_to VARCHAR(255),
  minted_from VARCHAR(255),
  artist_id UUID REFERENCES users(id),
  transaction_hash VARCHAR(255),
  metadata_uri TEXT,
  chain VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT transfers
CREATE TABLE nft_transfers (
  id UUID PRIMARY KEY,
  contract_address VARCHAR(255),
  token_id VARCHAR(255),
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  transaction_hash VARCHAR(255),
  chain VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(50), -- 'deposit', 'withdrawal', 'purchase'
  amount NUMERIC(20,8),
  recipient_address VARCHAR(255),
  transaction_hash VARCHAR(255),
  chain VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Blockchain RPC
BASE_RPC_URL=https://sepolia.base.org
ETHEREUM_RPC_URL=https://eth.rpc.blxrbdn.com
POLYGON_RPC_URL=https://polygon-rpc.com

# Wallet defaults
DEFAULT_CHAIN=base
GAS_LIMIT=100000
```

---

## 9. Security Notes

⚠️ **IMPORTANT**: Private keys should NEVER be stored in plain text or sent to the server.

**Better Approach**:
1. Sign transactions client-side using ethers.js
2. Send only the signed transaction to the server
3. Or use key management services (AWS KMS, GCP Cloud KMS)
4. Or implement account abstraction (ERC-4337) for gasless transactions

**Current Implementation**: Uses private key for simplicity - upgrade for production!

---

## 10. Example: Complete Transaction Flow

```
User A (Buyer):
1. Deposits 10 ETH to wallet 0x1111...
2. Makes offer on NFT for 2 ETH
3. Offer accepted by User B (Seller)
4. Platform transfers NFT to User A (via artist's contract)
5. User A's balance: 10 - 2 = 8 ETH (minus gas)
6. User B's balance: +1.8 ETH (2 - 0.2 platform fee)

User B (Artist/Seller):
1. Deployed contract via 0x742d35...
2. Minted NFT to User A
3. Received 1.8 ETH payment
4. Can withdraw to external wallet
```

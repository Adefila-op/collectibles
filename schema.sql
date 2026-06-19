-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  avatar VARCHAR(50),
  wallet_balance BIGINT DEFAULT 0,
  wallet_address VARCHAR(255),
  is_admin BOOLEAN DEFAULT false,
  artist_status VARCHAR(50) DEFAULT 'collector',
  artist_type VARCHAR(100),
  artist_bio TEXT,
  portfolio_url VARCHAR(500),
  social_url VARCHAR(500),
  live_location VARCHAR(255),
  call_url VARCHAR(500),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artworks Table
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  city VARCHAR(100),
  year INTEGER,
  price BIGINT,
  image VARCHAR(500),
  description TEXT,
  unique_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital Collectible Collections Table
CREATE TABLE IF NOT EXISTS nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  chain VARCHAR(50) DEFAULT 'ethereum',
  marketplace_id VARCHAR(255),
  mint_address VARCHAR(255),
  supply INTEGER,
  floor_price_sol DECIMAL(12, 4),
  volume_sol DECIMAL(12, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital Collectible Items Table
CREATE TABLE IF NOT EXISTS nft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES nft_collections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  edition INTEGER,
  image VARCHAR(500),
  mint_address VARCHAR(255),
  owner_address VARCHAR(255),
  listing_id VARCHAR(255),
  order_hash VARCHAR(255),
  marketplace_source VARCHAR(50) DEFAULT 'opensea',
  price_native DECIMAL(24, 8),
  currency VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available',
  attributes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holdings Table (user art ownership)
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  art_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'owned',
  listed_price BIGINT,
  receipt_status VARCHAR(50) DEFAULT 'active',
  transfer_status VARCHAR(50) DEFAULT 'settled',
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  listed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, art_id)
);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  art_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  cash BIGINT NOT NULL,
  buyer_initials VARCHAR(10),
  buyer_city VARCHAR(100),
  placed_ago VARCHAR(50),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL,
  art_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  swap_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Escrow Table
CREATE TABLE IF NOT EXISTS escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  art_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'held',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP
);

-- Artist Royalties Table
CREATE TABLE IF NOT EXISTS artist_royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  art_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  rate DECIMAL(5, 2) DEFAULT 10.0,
  amount BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- Admin Events (Audit Log)
CREATE TABLE IF NOT EXISTS admin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_art_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artwork Submissions (artist verification flow)
CREATE TABLE IF NOT EXISTS artwork_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  art_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  proof_image_url VARCHAR(500),
  proof_document_url VARCHAR(500),
  description TEXT,
  submission_status VARCHAR(50) DEFAULT 'submitted',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  nft_transaction_hash VARCHAR(255),
  nft_token_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates Table (for artwork provenance)
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id UUID NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
  art_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  authenticity_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_collections_chain ON nft_collections(chain);
CREATE INDEX IF NOT EXISTS idx_nft_items_collection_id ON nft_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_items_status ON nft_items(status);
CREATE INDEX IF NOT EXISTS idx_holdings_art_id ON holdings(art_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_art_id ON offers(art_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transaction_id ON escrow(transaction_id);
CREATE INDEX IF NOT EXISTS idx_royalties_artist_id ON artist_royalties(artist_id);
CREATE INDEX IF NOT EXISTS idx_admin_events_admin_id ON admin_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_certificates_holding_id ON certificates(holding_id);
CREATE INDEX IF NOT EXISTS idx_certificates_buyer_id ON certificates(buyer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_art_id ON certificates(art_id);

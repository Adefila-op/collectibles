-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar VARCHAR(50),
  wallet_balance BIGINT DEFAULT 0,
  wallet_address VARCHAR(255),
  artist_status VARCHAR(50) DEFAULT 'collector',
  artist_type VARCHAR(100),
  artist_bio TEXT,
  portfolio_url VARCHAR(500),
  social_url VARCHAR(500),
  live_location VARCHAR(255),
  call_url VARCHAR(500),
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

-- Holdings Table (user art ownership)
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  art_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'owned',
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- Indexes for performance
CREATE INDEX idx_holdings_user_id ON holdings(user_id);
CREATE INDEX idx_holdings_art_id ON holdings(art_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_offers_art_id ON offers(art_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_escrow_transaction_id ON escrow(transaction_id);
CREATE INDEX idx_royalties_artist_id ON artist_royalties(artist_id);
CREATE INDEX idx_admin_events_admin_id ON admin_events(admin_id);

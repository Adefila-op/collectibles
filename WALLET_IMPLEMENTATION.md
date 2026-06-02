# 🎯 WALLET & PORTFOLIO IMPLEMENTATION GUIDE

**Last Updated:** June 2, 2026  
**Status:** Phase 1 & 2 Complete ✅ | Phase 3 In Progress

---

## 📈 WHAT'S NOW WORKING

### ✅ Wallet Generation & Storage
- Deterministic wallet from email (SHA256 + ethers.js)
- Wallet address created on every signup
- Address stored in database (`wallet_address` column)
- Address displayed in Profile with copy button
- Wallet addresses persist across sessions

**Example:** 
```
Email: user@example.com
Generated Wallet: 0x38A94242D3Ec8aB07b672FD889F78Ce685d756F7
Status: ✅ Deterministic (same email always = same wallet)
```

### ✅ Real Blockchain Balance Reading
- **Endpoint:** `GET /api/wallet/:address/balance/:chain`
- **Supported Chains:** Base, Ethereum, Polygon
- **Returns:** Wei, formatted ETH/MATIC, token type, chain
- **Status:** ✅ Live and working

**Example Response:**
```json
{
  "address": "0xDb1D2AC1310b6659c4689Cf4dDF636184A26e129",
  "wei": "0",
  "formatted": "0.0",
  "token": "ETH",
  "chain": "base"
}
```

### ✅ Multi-Chain Balance Support
- **Endpoint:** `GET /api/wallet/:address/balance`
- Returns balances from all 3 chains simultaneously
- Useful for cross-chain portfolio tracking

### ✅ Top-Up System (Database Layer)
- **Endpoint:** `POST /api/wallet/topup`
- Creates top-up transaction record
- Tracks payment method (Stripe/Paystack)
- Status tracking (pending/completed)
- **Status:** ✅ Database structure ready, needs payment gateway

### ✅ Gas Fee Estimation
- **Endpoint:** `GET /api/wallet/gas-fee/:chain`
- Returns estimated ETH/MATIC for standard transfer
- Uses real-time RPC data
- **Status:** ✅ Working

### ✅ Wallet Sync Mechanism
- **Endpoint:** `POST /api/wallet/sync/:userId`
- Compares database balance vs blockchain balance
- Detects discrepancies
- **Status:** ✅ Ready for monitoring dashboard

### ✅ Transaction History
- Tracks all top-ups, offers, swaps, purchases
- Persistent in database
- Queryable by user
- **Status:** ✅ Implemented

---

## 🔌 NEW API ENDPOINTS

### Wallet Balance Reading

#### Get Balance for Single Chain
```
GET /api/wallet/{address}/balance/{chain}

Parameters:
  - address: Wallet address (0x...)
  - chain: base | ethereum | polygon

Response:
{
  "address": "0x...",
  "wei": "1000000000000000000",
  "formatted": "1.0",
  "token": "ETH",
  "chain": "base"
}
```

#### Get Balances All Chains
```
GET /api/wallet/{address}/balance

Response:
{
  "address": "0x...",
  "balances": [
    { "wei": "...", "formatted": "...", "token": "ETH", "chain": "base" },
    { "wei": "...", "formatted": "...", "token": "ETH", "chain": "ethereum" },
    { "wei": "...", "formatted": "...", "token": "MATIC", "chain": "polygon" }
  ]
}
```

### Top-Up Management

#### Initiate Top-Up
```
POST /api/wallet/topup

Body:
{
  "userId": "uuid",
  "amount": 100,
  "chain": "base",
  "paymentMethod": "stripe"
}

Response:
{
  "transactionId": "uuid",
  "status": "pending",
  "amount": 100,
  "chain": "base",
  "userWallet": "0x...",
  "message": "Top-up initiated. Please complete payment."
}
```

#### Confirm Top-Up (After Payment)
```
PATCH /api/wallet/topup/{transactionId}/confirm

Response:
{
  "transactionId": "uuid",
  "status": "completed",
  "newBalance": 150,
  "amount": 100,
  "message": "Top-up successful. Funds added to your account."
}
```

#### Get Top-Up History
```
GET /api/wallet/topups/{userId}

Response: [
  {
    "id": "uuid",
    "type": "topup",
    "buyer_id": "uuid",
    "amount": 100,
    "status": "completed",
    "details": { "chain": "base", "paymentMethod": "stripe" },
    "created_at": "2026-06-02T...",
    "completed_at": "2026-06-02T..."
  }
]
```

### Wallet Sync

#### Sync Balance with Blockchain
```
POST /api/wallet/sync/{userId}

Body:
{
  "chain": "base"
}

Response:
{
  "userId": "uuid",
  "walletAddress": "0x...",
  "databaseBalance": 1000,
  "blockchainBalance": {
    "formatted": "1.5",
    "wei": "1500000000000000000",
    "token": "ETH",
    "chain": "base"
  },
  "synced": true
}
```

### Gas Fee Estimation

#### Get Chain Gas Fee
```
GET /api/wallet/gas-fee/{chain}

Response:
{
  "chain": "base",
  "wei": "2100000000000000",
  "formatted": "0.0021",
  "token": "ETH"
}
```

---

## 🔧 FRONTEND INTEGRATION

### AuthContext Additions

**New Functions:**
```typescript
// Sync wallet with blockchain
syncWalletBalance: (chain?: string) => Promise<{ ok: true; data } | { ok: false; error }>

// Create top-up request
createTopup: (amount: number, chain?: string) => Promise<{ ok: true; data } | { ok: false; error }>

// Confirm top-up after payment
confirmTopup: (transactionId: string) => Promise<{ ok: true; data } | { ok: false; error }>
```

### Usage Example
```typescript
import { useAuth } from '@/contexts/AuthContext';

export function DepositComponent() {
  const { user, createTopup, confirmTopup, syncWalletBalance } = useAuth();

  async function handleDeposit(amount: number) {
    // Initiate top-up
    const topup = await createTopup(amount, 'base');
    if (!topup.ok) return console.error(topup.error);
    
    // Process payment (Stripe integration)
    // ...
    
    // Confirm after payment
    const confirmed = await confirmTopup(topup.data.transactionId);
    if (confirmed.ok) {
      console.log('Deposit successful:', confirmed.data.newBalance);
    }
  }

  async function handleSyncBalance() {
    const sync = await syncWalletBalance('base');
    if (sync.ok) {
      console.log('Blockchain balance:', sync.data.blockchainBalance.formatted);
      console.log('Database balance:', sync.data.databaseBalance);
    }
  }

  return (
    <div>
      <button onClick={() => handleDeposit(100)}>Deposit 100 USDC</button>
      <button onClick={handleSyncBalance}>Sync Balance</button>
    </div>
  );
}
```

---

## 📊 PORTFOLIO BALANCE CALCULATION

### How It Works Now
```typescript
// Database balance (from top-ups/transactions)
const balance = user?.walletBalance ?? 0;

// Artwork values (from database prices)
const portfolioBalance = userHoldings
  .filter((h) => h.status === "owned")
  .reduce((total, holding) => {
    const art = allArtworks.find((a) => a.id === holding.artId);
    return total + (art?.price ?? 0);
  }, 0);

// Total = Spending Balance + Art Holdings Value
const totalPortfolioBalance = balance + portfolioBalance;
```

### Display in Profile
- **Spending Balance:** `user.wallet_balance` (database)
- **Portfolio Value:** Sum of owned art prices
- **Total Portfolio:** Spending + Holdings
- **On-Chain Wallet:** `user.wallet_address` with copy button

---

## 🔄 BUY → OFFER → SWAP FLOW

### Buy Art Flow (Updated)
```
1. User clicks "Buy" on artwork
2. Modal shows artwork + price
3. System checks: user.wallet_balance >= price
4. If OK:
   - Deduct from wallet_balance via updateWalletBalance()
   - Create holding with status "owned"
   - Log transaction
5. If insufficient:
   - Show "Deposit more funds" message
   - Link to deposit modal
```

**Issue:** No escrow holding yet (see Phase 3)

### Offer Flow (Updated)
```
1. User enters offer amount
2. System checks: user.wallet_balance >= amount
3. If OK:
   - Deduct from balance (createOffer)
   - Create offer record
   - Funds held in: user.wallet_balance
4. If offer accepted:
   - Lock funds (should use escrow)
   - Log transaction
5. If offer rejected:
   - Return funds to user
```

**Issue:** Funds in account balance, not locked escrow

### Swap Flow
```
1. User selects own art + target art
2. Creates swap proposal
3. Both users' funds held in: account balance
4. When swap accepted:
   - Holdings updated
   - Funds should be exchanged via escrow
   - Transaction logged
```

**Issue:** No escrow implementation yet

---

## 🚀 NEXT PHASES

### Phase 3: Escrow Implementation (NEXT)
- [ ] Implement escrow holding on offer creation
- [ ] Lock buyer funds when offer placed
- [ ] Auto-release if offer expires
- [ ] Release to seller on acceptance
- [ ] Implement for swaps (both parties)

**Files to Update:**
- `api/server.ts` - Add escrow creation on offer
- `src/routes/Offer.tsx` - Call escrow API
- `src/routes/Swap.tsx` - Call escrow API

### Phase 4: Payment Gateway Integration
- [ ] Stripe integration for deposits
- [ ] Paystack integration for deposits
- [ ] Withdrawal request system
- [ ] Withdrawal approval workflow
- [ ] Real fund transfer to user wallet

**Integration Points:**
- Deposit button → Stripe checkout
- Withdrawal → Bank transfer request
- Confirmation webhook → Update balance

### Phase 5: Smart Contract Escrow
- [ ] Deploy escrow contract
- [ ] Implement contract-based fund holding
- [ ] Transaction signing
- [ ] Atomic swaps on-chain

**Technology:** Solidity + ethers.js

### Phase 6: Monitoring & Analytics
- [ ] Balance reconciliation job
- [ ] Alerts for discrepancies
- [ ] Transaction status tracking
- [ ] Admin dashboard for payments

---

## 🧪 TESTING THE NEW FEATURES

### Test Wallet Balance Reading
```bash
# Get balance on Base
curl "http://localhost:3000/api/wallet/0xDb1D2AC1310b6659c4689Cf4dDF636184A26e129/balance/base"

# Get balances on all chains
curl "http://localhost:3000/api/wallet/0xDb1D2AC1310b6659c4689Cf4dDF636184A26e129/balance"

# Get gas fee estimate
curl "http://localhost:3000/api/wallet/gas-fee/base"
```

### Test Top-Up System
```bash
# Create top-up (needs valid userId)
curl -X POST "http://localhost:3000/api/wallet/topup" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here", "amount": 100, "chain": "base"}'

# Confirm top-up (needs transactionId from above)
curl -X PATCH "http://localhost:3000/api/wallet/topup/{transactionId}/confirm"

# Get top-up history
curl "http://localhost:3000/api/wallet/topups/{userId}"
```

### Test Wallet Sync
```bash
curl -X POST "http://localhost:3000/api/wallet/sync/{userId}" \
  -H "Content-Type: application/json" \
  -d '{"chain": "base"}'
```

---

## 🎯 CURRENT ARCHITECTURE

```
User Signup
    ↓
generateDeterministicWallet(email)
    ↓
wallet_address saved to DB + returned to frontend
    ↓
User Profile shows:
  ├─ wallet_address with copy button
  ├─ wallet_balance (spending)
  ├─ portfolio_value (owned art)
  └─ total_portfolio (balance + art)

When User Deposits:
  1. Click "Deposit"
  2. Show amount input
  3. Create top-up transaction
  4. Redirect to Stripe/Paystack
  5. Confirm payment
  6. Add to wallet_balance

When User Makes Offer:
  1. Enter offer amount
  2. Check: wallet_balance >= amount
  3. Deduct from balance
  4. Create offer record
  5. Funds held in account

When Offer Accepted:
  1. Log transaction
  2. Transfer to seller
  3. Update holdings
```

---

## 📋 FILES MODIFIED

| File | Changes | Status |
|------|---------|--------|
| `api/wallet.ts` | Added balance reading functions | ✅ Complete |
| `api/server.ts` | Added 6 new wallet endpoints | ✅ Complete |
| `src/lib/api.ts` | Added walletAPI client | ✅ Complete |
| `src/contexts/AuthContext.tsx` | Added sync/topup functions | ✅ Complete |
| `schema.sql` | wallet_address column | ✅ Complete |
| `src/routes/Profile.tsx` | Display wallet address | ✅ Complete |

---

## ⚠️ REMAINING CRITICAL GAPS

### Gap 1: No Real Payment Gateway
- Top-up creates record but doesn't charge
- Need Stripe/Paystack integration
- No fund transfer to wallet

**Impact:** Users can't actually deposit

### Gap 2: No Escrow Implementation
- Offer amounts deducted but not locked
- Swap funds not secured
- Seller at risk

**Impact:** High fraud potential

### Gap 3: No Withdrawal System
- Users can't withdraw funds
- No bank transfer integration
- No withdrawal approval

**Impact:** Trapped funds

### Gap 4: No Contract-Based Transactions
- All transfers database-only
- No on-chain verification
- No true smart contract escrow

**Impact:** No blockchain settlement

---

## 📝 SUMMARY TABLE

| Feature | Status | Implementation |
|---------|--------|-----------------|
| Wallet Generation | ✅ Done | Deterministic, reproducible |
| Wallet Address Storage | ✅ Done | In database + displayed |
| Blockchain Balance Reading | ✅ Done | Real-time from RPC |
| Multi-Chain Support | ✅ Done | Base, Ethereum, Polygon |
| Portfolio Calculation | ✅ Done | Balance + Art values |
| Top-Up Records | ✅ Done | Tracked in transactions table |
| Deposit UI | ✅ Done | Input form in Profile |
| Gas Fee Estimation | ✅ Done | Real-time calculation |
| Wallet Sync | ✅ Done | Compare DB vs blockchain |
| Escrow System | ⏳ Phase 3 | Database ready, logic needed |
| Payment Gateway | ⏳ Phase 4 | API ready, needs Stripe/Paystack |
| Smart Contracts | ⏳ Phase 5 | Design phase |
| Withdrawal System | ⏳ Phase 4 | API ready, needs implementation |

---

## 🎓 DEVELOPER NOTES

### Environment Variables (Already Set)
```
API_PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collectibles_db
DB_USER=postgres
DB_PASSWORD=Adefila111
```

### Key Dependencies
- **ethers.js** v6 - Blockchain interaction
- **pg** - Database
- **express** - API
- **tsx** - TypeScript execution

### RPC Endpoints Used
```
Base:      https://mainnet.base.org
Ethereum:  https://eth.rpc.blxrbdn.com
Polygon:   https://polygon-rpc.com
```

### Build Commands
```bash
npm run build   # Production build
npm run dev     # Dev server (Vite)
npm run api     # Start API server
```

---

## 🚢 READY FOR PRODUCTION?

**Status:** ⚠️ **NOT YET** - Phase 1 & 2 complete but missing critical features

**Before Production Need:**
1. ✅ Wallet generation & storage
2. ✅ Blockchain balance reading
3. ⏳ Payment gateway (Stripe/Paystack)
4. ⏳ Escrow for transactions
5. ⏳ Withdrawal system
6. ⏳ Smart contract deployment

**Estimated Timeline:**
- Phase 3 (Escrow): 2-3 days
- Phase 4 (Payments): 3-4 days
- Phase 5 (Smart Contracts): 5-7 days
- **Total: ~2 weeks to production-ready**

---

## 🔗 RELATED DOCUMENTATION

- [WALLET_AUDIT.md](./WALLET_AUDIT.md) - Detailed audit findings
- [schema.sql](./schema.sql) - Database schema
- [api/wallet.ts](./api/wallet.ts) - Wallet utilities
- [api/server.ts](./api/server.ts) - API implementation
- [src/lib/api.ts](./src/lib/api.ts) - Frontend API client

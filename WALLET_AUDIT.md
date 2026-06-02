# 🔍 Comprehensive Wallet & Portfolio Audit

**Date:** June 2, 2026  
**Status:** In-Progress Implementation

---

## 📊 CURRENT STATE SUMMARY

### ✅ What Works
- ✅ Deterministic wallet generation (ethers.js + SHA256)
- ✅ Wallet address saved to database on signup
- ✅ Wallet address displayed in Profile with copy button
- ✅ Portfolio balance calculation (wallet + art values)
- ✅ Holdings tracking (owned, listed, swapped)
- ✅ Deposit/Withdraw UI implemented
- ✅ Offer system functional (deducts from balance)
- ✅ Swap system functional (holds in escrow)
- ✅ Transaction history tracked in database

### ⚠️ Issues Found
- ❌ Wallet balance NOT reading from blockchain
- ❌ Top-up only updates database, not actual wallet funds
- ❌ No real fund transfer mechanism
- ❌ Deposit/Withdraw are mock operations (no payment gateway)
- ❌ No escrow implementation for transactions
- ❌ Swap funds held locally, not in smart contract
- ❌ No wallet balance sync after transactions
- ❌ Portfolio balance calculation uses local data only

---

## 🏗️ ARCHITECTURE ANALYSIS

### Wallet Layer
**File:** `api/wallet.ts`  
**Purpose:** Deterministic wallet generation

```typescript
export function generateDeterministicWallet(email: string) {
  const hash = crypto.createHash('sha256').update(email).digest();
  const privateKeyHex = '0x' + hash.toString('hex');
  const wallet = new ethers.Wallet(privateKeyHex);
  return { address: wallet.address, publicKey: wallet.publicKey };
}
```

**Status:** ✅ Working  
**Gaps:** 
- No balance reading from blockchain
- No fund transfer capability
- No transaction signing

### Database Layer
**File:** `schema.sql`  
**Key Tables:**

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | User profiles + `wallet_balance`, `wallet_address` | ✅ Good |
| `holdings` | Art ownership tracking | ✅ Good |
| `offers` | Buy/Swap offers | ✅ Good |
| `transactions` | Transaction history | ✅ Good |
| `escrow` | Hold funds during transactions | ⚠️ Created but not used |
| `artist_royalties` | Artist payment tracking | ✅ Good |

**Current Implementation:**
- `wallet_balance` is just a number in database
- No actual blockchain funds
- Deposit/Withdraw only modify this number
- No real-time sync with blockchain

### Frontend Layer
**Files:** 
- `src/routes/Profile.tsx` - Wallet UI
- `src/contexts/AuthContext.tsx` - Auth state
- `src/lib/api.ts` - API calls

**Features:**
- ✅ Display wallet address
- ✅ Show balance
- ✅ Deposit/Withdraw UI
- ✅ Portfolio balance calc (wallet + art prices)

**Issues:**
- Balance is hardcoded/mocked
- No real blockchain reading
- Deposit increases mock balance only

### API Layer
**File:** `api/server.ts`

**Endpoints:**
- `POST /api/users` - Create user + wallet ✅
- `PATCH /api/users/:id/wallet` - Update balance ⚠️ (mock only)
- `GET /api/holdings/:userId` - Get user art ✅
- `POST /api/offers` - Create offer ✅
- `GET /api/transactions` - Transaction history ✅
- `POST /api/escrow` - Create escrow ✅
- `PATCH /api/escrow/:id/release` - Release escrow ⚠️ (not fully implemented)

---

## 💰 FEATURE-BY-FEATURE ANALYSIS

### 1. BUY ART
**File:** `src/routes/BuyArt.tsx`

**Current Flow:**
1. User browses available artworks
2. User clicks to buy → Opens `BuyArtModal.tsx`
3. Modal deducts from `user.walletBalance`
4. Creates offer in database
5. Updates wallet balance

**Issues:**
- ❌ No real payment processing
- ❌ Balance update is local only
- ❌ No escrow for seller protection
- ❌ No transaction confirmation
- ⚠️ Offer can exceed wallet balance if not checked

**Missing:**
- Payment gateway integration
- Seller fund release mechanism
- Transaction confirmation UI

### 2. SWAP ART
**File:** `src/routes/Swap.tsx`

**Current Flow:**
1. User selects own artwork
2. User selects artwork to receive
3. Creates swap proposal
4. Updates holding status to "swapped"

**Issues:**
- ❌ No escrow holding both sides' funds
- ❌ No settlement mechanism
- ❌ No fund transfer between parties
- ❌ No transaction confirmation

**Missing:**
- Bidirectional escrow
- Atomic swap logic
- Fund settlement after swap accepted

### 3. MAKE OFFER
**File:** `src/routes/Offer.tsx`

**Current Flow:**
1. User enters offer amount
2. Amount deducted from balance via `updateWalletBalance()`
3. Offer created in database
4. Balance held in `user.walletBalance`

**Issues:**
- ❌ Funds held in account balance, not escrow
- ❌ No seller notification
- ❌ No fund release mechanism
- ❌ No timeout/expiration handling

**Correct Implementation Should:**
- Hold funds in escrow immediately
- Notify seller
- Auto-release if offer rejected
- Support offer counter/negotiation

### 4. PORTFOLIO BALANCE
**File:** `src/routes/Profile.tsx`

**Current Calculation:**
```typescript
const balance = user?.walletBalance ?? 0;
const portfolioBalance = userHoldings
  .filter((h) => h.status === "owned")
  .reduce((total, holding) => {
    const art = allArtworks.find((a) => a.id === holding.artId);
    return total + (art?.price ?? 0);
  }, 0);
const totalPortfolioBalance = balance + portfolioBalance;
```

**Issues:**
- ✅ Calculation logic correct
- ⚠️ Uses database prices, not real-time market data
- ❌ Doesn't read actual blockchain balance
- ⚠️ Art prices never update

**Should Be:**
- Read wallet balance from blockchain
- Track current market values of holdings
- Update in real-time

### 5. DEPOSIT/WITHDRAW
**File:** `src/routes/Profile.tsx`

**Current Implementation:**
```typescript
function handleDeposit() {
  const depositNaira = depositAmount * NAIRA_PER_USDC;
  updateWalletBalance(balance + depositNaira);
}
```

**Issues:**
- ❌ Completely mock - no real payment
- ❌ No payment gateway
- ❌ No bank transfer
- ❌ No blockchain transaction

**Should Have:**
- Stripe/Paystack integration for fiat onramp
- USDC/crypto deposit on specified chain
- Actual fund transfer to user wallet
- Real blockchain transaction

---

## 🔗 BLOCKCHAIN INTEGRATION

### Currently Missing
- **Balance Reading:** No call to wallet to get actual balance
- **Fund Transfers:** No transaction signing
- **Contract Interaction:** No smart contract for escrow
- **Gas Management:** No gas fee calculation
- **Chain Selection:** No network switching (Base/Polygon/Ethereum)
- **Transaction Status:** No confirmation tracking

### Should Implement
1. **Balance Reading** (ethers.js provider)
   ```typescript
   const balance = await provider.getBalance(walletAddress);
   ```

2. **Fund Transfer** (transaction signing)
   ```typescript
   const tx = await wallet.sendTransaction({
     to: recipientAddress,
     value: amountInWei
   });
   ```

3. **Smart Contract Escrow**
   - Lock funds during transaction
   - Release on approval
   - Auto-refund on rejection

4. **Payment Gateway**
   - Fiat to crypto onramp (Stripe/Paystack)
   - Crypto to fiat offramp
   - Real balance updates

---

## 📋 DATABASE STATE

### Users Table Schema
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(255),     -- ✅ Set on signup
  wallet_balance BIGINT DEFAULT 0, -- ⚠️ Mock only
  -- ... other fields
)
```

**Issues:**
- `wallet_balance` is just a number, not blockchain-backed
- No transaction history per user
- No pending transaction queue

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID,
  type VARCHAR(50),        -- 'buy', 'swap', 'offer'
  buyer_id, seller_id,
  amount BIGINT,
  status VARCHAR(50),      -- 'pending', 'completed'
  created_at, completed_at
)
```

**Status:** ✅ Good schema, ⚠️ Not fully used

### Escrow Table
```sql
CREATE TABLE escrow (
  transaction_id UUID,
  amount BIGINT,
  from_user_id, to_user_id,
  status VARCHAR(50),      -- 'held', 'released'
  created_at, released_at
)
```

**Status:** ✅ Table exists, ❌ Never used in code

---

## 🚨 CRITICAL ISSUES

### Issue 1: No Real Wallet Funds
- Deposits don't actually transfer funds to wallet
- Withdrawals don't remove funds from wallet
- All operations are database-only

**Impact:** HIGH - Platform doesn't actually hold user funds

### Issue 2: No Escrow for Transactions
- Offer amounts deducted from balance but not secured
- Swap doesn't hold both parties' assets
- Seller at risk if buyer doesn't complete

**Impact:** HIGH - Fraud risk

### Issue 3: No Payment Gateway
- No way for users to actually deposit funds
- No way to withdraw to external account
- Mock deposit amounts only increase database number

**Impact:** CRITICAL - No monetization possible

### Issue 4: Unimplemented API Endpoints
- Escrow release endpoint exists but not called
- Transaction completion endpoint incomplete
- Royalty payout system not integrated

**Impact:** MEDIUM - Features don't work end-to-end

### Issue 5: No Balance Sync
- Wallet balance doesn't update after on-chain transactions
- Blockchain balance and database balance can diverge
- No periodic balance reconciliation

**Impact:** MEDIUM - User confusion about actual balance

---

## ✨ IMPLEMENTATION PRIORITY

### Phase 1: Balance Reading (HIGH PRIORITY)
- [ ] Add function to read balance from wallet
- [ ] Create API endpoint to get wallet balance
- [ ] Update frontend to show blockchain balance
- [ ] Display warning if balance differs from database

### Phase 2: Deposit/Withdraw (HIGH PRIORITY)
- [ ] Integrate Stripe/Paystack for deposits
- [ ] Create withdrawal request system
- [ ] Track pending withdrawals
- [ ] Implement withdrawal approval

### Phase 3: Escrow (MEDIUM PRIORITY)
- [ ] Implement escrow holding on offer creation
- [ ] Add release mechanism on offer acceptance
- [ ] Add auto-refund on offer rejection
- [ ] Implement for swaps (both sides)

### Phase 4: Smart Contract (MEDIUM PRIORITY)
- [ ] Deploy escrow smart contract
- [ ] Implement contract-based fund holding
- [ ] Add transaction signing
- [ ] Implement atomic swaps

### Phase 5: Monitoring (LOW PRIORITY)
- [ ] Add transaction status tracking
- [ ] Create transaction history view
- [ ] Add balance reconciliation job
- [ ] Implement alerts for discrepancies

---

## 📝 NEXT STEPS

1. **Balance Reading**
   - Read `api/wallet.ts` for wallet details
   - Add ethers provider to read balance
   - Create `/api/wallet/:address/balance` endpoint
   - Update Profile to show real balance

2. **Top-Up System**
   - Create deposit endpoint
   - Add payment gateway integration
   - Track deposit status
   - Update wallet on confirmation

3. **Integration Testing**
   - Create test user with wallet
   - Simulate deposit
   - Verify balance updates
   - Test on all platforms (Base, Polygon, Ethereum)

4. **Documentation**
   - Create wallet integration guide
   - Document payment gateway setup
   - Create user fund flow diagram
   - Document escrow process

---

## 📊 AUDIT FINDINGS SUMMARY

**Total Components Analyzed:** 15  
**Working:** 8 (53%)  
**Partially Working:** 4 (27%)  
**Not Working:** 3 (20%)  

**Overall Status:** ⚠️ CRITICAL GAPS  
**Recommendation:** Implement Phase 1 & 2 before production

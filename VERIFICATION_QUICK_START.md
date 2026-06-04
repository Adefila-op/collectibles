# Quick Start: Test the Verification Workflow

## Prerequisites

1. ✅ Supabase PostgreSQL connected (DATABASE_URL set in .env.local)
2. ✅ API running: `npm run api`
3. ✅ Frontend running: `npm run dev`
4. Optional: Base testnet RPC URL set (BASE_RPC_URL in .env.local)

## 5-Minute Test Flow

### Step 1: Create Two Test Accounts (30s)

**Account 1 - Artist:**
- Sign up with email: `artist@test.com` / password: `test123`
- Will use for creating and submitting artworks

**Account 2 - Admin:**
- Sign up with email: `admin@test.com` / password: `admin123`
- Will use for reviewing submissions

### Step 2: Apply as Artist (1m)

**In artist account:**
1. Go to Profile
2. Scroll to "Apply as artist"
3. Fill form:
   - Type: "Painter"
   - Bio: "Testing verification workflow"
   - Portfolio: "https://example.com/portfolio"
   - Location: "Lagos, Nigeria"
4. Click "Submit for approval"

### Step 3: Admin Approves Artist (1m)

**In admin account:**
1. Go to Admin (bottom nav → Admin)
2. Enter code: `COLLECTIBLE-ADMIN`
3. Click "Unlock admin"
4. Should see artist application in "Artists" tab
5. Click "Approve" button
6. Refresh or go back to Explore

### Step 4: Create Artwork (1m)

**Back in artist account:**
1. Go to Explore → "Create new"
2. OR go to Profile → "List new artwork"
3. Upload artwork image:
   - Take/paste any image
   - Or use test image: 
     ```
     data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
     ```
4. Fill details:
   - Title: "Test Artwork"
   - Category: "Painting"
   - Year: 2024
   - Price: 100000
5. Complete listing process

### Step 5: Submit Artwork for Verification (1m30s)

**In artist account:**
1. Go to Profile
2. Under "My collection", find newly created artwork
3. Click blue "Submit" button
4. Fill submission form:
   - Description: "This is an original artwork I created"
   - Proof Image: Can leave empty or use IPFS URL
   - Document: Can leave empty
5. Review submission
6. Click "Submit for Verification"
7. Should see success message

### Step 6: Admin Verifies and Mints Certificate (1m30s)

**In admin account:**
1. Go to Admin → Unlock with code
2. Click "Artworks" tab
3. Should see the submitted artwork in "Artwork verification submissions"
4. Click to expand and view:
   - Artwork image
   - Artist name
   - Submission description
5. Click "Verify & Mint NFT" button
6. Should see success message: "Artwork approved! Certificate NFT minted on Base testnet."

## Verify Results

### In Database
```bash
# Check submission
SELECT * FROM artwork_submissions 
WHERE submission_status = 'approved' 
ORDER BY reviewed_at DESC LIMIT 1;

# Check certificate
SELECT * FROM certificates 
WHERE authenticity_verified = true 
ORDER BY issued_at DESC LIMIT 1;
```

### In Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Your project
3. SQL Editor → Run query above
4. Should see:
   - artwork_submissions row with status='approved'
   - certificates row with authenticity_verified=true
   - nft_transaction_hash populated

### On Base Block Explorer (After Contract Deployment)
1. Deploy CertificateNFT.sol (see BASE_DEPLOYMENT.md)
2. Add CERTIFICATE_CONTRACT_ADDRESS to .env.local
3. Repeat submission flow
4. Check https://sepolia.basescan.org
5. Search for contract address
6. Should see minted certificate NFT

## Testing Offer/Sale Flow

### Setup: Two Accounts with Art

**Account 1 (Seller):**
1. Create and submit artwork as above
2. Admin approves (certificate minted)
3. Note the artwork

**Account 2 (Buyer):**
1. Go to Explore
2. Find seller's artwork
3. Click to view details
4. Click "Make offer"
5. Enter amount: 50000
6. Click "Offer"

### Execute Sale

**Back to Account 1 (Seller):**
1. Go to Explore → Offers
2. Should see offer from buyer
3. Click "Accept offer"
4. Escrow funds held, artwork transferred
5. Certificate NFT also transferred (if contract deployed)

**Verify Buyer Ownership:**

**Account 2 (Buyer):**
1. Go to Profile
2. Under "My collection", artwork should now appear
3. Go to Admin → Artworks → Find the artwork
4. Should show in "Artwork verification submissions" with status
5. Can now submit additional verification if re-selling

## Common Issues & Fixes

### "No pending applications" in Admin Artists Tab
- Ensure artist account created first
- Artist must apply from Profile
- Refresh browser or wait 5s for DB sync

### "No pending submissions" in Admin Artworks Tab
- Ensure artist account is approved first
- Artist must submit from Profile (blue "Submit" button)
- Artwork must be in "owned" status
- Check database: `SELECT * FROM artwork_submissions;`

### "Error submitting artwork"
- Check API is running: `curl http://localhost:3000/api/health`
- Verify DATABASE_URL is set and Supabase is accessible
- Check browser console for error details

### Database errors
- Run schema init: `npm run db:init`
- Check artwork_submissions table exists
- Verify columns: id, artist_id, art_id, proof_image_url, proof_document_url, description, submission_status

### NFT minting shows simulated
- Contract not deployed to Base testnet yet
- Follow BASE_DEPLOYMENT.md for deployment
- Add CERTIFICATE_CONTRACT_ADDRESS to .env.local
- Restart API
- Try again

## What Should Happen

✅ **Workflow Succeeds If:**
1. Artist creates account and art
2. Artist applies and gets approved by admin
3. Artist submits artwork with description
4. Submission appears in admin dashboard
5. Admin can approve with one click
6. Database shows certificate created
7. (Optional) NFT appears on Base Sepolia

## Data Verification

### Query Checklist

```sql
-- User accounts created
SELECT email, artist_status FROM users WHERE email LIKE '%test%';

-- Artwork created
SELECT name, artist FROM artworks WHERE artist LIKE '%Test%' LIMIT 1;

-- Submission recorded
SELECT submission_status, admin_notes FROM artwork_submissions 
ORDER BY created_at DESC LIMIT 1;

-- Certificate issued
SELECT certificate_number, authenticity_verified 
FROM certificates 
WHERE authenticity_verified = true 
ORDER BY issued_at DESC LIMIT 1;

-- All data persisted (not ephemeral)
SELECT COUNT(*) FROM artwork_submissions;
SELECT COUNT(*) FROM certificates;
```

## Next: Production Deployment

Once verification works locally:

1. **Deploy Contract to Base Mainnet** (not testnet)
2. **Update .env for Production Supabase**
3. **Update BASE_RPC_URL to mainnet**
4. **Deploy API to Vercel or similar**
5. **Test full workflow on production**

## Support

If verification flow doesn't work:
1. Check IMPLEMENTATION_GUIDE.md for detailed architecture
2. Verify Supabase connection: `npm run db:init`
3. Check API logs: `npm run api` (verbose output)
4. Run diagnostic query: `curl http://localhost:3000/api/health`
5. Check browser console for frontend errors

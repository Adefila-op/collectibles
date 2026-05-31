# 🚀 ArtChain Deployment Guide

## Step 1: Setup Git Authentication

### Option A: Use GitHub Personal Access Token (Recommended)

1. **Generate a GitHub Personal Access Token**:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name: "ArtChain Deployment"
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - Copy the token (you won't see it again!)

2. **Configure Git to use the token**:
   ```powershell
   # Run this in PowerShell
   git config --global credential.helper manager-core
   
   # Then when git prompts for password, use the token instead
   # Username: Adefila-op
   # Password: (paste your token)
   ```

3. **Try pushing again**:
   ```powershell
   cd "c:\Users\HomePC\Downloads\artchain-vite\artchain-vite"
   git push -u origin main
   ```

### Option B: Use SSH (If you have SSH keys set up)

```powershell
# Check if you have SSH keys
ls ~/.ssh/id_rsa

# If not, generate one:
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Add SSH key to GitHub: https://github.com/settings/keys
# Then change remote:
git remote set-url origin git@github.com:Adefila-op/collectibles.git
git push -u origin main
```

---

## Step 2: Connect to Vercel for Deployment

### Automatic Deployment (Recommended):

1. **Go to Vercel Dashboard**:
   - Navigate to https://vercel.com/dashboard
   - Click "New Project"

2. **Import Your GitHub Repository**:
   - Click "Import Git Repository"
   - Select "Adefila-op/collectibles"
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Leave other settings as default

4. **Click "Deploy"**
   - Vercel will:
     - ✅ Clone your repository
     - ✅ Install dependencies
     - ✅ Build the frontend
     - ✅ Deploy serverless functions
     - ✅ Give you a live URL

5. **First Deployment** will take 2-3 minutes

### After Deployment:

Your app will be live at: `https://your-project.vercel.app`

**Automatic Updates**: Every time you push to GitHub, Vercel automatically rebuilds and redeploys!

---

## Step 3: What We've Changed

### New Files Created:

#### `api/db.ts` - Vercel Serverless API
- Replaces localStorage with a backend API
- Provides CRUD operations for all data tables
- Stores data in JSON format on Vercel

#### `src/lib/api-client.ts` - API Client Wrapper
- Frontend interface for the backend API
- Handles all fetch requests
- Ready to use in components

#### `vercel.json` - Vercel Configuration
- Tells Vercel how to build and deploy
- Configures serverless functions
- Sets environment variables

#### `README.md` - Updated Documentation
- Deployment instructions
- Architecture overview
- API documentation

---

## Step 4: Update Environment Variables (If Needed)

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add if needed:
   ```
   VITE_API_URL=/api
   ```

---

## Step 5: Test Deployment

After Vercel deploys:

1. **Visit your live URL**
2. **Try these features**:
   - ✅ Sign up / Log in
   - ✅ Browse artworks
   - ✅ View portfolio
   - ✅ List an artwork
   - ✅ Make an offer

All data will be stored in the backend!

---

## Troubleshooting

### Build fails with "Cannot find module"
- Solution: Run `npm install` locally and commit package-lock.json

### API returns 404
- Check that `api/db.ts` exists
- Verify `vercel.json` configuration
- Check Vercel logs: Project → Deployments → View Logs

### Data disappears after refresh
- Normal - Vercel `/tmp` is ephemeral (temporary)
- For persistent storage, upgrade to:
  - Supabase (recommended)
  - MongoDB Atlas
  - Separate backend

### Authentication fails on push
- Use GitHub Personal Access Token (Option A above)
- Or set up SSH keys (Option B above)

---

## Current Architecture

```
┌─────────────────────────────────────────┐
│          Vercel Deployment              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Frontend (React + Vite)       │   │
│  │   - Served globally via CDN     │   │
│  └─────────────────────────────────┘   │
│                   ↓                     │
│  ┌─────────────────────────────────┐   │
│  │  Serverless Functions (/api)    │   │
│  │  - api/db.ts                    │   │
│  │  - Handles CRUD operations      │   │
│  └─────────────────────────────────┘   │
│                   ↓                     │
│  ┌─────────────────────────────────┐   │
│  │   JSON Storage (/tmp)           │   │
│  │   - Temporary (ephemeral)       │   │
│  │   - Good for testing            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Next Steps (Optional Improvements)

### 1. Add Persistent Database
```javascript
// Currently: Vercel /tmp (ephemeral)
// Upgrade to: Supabase, MongoDB, or PostgreSQL
```

### 2. Enable Payments
```javascript
// Add Stripe integration:
// npm install @stripe/stripe-js
```

### 3. Add Blockchain
```javascript
// Add Web3 libraries:
// npm install ethers wagmi @wagmi/core
```

### 4. Setup CI/CD
```yaml
# GitHub Actions for automated testing
name: Tests
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - npm install
      - npm run build
```

---

## Quick Reference Commands

```powershell
# Make changes locally
git add .
git commit -m "Your message"

# Push to GitHub (triggers Vercel deployment)
git push origin main

# Check deployment status
# Go to: https://vercel.com/dashboard/[project-name]

# View live site
# https://your-project.vercel.app
```

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev

---

**Status**: Ready for deployment ✅

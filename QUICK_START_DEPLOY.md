# 🚀 QUICK START: Deploy in 15 Minutes

## ⚡ Three Simple Steps

---

## STEP 1: Connect to GitHub (5 min)

### Option A: Personal Access Token (RECOMMENDED)

```powershell
# 1. Create Token
Open: https://github.com/settings/tokens
Click: "Generate new token (classic)"
Name: "ArtChain Deployment"
Scopes: Select "repo"
Copy the token (don't close the page!)

# 2. Configure Git
git config --global credential.helper manager-core

# 3. Push Code
cd "c:\Users\HomePC\Downloads\artchain-vite\artchain-vite"
git push -u origin main

# When prompted:
# Username: Adefila-op
# Password: [paste your token from step 1]
```

### Option B: SSH (If you prefer)

```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Add key to GitHub
Open: https://github.com/settings/keys
Click "New SSH key"
Paste contents of ~/.ssh/id_rsa.pub

# Update remote
git remote set-url origin git@github.com:Adefila-op/collectibles.git
git push -u origin main
```

✅ **Result**: Code appears on https://github.com/Adefila-op/collectibles

---

## STEP 2: Deploy to Vercel (2 min)

```
1. Go to: https://vercel.com/dashboard
2. Click: "New Project" button
3. Click: "Import Git Repository"
4. Select: "Adefila-op/collectibles"
5. Framework: Keep default (Vite should auto-detect)
6. Click: "Deploy" button
7. Wait: 2-3 minutes for build

✅ Result: Your app is LIVE at: https://[project-name].vercel.app
```

---

## STEP 3: Verify It Works (5 min)

```
1. Visit your Vercel URL
2. Test these features:
   - Sign up / Log in
   - Browse artworks
   - View your portfolio
   - List a new artwork
   - Data persists after refresh ✅

✅ Result: Everything working on the cloud!
```

---

## 📊 What We've Prepared

| Component | Status | Location |
|-----------|--------|----------|
| Frontend Code | ✅ Ready | `src/` |
| Backend API | ✅ Ready | `api/db.ts` |
| Git Setup | ✅ Ready | `.git/` |
| Config Files | ✅ Ready | `vercel.json` |
| Documentation | ✅ Ready | `DEPLOYMENT_GUIDE.md` |

---

## 🔑 Key URLs

| Task | URL |
|------|-----|
| Create GitHub Token | https://github.com/settings/tokens |
| Add SSH Keys | https://github.com/settings/keys |
| Deploy to Vercel | https://vercel.com/dashboard |
| Your GitHub Repo | https://github.com/Adefila-op/collectibles |

---

## ✨ After Deployment

### Auto-Deployments
- Every time you push to GitHub → Vercel automatically deploys
- Your team can work directly with the live site

### Make Changes & Push
```powershell
# 1. Make code changes
# 2. Commit & push
git add .
git commit -m "Your message"
git push origin main

# 3. Watch Vercel auto-deploy
# Go to: https://vercel.com/dashboard/[project]
# See the deployment status in real-time
```

---

## ⚠️ Important Notes

### Data Storage
- Currently uses Vercel `/tmp` (temporary)
- Data refreshes with each deployment
- Good for testing/demo

### For Production Persistence
- Add Supabase (PostgreSQL) - recommended
- Or MongoDB Atlas
- Or deploy a separate backend

### First Deploy Details
- Build time: 2-3 minutes
- Live URL assigned automatically
- Free tier supports up to 100 deployments/month

---

## 🎯 Current State

```
✅ Repository: Initialized
✅ Code: Committed (2 commits)
✅ Configuration: Ready
✅ API: Implemented
✅ Docs: Complete

⏳ GitHub Push: Needs authentication
⏳ Vercel Deploy: Waits for GitHub push
```

---

## 💡 Troubleshooting

### "Permission denied" when pushing
→ Use Personal Access Token (Step 1, Option A)

### Vercel build fails
→ Check build logs in Vercel dashboard
→ Usually due to missing dependencies (run `npm install` locally)

### Data disappears after deploy
→ Expected! Using ephemeral storage
→ Upgrade to persistent database for production

### API returns 404
→ Check `api/db.ts` exists
→ Check `vercel.json` configuration
→ View Vercel logs

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Push Issues**: Check "credential.helper" setup
- **Build Errors**: Check Vercel deployment logs
- **API Issues**: Check browser console for fetch errors

---

## 🎉 YOU'RE 15 MINUTES AWAY FROM LIVE

Ready? Start with **STEP 1** above!

---

**Created**: May 31, 2026  
**Status**: Ready to Deploy ✅

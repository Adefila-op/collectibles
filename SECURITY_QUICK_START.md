# Quick Start Guide - Security Updates

## What Changed?
Your app now has proper admin authentication! No more hardcoded passwords.

## For Developers

### Running Locally
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Start API server (separate terminal)
npm run api

# Build for production
npm run build
```

### Setting Up First Admin
```bash
# Via Database UI (Supabase Dashboard)
1. Go to your Supabase project
2. Open the "users" table
3. Find your user row
4. Set is_admin = true

# OR via SQL
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

### Testing Admin Features
```bash
# Login first to get your user ID from localStorage
# Then in browser console:
const userId = localStorage.getItem('artchain_user_id');
console.log('Your admin ID:', userId);

# Visit http://localhost:5173/admin
# If you're not admin, you'll see "Access Denied"
# If you are admin, you'll see the admin panel
```

---

## For Administrators

### Promoting a User to Admin
1. Login as an existing admin
2. Go to the Admin Panel (/admin)
3. New admin approval workflow coming soon
4. **Workaround:** Use database directly via Supabase dashboard

### Approving Artists
1. Admin Panel → Artists tab
2. Review pending applications
3. Click "Approve" or "Reject"
4. Changes sync automatically

### Verifying Artworks
1. Admin Panel → Artworks tab
2. Review pending submissions
3. Click "Approve" to mint certificate NFT
4. Click "Reject" to send back for revision

---

## Deployed Environment (Vercel)

### Set Environment Variables
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://user:pass@host/db
```

### After Deployment
1. Database migration runs automatically
2. Visit https://collectibles-dun.vercel.app
3. Login with admin account
4. First admin must be set manually (see above)

---

## Troubleshooting

### "Access Denied" But Should Be Admin?
- Check `is_admin` column in users table is TRUE
- Clear browser cache and reload
- Check you're logged in as the correct user

### Admin Endpoints Returning 403?
- Make sure x-user-id header is being sent
- Verify user exists in database with is_admin = true
- Check network tab in DevTools for request headers

### Build Fails?
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm run build
```

---

## What's Next?

### Coming Soon
- [ ] JWT tokens for stateless auth
- [ ] 2FA support
- [ ] Rate limiting
- [ ] Audit dashboard
- [ ] Advanced admin panel

### Security Checklist
- [x] No hardcoded secrets
- [x] Admin endpoints protected
- [x] User authorization checks
- [ ] JWT implementation
- [ ] Rate limiting
- [ ] CORS restrictions

---

## Support

For issues or questions:
1. Check SECURITY_AUDIT_FIXES.md for detailed changes
2. Review api/server.ts for endpoint documentation
3. Check src/lib/api.ts for API client methods

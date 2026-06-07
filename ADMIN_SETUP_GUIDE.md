# How to Create Admin User

## Option 1: Via Supabase Dashboard (Easiest)

1. **Login to Supabase**
   - Go to: https://app.supabase.com
   - Login with your credentials
   - Select your project: `vcsyszyzlaodsleucbla`

2. **Add is_admin column**
   - Go to "SQL Editor" → "New Query"
   - Copy this SQL:
   ```sql
   ALTER TABLE users
   ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
   ```
   - Click "Run"
   - Should see: "Query successful - no rows returned"

3. **Promote your user to admin**
   - Go to "Table Editor" → "users" table
   - Find your user row
   - Click the "is_admin" cell and toggle it to TRUE
   - It should save automatically

4. **Verify**
   - Refresh your app
   - Login with your account
   - Visit: http://localhost:5173/admin
   - You should now see the admin panel!

---

## Option 2: Via SQL (If Option 1 doesn't work)

1. Go to Supabase → SQL Editor → New Query
2. Run this SQL to add the column:
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Find your user ID (copy the ID)
SELECT id, email FROM users LIMIT 5;

-- Replace <YOUR_USER_ID> with the ID you copied above
UPDATE users SET is_admin = true WHERE id = '<YOUR_USER_ID>';

-- Verify it worked
SELECT id, email, is_admin FROM users WHERE is_admin = true;
```

---

## Option 3: Via Supabase Console Table Editor

1. Go to Supabase Console
2. Click "Table Editor" in left sidebar
3. Click "users" table
4. Scroll right to see all columns
5. If "is_admin" column doesn't exist:
   - Click the + icon to add column
   - Name: `is_admin`
   - Type: `boolean`
   - Default: `false`
6. Find your user row
7. Click the "is_admin" cell
8. Toggle to TRUE
9. Save

---

## Testing Admin Access

After setting up:

1. **Restart your dev server**
   ```bash
   npm run dev
   ```

2. **Login**
   - Email: your account email
   - Password: your password

3. **Test admin panel**
   - Visit: http://localhost:5173/admin
   - Should see admin dashboard (not "Access Denied")

4. **Features you can now use**
   - Approve/reject artist applications
   - Approve/reject artwork submissions
   - Mint certificates for verified artworks
   - View admin audit log

---

## Troubleshooting

### Still seeing "Access Denied"?
- Make sure you saved the is_admin = true change
- Clear browser cache (Ctrl+Shift+Delete)
- Logout and login again

### Column won't add?
- Make sure you're in the right Supabase project
- Check that the "users" table exists
- Try running the schema.sql from "SQL Editor" → "New Query"

### Need to reset?
```sql
-- Reset is_admin for all users
UPDATE users SET is_admin = false;

-- Then set just one to admin
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

---

## Your Supabase Details
- **Project**: vcsyszyzlaodsleucbla
- **URL**: https://vcsyszyzlaodsleucbla.supabase.co
- **Table**: users
- **Column to add**: is_admin (boolean, default false)

Once you've set up the admin, your platform will have:
✅ Dark modern theme
✅ Admin authentication
✅ Artist approval workflow
✅ Artwork verification system

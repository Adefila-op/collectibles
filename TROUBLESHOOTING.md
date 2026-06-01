# Troubleshooting Guide

## Common Issues & Solutions

### Backend Issues

#### 1. MongoDB Connection Error
**Error**: `MongooseError: Unable to connect to mongodb://localhost:27017/artchain`

**Solutions**:
- Ensure MongoDB is running:
  ```bash
  # On Windows
  mongod
  
  # Or if using MongoDB Atlas, update MONGODB_URI in .env
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artchain
  ```
- Check MongoDB connection string in `.env`
- Verify MongoDB service is started

#### 2. Port Already in Use
**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
PORT=5001
```

#### 3. JWT Secret Missing
**Error**: `Error: JWT_SECRET is required`

**Solution**:
```bash
# Generate a secure secret
openssl rand -hex 32

# Add to .env
JWT_SECRET=your_generated_secret_here
```

#### 4. Module Not Found
**Error**: `Cannot find module 'express'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

#### 1. API Connection Error
**Error**: `ERR_CONNECTION_REFUSED` or CORS error

**Solutions**:
- Ensure backend is running on port 5000
- Check `.env` has correct API URL:
  ```
  REACT_APP_API_URL=http://localhost:5000/api
  ```
- Clear browser cache and hard refresh (Ctrl+Shift+R)

#### 2. Blank Page
**Error**: Page loads but shows nothing

**Solutions**:
- Check browser console (F12) for JavaScript errors
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm start
  ```
- Try different port:
  ```bash
  PORT=3001 npm start
  ```

#### 3. CORS Error
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution** (if not already configured):
- Backend CORS is already configured in `server.js`
- Ensure client URL is whitelisted in backend

#### 4. Dependencies Conflict
**Error**: `npm ERR! found X vulnerabilities`

**Solution**:
```bash
# Audit and fix vulnerabilities
npm audit fix

# Or update packages
npm update
```

### Database Issues

#### 1. Database Too Large
**Solution**: Clear collections in MongoDB
```bash
# Using MongoDB shell
use artchain
db.artworks.deleteMany({})
db.offers.deleteMany({})
db.swaps.deleteMany({})
```

#### 2. Data Inconsistency
**Solution**: Check and fix references
```bash
# Verify user exists for artwork
db.artworks.find({owner: ObjectId("...")})
```

### Authentication Issues

#### 1. Token Expired
**Error**: `401 Unauthorized`

**Solution**:
- Clear localStorage and login again:
  ```javascript
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  ```
- Tokens expire in 30 days by default

#### 2. Token Not Sent
**Error**: `No token, authorization denied`

**Solution**:
- Ensure Authorization header is set in requests
- Check token is stored in localStorage after login
- Verify frontend is sending token with API calls

### Real-time/Socket.io Issues

#### 1. Socket Connection Failed
**Error**: `WebSocket is closed before the connection is established`

**Solution**:
- Ensure backend is running
- Check socket URL in frontend
- Verify CORS settings allow socket connections

#### 2. Notifications Not Working
**Solution**:
- Check browser console for socket errors
- Ensure Socket.io library versions match between frontend and backend
- Try refreshing the page

## Performance Tips

### Backend
- Use MongoDB indexing for frequently queried fields
- Implement pagination for large result sets
- Cache static data when possible
- Monitor MongoDB query performance

### Frontend
- Use React DevTools to check for unnecessary re-renders
- Implement code splitting with React.lazy()
- Optimize images before uploading
- Use browser DevTools Network tab to monitor API calls

## Security Reminders

1. **Never commit `.env` file** - Use `.env.example` for templates
2. **Generate strong JWT secrets** - Use `openssl rand -hex 32`
3. **Validate all user inputs** - Backend already has validation
4. **Use HTTPS in production** - Update API URLs for HTTPS
5. **Secure MongoDB** - Use authentication in production
6. **Update dependencies regularly** - Run `npm audit` periodically

## Debugging Tools

### Browser DevTools
```javascript
// Check stored token
console.log(localStorage.getItem('token'));

// Check current user
console.log(localStorage.getItem('user'));

// Monitor API calls in Network tab
```

### Backend Logging
```javascript
// Add custom logs in controllers
console.log('Offer data:', req.body);
console.log('User ID:', req.userId);
```

### MongoDB Compass
- Visual MongoDB database explorer
- Execute queries easily
- Export/import data

## Getting Help

1. Check error message carefully
2. Review browser console and backend logs
3. Search for error in documentation
4. Check GitHub issues for similar problems
5. Verify all environment variables are set correctly
6. Try the Quick Start guide from scratch

## Performance Optimization

### Database
```javascript
// Add indexes for frequently queried fields
userSchema.index({ email: 1 });
artworkSchema.index({ owner: 1 });
offerSchema.index({ targetUser: 1, status: 1 });
```

### Frontend
```javascript
// Lazy load components
const MyOffers = React.lazy(() => import('./pages/MyOffers'));

// Use pagination for large lists
const itemsPerPage = 20;
```

### Caching
```javascript
// Cache API responses where appropriate
const cache = new Map();
if (cache.has(key)) return cache.get(key);
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use MongoDB Atlas (managed service)
3. Set strong JWT secret
4. Configure email service for notifications
5. Set up logging and monitoring

### Frontend
1. Build optimized bundle: `npm run build`
2. Deploy to hosting service (Vercel, Netlify, etc.)
3. Update REACT_APP_API_URL to production backend
4. Enable HTTPS
5. Set up analytics


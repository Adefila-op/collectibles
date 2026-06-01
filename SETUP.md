# Installation & Setup Guide

## Prerequisites
- Node.js v14+ 
- npm or yarn
- MongoDB (local or Atlas)
- Git

## Backend Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Set `MONGODB_URI` to your MongoDB connection string
- Generate and set `JWT_SECRET` (use `openssl rand -hex 32`)
- Keep `PORT=5000` for default

### Step 3: Start Server
```bash
npm run dev
```

Output should show:
```
Server running on port 5000
MongoDB connected
```

## Frontend Setup

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Ensure `REACT_APP_API_URL=http://localhost:5000/api`

### Step 3: Start Development Server
```bash
npm start
```

Browser will open to `http://localhost:3000`

## Verification

### Backend
- Visit `http://localhost:5000/api/artworks` (should return empty array or artworks)
- Check terminal for connection messages

### Frontend
- Should load without errors
- Navigation and login page should be visible
- Check browser console for API connection logs

## Demo Usage

1. **Register** - Create an account with email and password
2. **Add Artwork** - Go to "My Collection" and add test artworks
3. **Browse** - View all artworks on "Browse" page
4. **Place Offer** - Click artwork → "Place an Offer"
5. **View Offers** - Check "My Offers" page
6. **Accept Swap** - Receive and accept offers to initiate trades
7. **Dashboard** - Track swaps and audit progress

## Troubleshooting

### Backend Issues
- **MongoDB Connection Error**: Check MONGODB_URI and ensure MongoDB is running
- **Port Already in Use**: Change PORT in .env or kill process on 5000
- **Module Not Found**: Run `npm install` again

### Frontend Issues
- **API Connection Error**: Ensure backend is running on 5000
- **Blank Page**: Check browser console for errors
- **CORS Errors**: Backend CORS is configured, ensure API_URL matches

## Database Seeding (Optional)

To populate with test data:
```bash
# In backend directory
node seeds/seedDatabase.js
```

## Production Build

### Frontend
```bash
cd frontend
npm run build
```

Build files will be in `frontend/build/`

### Backend
Simply deploy the backend folder to your server with Node.js installed.

## API Documentation

See [API_DOCS.md](API_DOCS.md) for complete endpoint reference.

## Support

- Check `backend/README.md` for backend details
- Check `frontend/README.md` for frontend details
- See main `README.md` for project overview

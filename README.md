# ArtChain - African Art Portfolio Management Platform

An onchain portfolio management platform for buying, selling, and tracking African artwork ownership.

## Features

- 🎨 Browse and discover African artworks
- 💼 Manage your art portfolio
- 💰 Buy and sell artworks
- 🔄 Swap artworks peer-to-peer
- 📊 Track portfolio value
- 🏛️ View artwork provenance and artist information

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: JSON file-based storage (Vercel `/tmp`)
- **Routing**: React Router v7
- **Icons**: Lucide React

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server runs on `http://localhost:5173`

## Project Structure

```
artchain-vite/
├── src/
│   ├── components/        # React components
│   ├── routes/            # Page routes
│   ├── contexts/          # React Context (auth, etc)
│   ├── lib/               # Utilities & API client
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── api/
│   └── db.ts              # Vercel serverless database API
├── public/                # Static assets
└── vercel.json            # Vercel configuration
```

## API Endpoints

The backend API provides CRUD operations for:
- Users
- Sessions
- Holdings (owned/listed artworks)
- Offers
- Swaps
- Artworks

**Base URL**: `/api/db`

**Example Request**:
```javascript
// Get all holdings
fetch('/api/db', {
  method: 'POST',
  body: JSON.stringify({
    action: 'read',
    table: 'holdings',
    filter: { userId: 'user-id' }
  })
})
```

## Deployment

### Deploy to Vercel

1. **Connect your GitHub repository**
   ```bash
   git remote add origin https://github.com/Adefila-op/collectibles.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Environment Variables** (if needed)
   ```
   VITE_API_URL=/api
   ```

The deployment will:
- Build the frontend with Vite
- Deploy serverless functions from `/api` directory
- Serve everything on your Vercel domain

### Local Deployment Testing

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy locally
vercel

# Preview deployment
vercel --prod
```

## Database

Data is stored as JSON files in `/tmp` on Vercel (ephemeral storage). For production with persistent storage, consider:

- **Option 1**: Supabase (PostgreSQL with JSON support)
- **Option 2**: MongoDB Atlas
- **Option 3**: Separate backend with persistent file storage

Current setup uses Vercel Functions which is ideal for prototyping but has limitations for persistent storage.

## Architecture

### Frontend (React)
- React Context for authentication state
- Vite for fast development and building
- React Router for navigation
- Shadcn/ui for consistent UI components

### Backend (Vercel Functions)
- Serverless Node.js functions
- JSON file-based storage
- RESTful API design

### Data Flow
```
Frontend → API Client → Vercel Functions → JSON Storage
```

## Security Notes

⚠️ **Current Implementation**: Client-side authentication (for development)

For production, add:
- Server-side session validation
- Password hashing (bcrypt)
- HTTPS enforcement
- Rate limiting
- CSRF protection
- JWT tokens

## Configuration

### Vercel Specific
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Functions**: `/api/**/*.ts`

### Environment
- `VITE_API_URL`: API base URL (default: `/api`)

## License

MIT

## Support

For issues or questions, please create an issue on GitHub.

---

**Status**: 🚧 Development/Beta  
**Last Updated**: May 31, 2026

# ArtChain Backend API

Node.js + Express + MongoDB backend server for the ArtChain Africa collectible art trading platform.

## Quick Start

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000`

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure MongoDB connection and other variables

3. Install dependencies and start development server:
```bash
npm install
npm run dev
```

## API Routes

### Auth (`/api/auth`)
- `POST /register` - Create new account
- `POST /login` - Login user
- `GET /profile` - Get user profile

### Artworks (`/api/artworks`)
- `GET /` - List all artworks
- `GET /:id` - Get artwork details
- `POST /` - Create artwork
- `PUT /:id` - Update artwork
- `DELETE /:id` - Delete artwork

### Offers (`/api/offers`)
- `GET /` - List offers
- `POST /` - Place standing offer
- `PUT /:id` - Update offer status
- `DELETE /:id` - Decline offer

### Swaps (`/api/swaps`)
- `GET /` - List swaps
- `POST /` - Accept offer (create swap)
- `PUT /:id` - Update swap status
- `POST /:id/approve` - Approve audit

### Users (`/api/users`)
- `GET /:id` - Get user profile
- `PUT /:id` - Update user profile

## Models

- **User** - Collectors and traders
- **Artwork** - Art pieces in collections
- **Offer** - Standing offers on artworks
- **Swap** - Completed trades with audit tracking

## Features

✅ User authentication with JWT
✅ Collection management
✅ Standing offers system
✅ Swap with audit tracking
✅ Real-time updates via Socket.io
✅ MongoDB integration

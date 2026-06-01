# ArtChain Africa - Full Functional App

A comprehensive collectible art trading platform built with React, Node.js, Express, and MongoDB. This application enables art collectors to browse, collect, and trade artworks through a structured offer and swap system with integrated audit processes.

## Features

### Buyer Side
- Browse collector profiles and their artwork collections
- View detailed artwork information (provenance, condition, estimated value)
- Place standing offers on pieces (art swap, cash only, or art + cash)
- Track and manage all outgoing offers
- Receive notifications when offers are accepted

### Seller Side
- Display collection of owned artworks
- Review incoming standing offers
- Accept or decline offers
- Initiate swaps with integrated audit process
- Track swap progress through timeline

### Trading System
- **Standing Offers**: Buyers can place offers that remain active until accepted or cancelled
- **Swap Process**: 
  1. Offer accepted by seller
  2. Both pieces ship to vault
  3. Dual audit verification
  4. Both parties approve
  5. Art cross-shipped to new owners
  6. Cash held in escrow during audit

### User Features
- User authentication and profiles
- Collection management
- Real-time notifications via Socket.io
- Onchain verification badges
- Mobile-responsive design

## Project Structure

```
collectibles/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── controllers/      # Business logic
│   ├── middleware/       # Authentication & validation
│   ├── server.js        # Express server setup
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── store/       # Zustand state management
│   │   ├── utils/       # API calls & helpers
│   │   ├── App.jsx      # Main app component
│   │   └── index.js     # React entry point
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
└── README.md            # This file
```

## Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Real-time**: Socket.io
- **File Upload**: Multer + Cloudinary
- **Payments**: Stripe integration
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: React Icons
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Real-time**: Socket.io client

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/artchain
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm start
```

The frontend will open on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Artworks
- `GET /api/artworks` - Get all artworks
- `GET /api/artworks/:id` - Get artwork details
- `POST /api/artworks` - Create artwork (protected)
- `PUT /api/artworks/:id` - Update artwork (protected)
- `DELETE /api/artworks/:id` - Delete artwork (protected)

### Offers
- `GET /api/offers` - Get all offers
- `POST /api/offers` - Place offer (protected)
- `PUT /api/offers/:id` - Update offer status (protected)
- `DELETE /api/offers/:id` - Decline offer (protected)

### Swaps
- `GET /api/swaps` - Get all swaps
- `POST /api/swaps` - Accept offer & initiate swap (protected)
- `PUT /api/swaps/:id` - Update swap status (protected)
- `POST /api/swaps/:id/approve` - Approve audit (protected)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile (protected)

## Key Features Implementation

### Standing Offers
Users can place multiple types of offers:
- **Art Swap**: Trade one artwork for another
- **Cash Only**: Purchase artwork with cash
- **Art + Cash**: Trade artwork plus additional cash

### Swap Timeline
The audit process tracks:
1. Swap accepted onchain (completed)
2. Both pieces ship to vault (active)
3. Dual audit verification (pending)
4. Both parties approve (pending)
5. Art cross-shipped to owners (pending)

### Real-time Notifications
Socket.io events:
- `offer_placed` - New offer notification
- `offer_accepted` - Offer acceptance notification
- `swap_initiated` - Swap started
- `swap_updated` - Swap progress update

## Authentication Flow

1. User registers with email, name, and location
2. Backend hashes password and stores user
3. JWT token issued on successful login
4. Token stored in localStorage
5. Token sent with each API request in Authorization header
6. Middleware verifies token before protected routes

## Database Models

### User
- name, email, password (hashed)
- location, avatar, bio
- verification status
- wallet and bank details
- collection (array of artwork IDs)

### Artwork
- title, artist, description
- images, medium, condition
- estimated value, current value
- provenance history
- onchain verification
- listing status

### Offer
- offeringPiece, targetPiece (artwork references)
- offeringUser, targetUser (user references)
- offer type and cash amount
- status and expiration date

### Swap
- piece1, piece2 (artwork references)
- user1, user2 (user references)
- status and timeline
- audit status tracking
- vault locations

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/artchain
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Future Enhancements

- [ ] Payment integration with Stripe
- [ ] Onchain blockchain integration
- [ ] Advanced auction system
- [ ] Insurance integration
- [ ] Verification system with KYC
- [ ] Rating and review system
- [ ] Messaging system between users
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Export features

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by the ArtChain Africa Team**

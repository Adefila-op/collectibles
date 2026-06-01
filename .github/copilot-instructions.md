# ArtChain Africa - Complete Project Setup

A full-stack collectible art trading platform implementation based on the provided design flow.

## Overview

This project implements a complete art trading ecosystem where collectors can:
- Browse other collectors' artwork
- Place standing offers on pieces
- Manage their own collection
- Execute secure swaps with integrated audit verification
- Track all trading activity in real-time

## Project Structure

### Backend (`/backend`)
- Express.js REST API
- MongoDB database
- JWT authentication
- Socket.io real-time updates
- Complete API routes for artworks, offers, and swaps

### Frontend (`/frontend`)
- React with React Router
- Zustand state management
- Tailwind CSS responsive design
- Real-time Socket.io integration
- Complete UI for all user flows

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## Key Flows Implemented

1. **Browse & Discover** - Users browse collections and view detailed artwork info
2. **Place Offers** - Multiple offer types (art swap, cash, art + cash)
3. **Manage Offers** - Accept, decline, or counter offers
4. **Swap Process** - Structured swap with timeline and audit tracking
5. **Dashboard** - Central hub for tracking active swaps and approvals

## Database Schemas

- **Users** - Profiles with collections
- **Artworks** - Pieces with provenance and valuation
- **Offers** - Standing offers with expiration
- **Swaps** - Trade tracking with audit timeline

## API Features

- Complete CRUD operations
- JWT authentication
- Real-time events via Socket.io
- Comprehensive error handling
- Input validation

## Frontend Features

- Responsive mobile-first design
- Real-time notifications
- Protected routes
- State persistence
- Loading states and error handling

## Configuration

Update `.env` files in both backend and frontend for your environment.

## Next Steps

1. Install MongoDB locally or use MongoDB Atlas
2. Configure environment variables
3. Start backend server on port 5000
4. Start frontend on port 3000
5. Register an account and start trading!

## Technologies

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Socket.io
**Frontend:** React, React Router, Zustand, Tailwind CSS, Axios


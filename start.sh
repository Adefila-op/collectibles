#!/bin/bash

# ArtChain Africa - Start Development Environment
# This script starts both backend and frontend servers

echo "🎨 Starting ArtChain Africa Development Environment..."
echo ""

# Check if node_modules exists for backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if node_modules exists for frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Creating backend .env from example..."
    cp backend/.env.example backend/.env
    echo "✏️  Please edit backend/.env with your MongoDB connection details"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚙️ Creating frontend .env from example..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "🚀 Starting servers..."
echo ""

# Start backend in background
echo "📡 Starting backend server on port 5000..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🌐 Starting frontend server on port 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Keep script running
wait

@echo off
REM ArtChain Africa - Start Development Environment
REM This batch script starts both backend and frontend servers

echo 🎨 Starting ArtChain Africa Development Environment...
echo.

REM Check if node_modules exists for backend
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check if node_modules exists for frontend
if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Check if .env files exist
if not exist "backend\.env" (
    echo ⚙️  Creating backend .env from example...
    copy backend\.env.example backend\.env
    echo ✏️  Please edit backend\.env with your MongoDB connection details
)

if not exist "frontend\.env" (
    echo ⚙️  Creating frontend .env from example...
    copy frontend\.env.example frontend\.env
)

echo.
echo 🚀 Starting servers...
echo.

REM Start backend in new window
echo 📡 Starting backend server on port 5000...
start "ArtChain Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in new window
echo 🌐 Starting frontend server on port 3000...
start "ArtChain Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Check the separate command windows for server output
echo.

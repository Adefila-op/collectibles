import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CollectorProfile from './pages/CollectorProfile';
import MyCollection from './pages/MyCollection';
import BrowseArtworks from './pages/BrowseArtworks';
import ArtworkDetail from './pages/ArtworkDetail';
import PlaceOffer from './pages/PlaceOffer';
import MyOffers from './pages/MyOffers';
import SwapDetails from './pages/SwapDetails';
import Dashboard from './pages/Dashboard';

// Components
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Toaster position="top-right" />
        <Navigation />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/browse" element={<BrowseArtworks />} />
          <Route path="/artwork/:id" element={<ArtworkDetail />} />
          <Route path="/collector/:id" element={<CollectorProfile />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-collection" element={<MyCollection />} />
            <Route path="/place-offer/:id" element={<PlaceOffer />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/swap/:id" element={<SwapDetails />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/browse" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

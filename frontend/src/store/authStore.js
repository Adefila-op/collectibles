import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));

export const useArtworkStore = create((set) => ({
  artworks: [],
  loading: false,
  error: null,

  setArtworks: (artworks) => set({ artworks }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  addArtwork: (artwork) => set((state) => ({ artworks: [artwork, ...state.artworks] })),
}));

export const useOfferStore = create((set) => ({
  offers: [],
  swaps: [],
  loading: false,

  setOffers: (offers) => set({ offers }),
  setSwaps: (swaps) => set({ swaps }),
  addOffer: (offer) => set((state) => ({ offers: [offer, ...state.offers] })),
  addSwap: (swap) => set((state) => ({ swaps: [swap, ...state.swaps] })),
}));

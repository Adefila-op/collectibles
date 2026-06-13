# Using Solana NFT Components - Frontend Integration Guide

## Quick Start

### 1. **Display NFT Listings**

```tsx
import { useEffect, useState } from 'react';
import SolanaNFTDetailModal from '@/components/modals/SolanaNFTDetailModal';
import { SolanaNFTListing } from '@/lib/types';

export function SolanaNFTBrowser() {
  const [nfts, setNfts] = useState<SolanaNFTListing[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<SolanaNFTListing | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // Fetch Solana NFTs
    fetch('/api/solana/nfts/listings?limit=20')
      .then(r => r.json())
      .then(data => setNfts(data.listings));
  }, []);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {nfts.map(nft => (
          <div
            key={nft.id}
            onClick={() => {
              setSelectedNFT(nft);
              setShowDetail(true);
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={nft.imageUrlCached || nft.imageUrl}
              alt={nft.name}
              className="w-full aspect-square object-cover rounded-lg"
            />
            <p className="font-semibold mt-2">{nft.name}</p>
            <p className="text-blue-600 font-bold">{nft.floorPrice} {nft.currency}</p>
          </div>
        ))}
      </div>

      <SolanaNFTDetailModal
        nft={selectedNFT}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onBuy={(nft) => console.log('Buy:', nft)}
        onMakeOffer={(nft) => console.log('Offer:', nft)}
      />
    </div>
  );
}
```

---

### 2. **Search Solana NFTs**

```tsx
import { useState } from 'react';
import { SolanaNFTListing } from '@/lib/types';

export function SearchNFTs() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SolanaNFTListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    try {
      const response = await fetch(
        `/api/solana/nfts/search?q=${encodeURIComponent(query)}&limit=20`
      );
      const data = await response.json();
      setResults(data.results);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="grid grid-cols-4 gap-4 mt-4">
        {results.map(nft => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
}
```

---

### 3. **Make an Offer (In-App)**

```tsx
import { useState } from 'react';
import InAppOfferModal from '@/components/modals/InAppOfferModal';
import { SolanaNFTListing } from '@/lib/types';

export function OfferFlow({ nft, walletBalance }: { nft: SolanaNFTListing; walletBalance: number }) {
  const [showOfferModal, setShowOfferModal] = useState(false);

  const handleSubmitOffer = async (offer: {
    nftId: string;
    amount: number;
    message?: string;
  }) => {
    const response = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer),
    });

    if (!response.ok) throw new Error('Failed to submit offer');
    return response.json();
  };

  return (
    <>
      <button
        onClick={() => setShowOfferModal(true)}
        className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
      >
        Make Offer
      </button>

      <InAppOfferModal
        nft={nft}
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        walletBalance={walletBalance}
        onSubmit={handleSubmitOffer}
      />
    </>
  );
}
```

---

### 4. **Buy NFT (In-App)**

```tsx
import { useState } from 'react';
import InAppBuyModal from '@/components/modals/InAppBuyModal';
import { SolanaNFTListing } from '@/lib/types';

export function BuyFlow({ nft, walletBalance }: { nft: SolanaNFTListing; walletBalance: number }) {
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleBuy = async (purchase: {
    nftId: string;
    price: number;
    paymentMethod: 'wallet' | 'card' | 'bank';
  }) => {
    const response = await fetch('/api/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchase),
    });

    if (!response.ok) throw new Error('Purchase failed');
    return response.json();
  };

  return (
    <>
      <button
        onClick={() => setShowBuyModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
      >
        Buy Now
      </button>

      <InAppBuyModal
        nft={nft}
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        walletBalance={walletBalance}
        onBuy={handleBuy}
      />
    </>
  );
}
```

---

### 5. **Full NFT Detail View**

```tsx
import SolanaNFTDetailModal from '@/components/modals/SolanaNFTDetailModal';
import { SolanaNFTListing } from '@/lib/types';

export function NFTDetailView({ nft, isOpen, onClose }: {
  nft: SolanaNFTListing | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SolanaNFTDetailModal
      nft={nft}
      isOpen={isOpen}
      onClose={onClose}
      onBuy={(nft) => {
        // Handle buy
        console.log('Buy:', nft);
        // Show buy modal or navigate to checkout
      }}
      onMakeOffer={(nft) => {
        // Handle offer
        console.log('Offer:', nft);
        // Show offer modal
      }}
    />
  );
}
```

---

## Component Props Reference

### **SolanaNFTDetailModal**
```tsx
interface SolanaNFTDetailModalProps {
  nft: SolanaNFTListing | null;
  isOpen: boolean;
  onClose: () => void;
  onMakeOffer?: (nft: SolanaNFTListing) => void;
  onBuy?: (nft: SolanaNFTListing) => void;
}
```

### **InAppOfferModal**
```tsx
interface InAppOfferModalProps {
  nft: SolanaNFTListing | null;
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  onSubmit: (offer: {
    nftId: string;
    amount: number;
    message?: string;
  }) => Promise<void>;
}
```

### **InAppBuyModal**
```tsx
interface InAppBuyModalProps {
  nft: SolanaNFTListing | null;
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  onBuy: (purchase: {
    nftId: string;
    price: number;
    paymentMethod: 'wallet' | 'card' | 'bank';
  }) => Promise<void>;
}
```

---

## Type Definitions

```tsx
interface SolanaNFTListing {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageUrlCached: string; // Use this for display
  floorPrice: string;
  currency: string;
  collectionName: string;
  collectionAddress: string;
  tokenAddress: string;
  tokenId: string;
  chain: 'solana';
  contractAddress: string;
  permalinkUrl: string;
  rarity?: string;
}
```

---

## API Integration Checklist

- [ ] Import components in your routes
- [ ] Add NFT listing page
- [ ] Add search functionality
- [ ] Add detail modal trigger
- [ ] Add offer flow
- [ ] Add buy flow
- [ ] Connect wallet balance state
- [ ] Implement offer API endpoint
- [ ] Implement buy API endpoint
- [ ] Test with sample NFTs

---

## Best Practices

1. **Always use `imageUrlCached`** - It's the locally cached version
2. **Handle loading states** - Show skeleton loaders while fetching
3. **Validate balances** - Components do it, but validate on submit too
4. **Show error messages** - Components include error displays
5. **Cache NFT data** - Don't refetch same NFTs repeatedly
6. **Clean up modals** - Close them on success/cancel
7. **Track state** - Use React hooks for modal state

---

## Troubleshooting

**Images not loading?**
- Check `/dist/images/cache/` exists
- Verify `imageUrlCached` is not empty
- Check browser console for CORS errors

**Modals not showing?**
- Verify `isOpen` prop is true
- Check z-index conflicts
- Ensure modal is mounted

**Balance issues?**
- Validate `walletBalance` is a number
- Check wallet endpoint: `/api/solana/wallet/:address/balance`
- Ensure Solana address is valid

**API errors?**
- Check server logs: `npm run api`
- Verify OPENSEA_API_KEY in `.env.local`
- Ensure network requests aren't blocked

---

## Example: Complete NFT Marketplace Page

```tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SolanaNFTDetailModal from '@/components/modals/SolanaNFTDetailModal';
import InAppOfferModal from '@/components/modals/InAppOfferModal';
import InAppBuyModal from '@/components/modals/InAppBuyModal';
import { SolanaNFTListing } from '@/lib/types';

export default function SolanaMarketplace() {
  const { user } = useAuth();
  const [nfts, setNfts] = useState<SolanaNFTListing[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<SolanaNFTListing | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch NFTs
    fetch('/api/solana/nfts/listings?limit=20')
      .then(r => r.json())
      .then(data => setNfts(data.listings))
      .finally(() => setIsLoading(false));

    // Fetch wallet balance
    if (user?.wallet_address) {
      fetch(`/api/solana/wallet/${user.wallet_address}/balance`)
        .then(r => r.json())
        .then(data => setWalletBalance(parseFloat(data.balance) / 1e9));
    }
  }, [user]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-2">Solana NFT Marketplace</h1>
      <p className="text-gray-600 mb-8">
        Balance: {walletBalance.toFixed(4)} SOL
      </p>

      {isLoading ? (
        <div className="text-center py-12">Loading NFTs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nfts.map(nft => (
            <div
              key={nft.id}
              onClick={() => {
                setSelectedNFT(nft);
                setShowDetail(true);
              }}
              className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <img
                src={nft.imageUrlCached || nft.imageUrl}
                alt={nft.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <p className="font-semibold truncate">{nft.name}</p>
                <p className="text-sm text-gray-600 truncate">{nft.collectionName}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {nft.floorPrice} {nft.currency}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <SolanaNFTDetailModal
        nft={selectedNFT}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onBuy={(nft) => {
          setSelectedNFT(nft);
          setShowDetail(false);
          setShowBuy(true);
        }}
        onMakeOffer={(nft) => {
          setSelectedNFT(nft);
          setShowDetail(false);
          setShowOffer(true);
        }}
      />

      <InAppOfferModal
        nft={selectedNFT}
        isOpen={showOffer}
        onClose={() => setShowOffer(false)}
        walletBalance={walletBalance}
        onSubmit={async (offer) => {
          await fetch('/api/offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offer),
          });
        }}
      />

      <InAppBuyModal
        nft={selectedNFT}
        isOpen={showBuy}
        onClose={() => setShowBuy(false)}
        walletBalance={walletBalance}
        onBuy={async (purchase) => {
          await fetch('/api/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchase),
          });
        }}
      />
    </div>
  );
}
```

---

That's it! You now have a complete Solana NFT marketplace with in-app experiences. 🎉

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppFrame } from '@/components/AppFrame';
import { solanaAPI } from '@/lib/api-solana';
import { SolanaNFTListing } from '@/lib/types';
import SolanaNFTDetailModal from '@/components/modals/SolanaNFTDetailModal';
import InAppOfferModal from '@/components/modals/InAppOfferModal';
import InAppBuyModal from '@/components/modals/InAppBuyModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Zap,
  Eye,
  BarChart3,
  Share2,
} from 'lucide-react';

export default function SolanaCollectionDetail() {
  const { collection } = useParams<{ collection: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nfts, setNfts] = useState<SolanaNFTListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<SolanaNFTListing | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const decodedCollection = collection ? decodeURIComponent(collection) : '';

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setIsLoading(true);
        const results = await solanaAPI.search(decodedCollection, 100);
        setNfts(results);
      } catch (error) {
        console.error('Failed to fetch collection NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (decodedCollection) {
      fetchNFTs();
    }
  }, [decodedCollection]);

  // Get wallet balance if user exists
  useEffect(() => {
    if (user?.wallet_address) {
      solanaAPI
        .getWalletBalance(user.wallet_address)
        .then(data => {
          const balanceSol = parseFloat(data.balance) / 1e9;
          setWalletBalance(balanceSol);
        })
        .catch(err => console.error('Failed to fetch balance:', err));
    }
  }, [user?.wallet_address]);

  const collectionStats = {
    floorPrice: nfts.length > 0 ? nfts[0].floorPrice : '0',
    itemCount: nfts.length,
    owners: Math.floor(nfts.length / 2),
    volume: nfts.reduce((acc, nft) => acc + (parseFloat(nft.floorPrice) || 0), 0),
  };

  return (
    <AppFrame label={`${decodedCollection} · Collection`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="px-5 pt-3 space-y-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/explore?section=explore')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Collections
          </button>

          {/* Collection Hero */}
          <div className="space-y-3 animate-fade-up">
            <h1 className="font-display text-3xl font-semibold">{decodedCollection}</h1>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-2xl p-3 animate-pop" style={{ animationDelay: '0s' }}>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Floor Price
                </div>
                <div className="text-lg font-bold mt-1">{collectionStats.floorPrice} SOL</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-3 animate-pop" style={{ animationDelay: '0.1s' }}>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Volume
                </div>
                <div className="text-lg font-bold mt-1">{collectionStats.volume.toFixed(2)} SOL</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-3 animate-pop" style={{ animationDelay: '0.2s' }}>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Items
                </div>
                <div className="text-lg font-bold mt-1">{collectionStats.itemCount}</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-3 animate-pop" style={{ animationDelay: '0.3s' }}>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Owners
                </div>
                <div className="text-lg font-bold mt-1">{collectionStats.owners}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 font-semibold hover:opacity-90 transition-opacity">
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                disabled={!user}
                className="px-4 py-2.5 border border-border rounded-xl font-semibold hover:bg-muted transition-colors disabled:opacity-50"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* NFT Grid */}
        <div className="px-5 pb-6">
          <h2 className="font-semibold text-lg mb-3">Collection Items</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array(4).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted rounded-2xl aspect-square animate-pulse"
                />
              ))}
            </div>
          ) : nfts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {nfts.map((nft) => (
                <div
                  key={nft.id}
                  onClick={() => {
                    setSelectedNFT(nft);
                    setShowDetail(true);
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-muted cursor-pointer animate-pop"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={nft.imageUrlCached || nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs font-semibold text-white truncate">{nft.name}</p>
                    <p className="text-sm font-bold text-green-400">{nft.floorPrice} SOL</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No NFTs found in this collection</p>
            </div>
          )}
        </div>

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
            try {
              await solanaAPI.makeOfferOpenSea(
                selectedNFT!.contractAddress,
                selectedNFT!.tokenId,
                offer.amount
              );
              // Success handling
            } catch (error) {
              console.error('Offer failed:', error);
            }
          }}
        />

        <InAppBuyModal
          nft={selectedNFT}
          isOpen={showBuy}
          onClose={() => setShowBuy(false)}
          walletBalance={walletBalance}
          onBuy={async (purchase) => {
            try {
              await solanaAPI.buyNFTOpenSea(
                selectedNFT!.contractAddress,
                selectedNFT!.tokenId,
                purchase.paymentMethod
              );
              // Success handling
            } catch (error) {
              console.error('Purchase failed:', error);
            }
          }}
        />
      </div>
    </AppFrame>
  );
}

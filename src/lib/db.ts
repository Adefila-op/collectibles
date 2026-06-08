// Local "database" backed by localStorage
// Simulates a real DB with users table and session management

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // simple hash for demo
  createdAt: string;
  avatar: string; // initials
  walletBalance: number;
  artistStatus?: "collector" | "pending" | "approved";
  artistType?: string;
  artistBio?: string;
  portfolioUrl?: string;
  socialUrl?: string;
  liveLocation?: string;
  callUrl?: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface UserHolding {
  id: string;
  userId: string;
  artId: string;
  status: "owned" | "listed" | "swapped";
  acquiredAt: string;
  listedPrice?: number;
  listedAt?: string;
  soldAt?: string;
}

export interface Offer {
  id: string;
  artId: string;
  buyerId: string;
  amount: number;
  status: "open" | "accepted" | "rejected" | "expired";
  createdAt: string;
  expiresAt: string;
}

export interface SwapProposal {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromArtId: string;
  toArtId: string;
  status: "proposed" | "accepted" | "rejected";
  createdAt: string;
}

export interface Art {
  id: string;
  name: string;
  artist: string;
  city: string;
  year: number;
  category: string;
  price: number;
  image: string;
  token: string;
  collectionName?: string;
  supplyName?: string;
  artistSignature?: string;
  createdAt?: string;
  isUserCreated?: boolean;
  uniqueId?: string;
  certificate?: {
    id: string;
    issuer: string;
    issuedAt: string;
    status: "verified" | "pending" | "missing";
  };
  ownershipHistory?: ArtworkHistoryEvent[];
  exhibitionHistory?: ArtworkHistoryEvent[];
  restorationHistory?: ArtworkHistoryEvent[];
  valuationHistory?: ArtworkValuationEvent[];
}

export interface ArtworkHistoryEvent {
  title: string;
  date: string;
  detail: string;
  reference?: string;
  value?: number;
}

export interface ArtworkValuationEvent {
  date: string;
  amount: number;
  source: string;
  reference?: string;
}

// ── NEW: Transaction Management ─────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: "purchase" | "resale" | "swap" | "offer_accepted" | "royalty" | "withdrawal" | "topup";
  buyerId: string;
  sellerId?: string;
  artId?: string;
  amount: number;
  commission?: number; // platform fee
  royalty?: number; // artist royalty
  status: "pending" | "escrow" | "completed" | "failed";
  escrowId?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Escrow {
  id: string;
  transactionId: string;
  amount: number;
  fromUserId: string;
  toUserId: string;
  artId: string;
  status: "pending" | "completed" | "released" | "refunded";
  releasedAt?: string;
  createdAt: string;
}

export interface ArtistRoyalty {
  id: string;
  artistId: string;
  artId: string;
  transactionId: string;
  rate: number; // percentage (e.g., 10)
  amount: number;
  status: "pending" | "paid";
  createdAt: string;
  paidAt?: string;
}

export interface AdminEvent {
  id: string;
  action: string;
  adminId: string;
  targetUserId?: string;
  targetArtId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

const USERS_KEY = "artchain_users";
const SESSION_KEY = "artchain_session";
const HOLDINGS_KEY = "artchain_holdings";
const OFFERS_KEY = "artchain_offers";
const SWAPS_KEY = "artchain_swaps";
const ARTWORKS_KEY = "artchain_artworks";
const TRANSACTIONS_KEY = "artchain_transactions";
const ESCROW_KEY = "artchain_escrow";
const ROYALTIES_KEY = "artchain_royalties";
const ADMIN_EVENTS_KEY = "artchain_admin_events";

// Minimal hash — not production-grade, just for local demo
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(
  name: string,
  email: string,
  password: string
): { ok: true; user: User } | { ok: false; error: string } {
  if (getUserByEmail(email)) {
    return { ok: false, error: "An account with that email already exists." };
  }
  const user: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    avatar: getInitials(name),
    walletBalance: 1_240_500,
    artistStatus: "collector",
  };
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

export function verifyCredentials(
  email: string,
  password: string
): { ok: true; user: User } | { ok: false; error: string } {
  const user = getUserByEmail(email);
  if (!user) {
    return { ok: false, error: "No account found with that email." };
  }
  if (user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: "Incorrect password." };
  }
  return { ok: true, user };
}

export function updateUserWalletBalance(
  userId: string,
  nextBalance: number
): { ok: true; user: User } | { ok: false; error: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: "User not found." };
  }

  user.walletBalance = Math.max(0, Math.round(nextBalance));
  saveUsers(users);
  return { ok: true, user };
}

export function applyAsArtist(
  userId: string,
  data: {
    artistType: string;
    artistBio: string;
    portfolioUrl: string;
    socialUrl: string;
    liveLocation: string;
    callUrl: string;
  }
): { ok: true; user: User } | { ok: false; error: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "User not found." };

  user.artistStatus = "pending";
  user.artistType = data.artistType.trim();
  user.artistBio = data.artistBio.trim();
  user.portfolioUrl = data.portfolioUrl.trim();
  user.socialUrl = data.socialUrl.trim();
  user.liveLocation = data.liveLocation.trim();
  user.callUrl = data.callUrl.trim();
  saveUsers(users);
  return { ok: true, user };
}

export function updateArtistStatus(
  userId: string,
  status: "collector" | "pending" | "approved"
): { ok: true; user: User } | { ok: false; error: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "User not found." };

  user.artistStatus = status;
  saveUsers(users);
  return { ok: true, user };
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function createSession(user: User): Session {
  const session: Session = {
    userId: user.id,
    token: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30d
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): { session: Session; user: User } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    const user = getUsers().find((u) => u.id === session.userId);
    if (!user) {
      clearSession();
      return null;
    }
    return { session, user };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ── Holdings ─────────────────────────────────────────────────────────────────

export function getHoldings(userId?: string): UserHolding[] {
  try {
    const holdings = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || "[]") as UserHolding[];
    if (!userId) return holdings;
    return holdings.filter((h) => h.userId === userId);
  } catch {
    return [];
  }
}

function saveHoldings(holdings: UserHolding[]): void {
  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
}

export function getUserHoldings(userId: string) {
  const holdings = getHoldings(userId);
  return {
    owned: holdings.filter((h) => h.status === "owned").length,
    listed: holdings.filter((h) => h.status === "listed").length,
    swapped: holdings.filter((h) => h.status === "swapped").length,
    arts: holdings.filter((h) => h.status === "owned" || h.status === "listed"),
  };
}

export function addHolding(
  userId: string,
  artId: string,
  status: UserHolding["status"] = "owned"
): UserHolding {
  const holding: UserHolding = {
    id: crypto.randomUUID(),
    userId,
    artId,
    status,
    acquiredAt: new Date().toISOString(),
  };
  const holdings = getHoldings();
  holdings.push(holding);
  saveHoldings(holdings);
  return holding;
}

export function updateHoldingStatus(
  holdingId: string,
  status: UserHolding["status"],
  listedPrice?: number
): UserHolding | null {
  const holdings = getHoldings();
  const holding = holdings.find((h) => h.id === holdingId);
  if (!holding) return null;
  holding.status = status;
  if (status === "listed") {
    holding.listedPrice = listedPrice;
    holding.listedAt = new Date().toISOString();
  }
  if (status === "swapped") {
    holding.soldAt = new Date().toISOString();
  }
  saveHoldings(holdings);
  return holding;
}



// ── Offers ───────────────────────────────────────────────────────────────────

export function getOffers(filter?: { artId?: string; buyerId?: string }): Offer[] {
  try {
    let offers = JSON.parse(localStorage.getItem(OFFERS_KEY) || "[]") as Offer[];
    if (filter?.artId) offers = offers.filter((o) => o.artId === filter.artId);
    if (filter?.buyerId) offers = offers.filter((o) => o.buyerId === filter.buyerId);
    return offers;
  } catch {
    return [];
  }
}

function saveOffers(offers: Offer[]): void {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
}

export function createOffer(
  artId: string,
  buyerId: string,
  amount: number,
  expiryDays = 7
): Offer {
  const offer: Offer = {
    id: crypto.randomUUID(),
    artId,
    buyerId,
    amount,
    status: "open",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
  };
  const offers = getOffers();
  offers.push(offer);
  saveOffers(offers);
  return offer;
}

export function updateOfferStatus(
  offerId: string,
  status: Offer["status"]
): Offer | null {
  const offers = getOffers();
  const offer = offers.find((o) => o.id === offerId);
  if (!offer) return null;
  offer.status = status;
  saveOffers(offers);
  return offer;
}

// ── Swaps ────────────────────────────────────────────────────────────────────

export function getSwaps(userId?: string): SwapProposal[] {
  try {
    let swaps = JSON.parse(localStorage.getItem(SWAPS_KEY) || "[]") as SwapProposal[];
    if (userId) {
      swaps = swaps.filter((s) => s.fromUserId === userId || s.toUserId === userId);
    }
    return swaps;
  } catch {
    return [];
  }
}

function saveSwaps(swaps: SwapProposal[]): void {
  localStorage.setItem(SWAPS_KEY, JSON.stringify(swaps));
}

export function proposeSwap(
  fromUserId: string,
  toUserId: string,
  fromArtId: string,
  toArtId: string
): SwapProposal {
  const swap: SwapProposal = {
    id: crypto.randomUUID(),
    fromUserId,
    toUserId,
    fromArtId,
    toArtId,
    status: "proposed",
    createdAt: new Date().toISOString(),
  };
  const swaps = getSwaps();
  swaps.push(swap);
  saveSwaps(swaps);
  return swap;
}

export function updateSwapStatus(
  swapId: string,
  status: SwapProposal["status"]
): SwapProposal | null {
  const swaps = getSwaps();
  const swap = swaps.find((s) => s.id === swapId);
  if (!swap) return null;
  swap.status = status;
  saveSwaps(swaps);
  return swap;
}

// ── Art Transactions ─────────────────────────────────────────────────────────

export function purchaseArt(
  buyerId: string,
  artId: string,
  price: number,
  sellerId?: string
): { holding: UserHolding; success: true } | { success: false; error: string } {
  const users = getUsers();
  const buyer = users.find((u) => u.id === buyerId);
  if (!buyer) return { success: false, error: "Buyer not found." };
  if (buyer.walletBalance < price) return { success: false, error: "Insufficient wallet balance." };

  const existingBuyerHolding = getHoldings(buyerId).find(
    (h) => h.artId === artId && (h.status === "owned" || h.status === "listed")
  );
  if (existingBuyerHolding) return { success: false, error: "Artwork is already in your collection." };

  if (sellerId) {
    const sellerHolding = getHoldings(sellerId).find((h) => h.artId === artId && h.status === "listed");
    if (!sellerHolding) return { success: false, error: "Artwork is no longer listed by this seller." };
  }

  // Add art to buyer's holdings
  const holding = addHolding(buyerId, artId, "owned");

  // Update buyer's wallet
  buyer.walletBalance = Math.max(0, buyer.walletBalance - price);
  saveUsers(users);

  // Update seller's wallet if applicable
  if (sellerId) {
    const seller = users.find((u) => u.id === sellerId);
    if (seller) {
      seller.walletBalance += price * 0.9; // 10% platform fee
      saveUsers(users);
    }

    // Mark seller's holding as sold
    const sellerHoldings = getHoldings(sellerId);
    const sellerHolding = sellerHoldings.find((h) => h.artId === artId);
    if (sellerHolding) {
      updateHoldingStatus(sellerHolding.id, "swapped");
    }
  }

  return { holding, success: true };
}

export function acceptOffer(
  offerId: string,
  sellerId: string,
  artId: string
): { success: boolean; error?: string } {
  const offer = getOffers().find((o) => o.id === offerId);
  if (!offer) return { success: false, error: "Offer not found" };

  // Update offer status
  updateOfferStatus(offerId, "accepted");

  // Execute purchase
  const result = purchaseArt(offer.buyerId, artId, offer.amount, sellerId);
  return result.success ? { success: true } : { success: false, error: result.error };
}

export function initiateResale(
  userId: string,
  artId: string,
  newPrice: number
): UserHolding | null {
  const holdings = getHoldings(userId);
  const holding = holdings.find((h) => h.artId === artId && h.status === "owned");
  if (!holding) return null;

  return updateHoldingStatus(holding.id, "listed", newPrice);
}

// ── Artworks ─────────────────────────────────────────────────────────────────

export function getArtworks(): Art[] {
  try {
    return JSON.parse(localStorage.getItem(ARTWORKS_KEY) || "[]") as Art[];
  } catch {
    return [];
  }
}

function saveArtworks(artworks: Art[]): void {
  localStorage.setItem(ARTWORKS_KEY, JSON.stringify(artworks));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getArtworkById(id: string): Art | undefined {
  return getArtworks().find((a) => a.id === id);
}

export function addArtwork(
  name: string,
  artist: string,
  city: string,
  year: number,
  category: string,
  price: number,
  imageData?: string,
  userId?: string,
  collectionName?: string,
  supplyName?: string
): Art {
  const artwork: Art = {
    id: `custom_${crypto.randomUUID()}`,
    name: name.trim(),
    artist: artist.trim(),
    city: city.trim(),
    year,
    category,
    price,
    image: imageData || "",
    collectionName,
    supplyName,
    token: `0x${Math.random().toString(16).slice(2, 8)}…${Math.random().toString(16).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    isUserCreated: true,
    uniqueId: `ART-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    certificate: {
      id: `CERT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      issuer: "COllectible Vault",
      issuedAt: new Date().toISOString(),
      status: "verified",
    },
    ownershipHistory: [
      {
        title: artist.trim(),
        date: new Date().toISOString(),
        detail: "Artist minted and listed the work on COllectible.",
        reference: "Primary listing",
        value: price,
      },
    ],
    exhibitionHistory: [],
    restorationHistory: [],
    valuationHistory: [
      {
        date: new Date().toISOString(),
        amount: price,
        source: "Initial artist listing",
      },
    ],
  };
  const artworks = getArtworks();
  artworks.push(artwork);
  saveArtworks(artworks);
  return artwork;
}

export function getArtworkOwner(artId: string): { userId: string; userName: string } | null {
  const holdings = getHoldings();
  const ownedHolding = holdings.find((h) => h.artId === artId && h.status === "owned");
  if (!ownedHolding) return null;
  
  const user = getUsers().find((u) => u.id === ownedHolding.userId);
  if (!user) return null;
  
  return { userId: ownedHolding.userId, userName: user.name };
}

// ── Transactions ────────────────────────────────────────────────────────────

function getTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || "[]") as Transaction[];
  } catch {
    return [];
  }
}

function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function createTransaction(
  type: Transaction["type"],
  buyerId: string,
  amount: number,
  options?: {
    sellerId?: string;
    artId?: string;
    commission?: number;
    royalty?: number;
    notes?: string;
  }
): Transaction {
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type,
    buyerId,
    sellerId: options?.sellerId,
    artId: options?.artId,
    amount,
    commission: options?.commission,
    royalty: options?.royalty,
    status: options?.artId ? "escrow" : "pending",
    notes: options?.notes,
    createdAt: new Date().toISOString(),
  };
  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
  return transaction;
}

export function getTransactionHistory(userId?: string, type?: Transaction["type"]): Transaction[] {
  let transactions = getTransactions();
  if (userId) {
    transactions = transactions.filter((t) => t.buyerId === userId || t.sellerId === userId);
  }
  if (type) {
    transactions = transactions.filter((t) => t.type === type);
  }
  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function completeTransaction(
  transactionId: string
): Transaction | null {
  const transactions = getTransactions();
  const transaction = transactions.find((t) => t.id === transactionId);
  if (!transaction) return null;
  transaction.status = "completed";
  transaction.completedAt = new Date().toISOString();
  saveTransactions(transactions);
  return transaction;
}

// ── Escrow ──────────────────────────────────────────────────────────────────

function getEscrows(): Escrow[] {
  try {
    return JSON.parse(localStorage.getItem(ESCROW_KEY) || "[]") as Escrow[];
  } catch {
    return [];
  }
}

function saveEscrows(escrows: Escrow[]): void {
  localStorage.setItem(ESCROW_KEY, JSON.stringify(escrows));
}

export function createEscrow(
  transactionId: string,
  amount: number,
  fromUserId: string,
  toUserId: string,
  artId: string
): Escrow {
  const escrow: Escrow = {
    id: crypto.randomUUID(),
    transactionId,
    amount,
    fromUserId,
    toUserId,
    artId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const escrows = getEscrows();
  escrows.push(escrow);
  saveEscrows(escrows);

  // Update transaction escrowId
  const transactions = getTransactions();
  const transaction = transactions.find((t) => t.id === transactionId);
  if (transaction) {
    transaction.escrowId = escrow.id;
    saveTransactions(transactions);
  }

  return escrow;
}

export function releaseEscrow(escrowId: string): Escrow | null {
  const escrows = getEscrows();
  const escrow = escrows.find((e) => e.id === escrowId);
  if (!escrow) return null;
  
  escrow.status = "released";
  escrow.releasedAt = new Date().toISOString();
  saveEscrows(escrows);

  // Transfer funds from buyer to seller
  const users = getUsers();
  const buyer = users.find((u) => u.id === escrow.fromUserId);
  const seller = users.find((u) => u.id === escrow.toUserId);
  
  if (buyer && seller) {
    // Already deducted from buyer, add to seller
    seller.walletBalance += escrow.amount * 0.9; // 10% platform fee
    saveUsers(users);
  }

  return escrow;
}

export function getEscrowByTransaction(transactionId: string): Escrow | null {
  const escrows = getEscrows();
  return escrows.find((e) => e.transactionId === transactionId) || null;
}

// ── Artist Royalties ────────────────────────────────────────────────────────

function getRoyalties(): ArtistRoyalty[] {
  try {
    return JSON.parse(localStorage.getItem(ROYALTIES_KEY) || "[]") as ArtistRoyalty[];
  } catch {
    return [];
  }
}

function saveRoyalties(royalties: ArtistRoyalty[]): void {
  localStorage.setItem(ROYALTIES_KEY, JSON.stringify(royalties));
}

export function createRoyalty(
  artistId: string,
  artId: string,
  transactionId: string,
  rate: number,
  amount: number
): ArtistRoyalty {
  const royalty: ArtistRoyalty = {
    id: crypto.randomUUID(),
    artistId,
    artId,
    transactionId,
    rate,
    amount,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const royalties = getRoyalties();
  royalties.push(royalty);
  saveRoyalties(royalties);
  return royalty;
}

export function payRoyalty(royaltyId: string): ArtistRoyalty | null {
  const royalties = getRoyalties();
  const royalty = royalties.find((r) => r.id === royaltyId);
  if (!royalty) return null;

  // Pay artist
  const users = getUsers();
  const artist = users.find((u) => u.id === royalty.artistId);
  if (artist) {
    artist.walletBalance += royalty.amount;
    saveUsers(users);
  }

  royalty.status = "paid";
  royalty.paidAt = new Date().toISOString();
  saveRoyalties(royalties);
  return royalty;
}

export function getArtistRoyalties(artistId: string): ArtistRoyalty[] {
  const royalties = getRoyalties();
  return royalties.filter((r) => r.artistId === artistId);
}

export function getTotalPendingRoyalties(artistId: string): number {
  const royalties = getArtistRoyalties(artistId);
  return royalties
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0);
}

// ── Admin Events ────────────────────────────────────────────────────────────

function getAdminEvents(): AdminEvent[] {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_EVENTS_KEY) || "[]") as AdminEvent[];
  } catch {
    return [];
  }
}

function saveAdminEvents(events: AdminEvent[]): void {
  localStorage.setItem(ADMIN_EVENTS_KEY, JSON.stringify(events));
}

export function logAdminEvent(
  action: string,
  adminId: string,
  details: Record<string, unknown>,
  options?: { targetUserId?: string; targetArtId?: string }
): AdminEvent {
  const event: AdminEvent = {
    id: crypto.randomUUID(),
    action,
    adminId,
    targetUserId: options?.targetUserId,
    targetArtId: options?.targetArtId,
    details,
    createdAt: new Date().toISOString(),
  };
  const events = getAdminEvents();
  events.push(event);
  saveAdminEvents(events);
  return event;
}

export function getAdminEventHistory(limit = 100): AdminEvent[] {
  const events = getAdminEvents();
  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

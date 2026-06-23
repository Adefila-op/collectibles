const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';

export type OpenSeaMarketplaceListing = {
  id: string;
  source: 'opensea';
  tag: 'Digital Art';
  collectionSlug: string;
  collectionName: string;
  name: string;
  tokenId: string;
  contract: string;
  chain: string;
  image: string;
  price: string;
  currency: string;
  priceUsd?: string;
  orderHash: string;
  protocolAddress?: string;
  owner?: string;
  openseaUrl: string;
};

const curatedCollections = [
  { slug: 'art-blocks', name: 'Art Blocks' },
  { slug: 'chromie-squiggle-by-snowfro', name: 'Chromie Squiggle' },
  { slug: 'boredapeyachtclub', name: 'Bored Ape Yacht Club' },
  { slug: 'azuki', name: 'Azuki' },
];

function getOpenSeaHeaders() {
  const apiKey = undefined;
  if (!apiKey) {
    throw new Error('OPENSEA_API_KEY is not configured');
  }

  return {
    accept: 'application/json',
    'x-api-key': apiKey,
  };
}

function formatPrice(listing: any) {
  const current = listing?.price?.current;
  const value = current?.value;
  const decimals = Number(current?.decimals ?? 18);
  const currency = current?.currency || current?.symbol || 'ETH';

  if (!value) {
    return { price: '0', currency };
  }

  const numericValue = Number(value) / 10 ** decimals;
  return {
    price: Number.isFinite(numericValue) ? numericValue.toFixed(4).replace(/\.?0+$/, '') : '0',
    currency,
    priceUsd: current?.usd,
  };
}

function mapListing(listing: any, fallbackCollection: { slug: string; name: string }): OpenSeaMarketplaceListing | null {
  const protocolData = listing?.protocol_data?.parameters;
  const offer = protocolData?.offer?.[0];
  const nft = listing?.asset || listing?.item || listing?.nft || {};
  const contract = nft?.contract || offer?.token || '';
  const tokenId = nft?.identifier || nft?.token_id || offer?.identifierOrCriteria || '';
  const orderHash = listing?.order_hash || listing?.orderHash || '';

  if (!contract || !tokenId || !orderHash) {
    return null;
  }

  const collectionSlug = nft?.collection || listing?.collection?.slug || fallbackCollection.slug;
  const collectionName = listing?.collection?.name || fallbackCollection.name;
  const { price, currency, priceUsd } = formatPrice(listing);

  return {
    id: `opensea-${collectionSlug}-${contract}-${tokenId}-${orderHash}`,
    source: 'opensea',
    tag: 'Digital Art',
    collectionSlug,
    collectionName,
    name: nft?.name || `${collectionName} #${tokenId}`,
    tokenId,
    contract,
    chain: listing?.chain || nft?.chain || 'ethereum',
    image: nft?.image_url || nft?.display_image_url || nft?.image || '',
    price,
    currency,
    priceUsd,
    orderHash,
    protocolAddress: listing?.protocol_address,
    owner: listing?.maker?.address,
    openseaUrl: `https://opensea.io/assets/${listing?.chain || 'ethereum'}/${contract}/${tokenId}`,
  };
}

export async function fetchOpenSeaListings(limitPerCollection = 4) {
  const headers = getOpenSeaHeaders();
  const selectedCollections = curatedCollections.slice(0, 4);
  const results = await Promise.allSettled(
    selectedCollections.map(async (collection) => {
      const url = new URL(`${OPENSEA_BASE_URL}/listings/collection/${collection.slug}/best`);
      url.searchParams.set('limit', String(limitPerCollection));

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`OpenSea ${collection.slug} failed with ${response.status}`);
      }

      const payload = await response.json();
      const listings = Array.isArray(payload?.listings) ? payload.listings : [];
      return listings
        .map((listing: any) => mapListing(listing, collection))
        .filter(Boolean) as OpenSeaMarketplaceListing[];
    })
  );

  const listings = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

  if (listings.length === 0 && failures.length > 0) {
    const details = failures
      .map((failure) => failure.reason instanceof Error ? failure.reason.message : String(failure.reason))
      .join('; ');
    throw new Error(`OpenSea returned no listings. ${details}`);
  }

  return listings;
}

export async function getOpenSeaFulfillmentData(body: any) {
  const headers = getOpenSeaHeaders();
  const response = await fetch(`${OPENSEA_BASE_URL}/listings/fulfillment_data`, {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenSea fulfillment failed with ${response.status}: ${detail}`);
  }

  return response.json();
}

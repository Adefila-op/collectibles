# Base Testnet Certificate NFT Deployment Guide

This guide walks through deploying the CertificateNFT contract to Base Sepolia Testnet.

## Prerequisites

1. **MetaMask or similar wallet** with Base Sepolia testnet configured
2. **Testnet ETH** on Base Sepolia (get from [Base faucet](https://www.coinbase.com/en/developer-platform/guides/base-testnet-faucet))
3. **Hardhat** or **Foundry** for contract deployment

## Network Configuration

**Base Sepolia Testnet:**
- Network ID: 84532
- RPC URL: https://sepolia.base.org
- Block Explorer: https://sepolia.basescan.org
- Chain ID: 84532

## Deployment with Hardhat

### 1. Install Dependencies
```bash
npm install hardhat @openzeppelin/contracts dotenv
npx hardhat init
```

### 2. Create `hardhat.config.js`
```javascript
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    baseSepolia: {
      url: process.env.BASE_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 84532,
    },
  },
};
```

### 3. Create Deploy Script (`scripts/deploy.js`)
```javascript
const hre = require("hardhat");

async function main() {
  const CertificateNFT = await hre.ethers.getContractFactory("CertificateNFT");
  const contract = await CertificateNFT.deploy();
  await contract.deployed();

  console.log("✅ Certificate NFT deployed to:", contract.address);
  console.log("\n📝 Add this to .env.local:");
  console.log(`CERTIFICATE_CONTRACT_ADDRESS=${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 4. Deploy
```bash
# Add DEPLOYER_PRIVATE_KEY to .env.local (wallet private key)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

### 5. Verify Contract (Optional)
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

## Deployment with Foundry

### 1. Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Create `.env`
```bash
BASE_RPC_URL=https://sepolia.base.org
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### 3. Deploy
```bash
forge create contracts/CertificateNFT.sol:CertificateNFT \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

## Verify Deployment

After deployment, update `.env.local`:

```env
CERTIFICATE_CONTRACT_ADDRESS=0x... # Contract address from deployment
```

Test the contract on Block Explorer:
- Visit: https://sepolia.basescan.org/address/0x...
- You should see the contract code verified

## Testing Minting

Once deployed, test minting through the API:

```bash
curl -X POST http://localhost:3000/api/artwork-submissions/123/approve \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "admin-user-id",
    "adminNotes": "Verified authentic"
  }'
```

This will:
1. Mark artwork submission as approved
2. Mint a certificate NFT to the artwork owner
3. Store the transaction hash and token ID

## Contract Functions

### `mint(address to, string artworkId, string artistAddress, string metadataUri)`
Mint a new certificate for verified artwork.

**Parameters:**
- `to`: Owner address
- `artworkId`: Unique artwork identifier
- `artistAddress`: Artist's wallet address
- `metadataUri`: IPFS/Arweave URI with metadata

**Returns:** Token ID

### `transferFrom(address from, address to, uint256 tokenId)`
Transfer certificate NFT (inherited from ERC721).

### `tokenURI(uint256 tokenId)`
Get metadata URI for certificate.

### `isAuthenticated(uint256 tokenId)`
Check if certificate is verified.

## Production Deployment

For production (Base mainnet):

1. Deploy to mainnet instead of testnet
2. Use a dedicated deployer wallet with production keys
3. Set `CERTIFICATE_CONTRACT_ADDRESS` in production `.env`
4. Consider deploying through a multisig wallet for security
5. Verify contract on [BaseScan](https://basescan.org)

## Security Notes

⚠️ **Never commit private keys to version control**
- Use `.env` files (add to `.gitignore`)
- Use hardware wallets for production
- Test thoroughly on testnet first

## Troubleshooting

### "Transaction failed"
- Check you have sufficient testnet ETH
- Verify RPC endpoint is working
- Check gas estimation

### "Contract already exists"
- Each deployment creates a new contract
- Get testnet ETH from Base faucet if needed

### "Verification failed"
- Ensure Solidity version matches (0.8.19)
- Use `--compiler-version` flag if needed

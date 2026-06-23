import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { query } from './db';

/**
 * NFT Contract Deployment Service
 * 
 * Architecture:
 * - Artists deploy their own ERC721/ERC1155 contracts
 * - Artist becomes the contract deployer and owner
 * - Platform provides wallet management and gas fee handling
 * - Users deposit funds into platform wallet to purchase NFTs
 */

// RPC endpoints
const RPC_ENDPOINTS = {
  base: 'https://sepolia.base.org',
  ethereum: 'https://eth.rpc.blxrbdn.com',
  polygon: 'https://polygon-rpc.com',
};

// Simple ERC721 contract bytecode for deployment
const ERC721_BYTECODE = `
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ArtCollection is ERC721, Ownable, ERC721Enumerable {
  uint256 private tokenCounter = 0;
  string private _baseTokenURI;
  
  constructor(string memory _name, string memory _symbol, string memory baseURI) 
    ERC721(_name, _symbol) {
    _baseTokenURI = baseURI;
  }
  
  function mint(address to, string memory uri) public onlyOwner returns (uint256) {
    uint256 tokenId = tokenCounter++;
    _safeMint(to, tokenId);
    return tokenId;
  }
  
  function _baseURI() internal view override returns (string memory) {
    return _baseTokenURI;
  }
  
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }
  
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
`;

/**
 * Deploy an ERC721 contract for an artist
 * Artist must have sufficient balance for gas fees
 */
export async function deployArtistContract(
  artistId: string,
  artistWalletPrivateKey: string,
  contractName: string,
  contractSymbol: string,
  baseURIForMetadata: string,
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<{
  contractAddress: string;
  deploymentHash: string;
  deploymentChain: string;
  gasCost: string;
  deployer: string;
}> {
  try {
    if (!artistWalletPrivateKey) {
      throw new Error('Artist wallet private key required for contract deployment');
    }

    const rpcUrl = RPC_ENDPOINTS[chain];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(artistWalletPrivateKey, provider);
    
    // Verify artist owns this wallet
    const result = await query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [artistId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Artist not found');
    }
    
    const registeredAddress = result.rows[0].wallet_address;
    if (wallet.address.toLowerCase() !== registeredAddress.toLowerCase()) {
      throw new Error('Wallet does not match artist registration');
    }

    // Check artist has sufficient balance for gas
    const balance = await provider.getBalance(wallet.address);
    const estimatedGas = ethers.parseEther('0.1'); // Rough estimate for deployment
    
    if (balance < estimatedGas) {
      throw new Error(
        `Insufficient balance. Have: ${ethers.formatEther(balance)} ETH, ` +
        `need: ${ethers.formatEther(estimatedGas)} ETH for deployment`
      );
    }

    // For now, return a mock deployment
    // In production, you'd compile and deploy the actual contract
    const deploymentHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    const contractAddress = ethers.getAddress(
      `0x${crypto.randomBytes(20).toString('hex')}`
    );
    
    const gasCost = ethers.formatEther(estimatedGas);

    // Store contract info in database
    await query(
      `INSERT INTO nft_contracts (artist_id, contract_address, contract_name, 
        contract_symbol, deployment_chain, deployment_hash, deployer_address, 
        base_uri, gas_cost_eth, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (contract_address) DO NOTHING`,
      [
        artistId,
        contractAddress,
        contractName,
        contractSymbol,
        chain,
        deploymentHash,
        wallet.address,
        baseURIForMetadata,
        gasCost,
        'deployed',
      ]
    );

    return {
      contractAddress,
      deploymentHash,
      deploymentChain: chain,
      gasCost,
      deployer: wallet.address,
    };
  } catch (error: any) {
    console.error('Contract deployment error:', error);
    throw error;
  }
}

/**
 * Get artist's deployed contracts
 */
export async function getArtistContracts(
  artistId: string
): Promise<Array<{
  contractAddress: string;
  contractName: string;
  contractSymbol: string;
  deploymentChain: string;
  deploymentHash: string;
  deployedAt: string;
  status: string;
}>> {
  try {
    const result = await query(
      `SELECT 
        contract_address,
        contract_name,
        contract_symbol,
        deployment_chain,
        deployment_hash,
        created_at,
        status
       FROM nft_contracts
       WHERE artist_id = $1
       ORDER BY created_at DESC`,
      [artistId]
    );

    return result.rows.map(row => ({
      contractAddress: row.contract_address,
      contractName: row.contract_name,
      contractSymbol: row.contract_symbol,
      deploymentChain: row.deployment_chain,
      deploymentHash: row.deployment_hash,
      deployedAt: row.created_at,
      status: row.status,
    }));
  } catch (error: any) {
    console.error('Error fetching artist contracts:', error);
    throw error;
  }
}

/**
 * Mint NFT from artist's deployed contract
 * Artist remains owner of contract, mints to user
 */
export async function mintNFTFromContract(
  contractAddress: string,
  artistId: string,
  artistWalletPrivateKey: string,
  recipientAddress: string,
  metadataURI: string,
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<{
  transactionHash: string;
  tokenId: string;
  mintedTo: string;
  contractAddress: string;
}> {
  try {
    // Verify artist owns this contract
    const contractResult = await query(
      `SELECT * FROM nft_contracts 
       WHERE contract_address = $1 AND artist_id = $2`,
      [contractAddress, artistId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error('Contract not found or not owned by artist');
    }

    const rpcUrl = RPC_ENDPOINTS[chain];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(artistWalletPrivateKey, provider);

    // Verify wallet matches
    const userResult = await query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [artistId]
    );

    if (wallet.address.toLowerCase() !== userResult.rows[0].wallet_address.toLowerCase()) {
      throw new Error('Wallet does not match artist');
    }

    // For now, return mock mint
    // In production: interact with deployed contract via ethers.js
    const tokenId = Math.floor(Math.random() * 1000000).toString();
    const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;

    // Record mint in database
    await query(
      `INSERT INTO nft_mints (contract_address, token_id, minted_to, minted_from,
        artist_id, transaction_hash, metadata_uri, chain)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        contractAddress,
        tokenId,
        recipientAddress,
        wallet.address,
        artistId,
        transactionHash,
        metadataURI,
        chain,
      ]
    );

    return {
      transactionHash,
      tokenId,
      mintedTo: recipientAddress,
      contractAddress,
    };
  } catch (error: any) {
    console.error('NFT minting error:', error);
    throw error;
  }
}

/**
 * Transfer NFT ownership on-chain
 * Used when artwork is sold to transfer certificate to new owner
 */
export async function transferNFT(
  contractAddress: string,
  tokenId: string,
  fromAddress: string,
  toAddress: string,
  fromPrivateKey: string,
  chain: 'base' | 'ethereum' | 'polygon' = 'base'
): Promise<{
  transactionHash: string;
  from: string;
  to: string;
  tokenId: string;
}> {
  try {
    const rpcUrl = RPC_ENDPOINTS[chain];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(fromPrivateKey, provider);

    if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
      throw new Error('Wallet does not match from address');
    }

    // For now, return mock transfer
    // In production: call contract.transferFrom() via ethers.js
    const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;

    // Record transfer
    await query(
      `INSERT INTO nft_transfers (contract_address, token_id, from_address, 
        to_address, transaction_hash, chain)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [contractAddress, tokenId, fromAddress, toAddress, transactionHash, chain]
    );

    return {
      transactionHash,
      from: fromAddress,
      to: toAddress,
      tokenId,
    };
  } catch (error: any) {
    console.error('NFT transfer error:', error);
    throw error;
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CertificateNFT
 * @dev Art certificate provenance NFT on Base blockchain
 * 
 * This contract manages artwork authentication certificates as NFTs.
 * Each artwork that passes artist verification gets an NFT certificate
 * that represents verified authenticity and provenance.
 */
contract CertificateNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // Metadata for each certificate
    struct Certificate {
        string artworkId;
        string artistAddress;
        string metadataUri;
        uint256 issuedAt;
        bool authenticalityVerified;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(string => uint256) public artworkToCertificate;

    event CertificateMinted(
        uint256 indexed tokenId,
        string artworkId,
        address indexed owner,
        string metadataUri
    );

    event CertificateTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    constructor() ERC721("Art Certificate", "CERT") {}

    /**
     * Mint a new certificate NFT
     * @param to The address that will own the certificate
     * @param artworkId Unique identifier for the artwork
     * @param artistAddress Address of the artist
     * @param metadataUri URI pointing to certificate metadata
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(
        address to,
        string memory artworkId,
        string memory artistAddress,
        string memory metadataUri
    ) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(artworkId).length > 0, "Artwork ID required");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        certificates[tokenId] = Certificate({
            artworkId: artworkId,
            artistAddress: artistAddress,
            metadataUri: metadataUri,
            issuedAt: block.timestamp,
            authenticalityVerified: true
        });

        artworkToCertificate[artworkId] = tokenId;

        _safeMint(to, tokenId);

        emit CertificateMinted(tokenId, artworkId, to, metadataUri);

        return tokenId;
    }

    /**
     * Override _beforeTokenTransfer to emit custom event
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        if (from != address(0) && to != address(0)) {
            emit CertificateTransferred(firstTokenId, from, to);
        }
    }

    /**
     * Get certificate metadata
     * @param tokenId The token ID
     * @return The certificate data
     */
    function getCertificate(uint256 tokenId)
        public
        view
        returns (Certificate memory)
    {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }

    /**
     * Get certificate by artwork ID
     * @param artworkId The artwork identifier
     * @return tokenId The token ID of the certificate
     */
    function getCertificateByArtwork(string memory artworkId)
        public
        view
        returns (uint256)
    {
        return artworkToCertificate[artworkId];
    }

    /**
     * Check if a certificate exists for an artwork
     * @param artworkId The artwork identifier
     * @return exists True if a certificate exists
     */
    function certificateExists(string memory artworkId)
        public
        view
        returns (bool)
    {
        uint256 tokenId = artworkToCertificate[artworkId];
        return _exists(tokenId);
    }

    /**
     * Get the URI for token metadata
     * @param tokenId The token ID
     * @return The metadata URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI query for nonexistent token");
        return certificates[tokenId].metadataUri;
    }

    /**
     * Verify a certificate's authenticity
     * @param tokenId The token ID
     * @return True if verified
     */
    function isAuthenticated(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId].authenticalityVerified;
    }
}

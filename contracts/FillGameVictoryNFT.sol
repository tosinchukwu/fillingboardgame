// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract FillGameVictoryNFT is ERC721, Ownable {

    uint256 private _nextTokenId = 1;

    address public tournamentContract;

    string public baseTokenURI =
        "ipfs://bafybeihquy5cgf7egdd3zbhm7ikutzjm3irom3tfg5tfloguusqw5wxmbu/";

    bool public baseURILocked;

    // ──────────────────────────────────────────────
    // Mapping: tokenId → matchId (on-chain record)
    // ──────────────────────────────────────────────
    mapping(uint256 => uint256) public tokenMatchId;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event VictoryNFTMinted(uint256 indexed tokenId, address indexed winner, uint256 indexed matchId);
    event TournamentContractUpdated(address oldContract, address newContract);
    event BaseTokenURIUpdated(string oldURI, string newURI);
    event BaseURILocked();

    // ──────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────

    error NotAuthorizedToMint();
    error InvalidAddress();
    error NotAuthorizedToBurn();
    error BaseURIAlreadyLocked();

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor() ERC721("FillGame Victory", "FGV") Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    // Minting — only callable by the tournament contract
    // ──────────────────────────────────────────────

    function mintVictoryNft(address to, uint256 matchId) external returns (uint256) {
        if (msg.sender != tournamentContract) revert NotAuthorizedToMint();
        if (to == address(0)) revert InvalidAddress();

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);

        tokenMatchId[tokenId] = matchId;

        emit VictoryNFTMinted(tokenId, to, matchId);

        return tokenId;
    }

    // ──────────────────────────────────────────────
    // Burning — owner or approved operator only
    // ──────────────────────────────────────────────

    function burn(uint256 tokenId) external {
        if (!_isAuthorized(ownerOf(tokenId), msg.sender, tokenId)) revert NotAuthorizedToBurn();
        _burn(tokenId);
    }

    // ──────────────────────────────────────────────
    // Configuration
    // ──────────────────────────────────────────────

    function setTournamentContract(address _tournament) external onlyOwner {
        if (_tournament == address(0)) revert InvalidAddress();
        emit TournamentContractUpdated(tournamentContract, _tournament);
        tournamentContract = _tournament;
    }

    function setBaseTokenURI(string calldata _newBaseURI) external onlyOwner {
        if (baseURILocked) revert BaseURIAlreadyLocked();
        emit BaseTokenURIUpdated(baseTokenURI, _newBaseURI);
        baseTokenURI = _newBaseURI;
    }

    // Call this when metadata is final — permanently locks the base URI
    function lockBaseURI() external onlyOwner {
        if (baseURILocked) revert BaseURIAlreadyLocked();
        if (bytes(baseTokenURI).length == 0) revert("Base URI not set");
        baseURILocked = true;
        emit BaseURILocked();
    }

    // ──────────────────────────────────────────────
    // URI Logic
    // ──────────────────────────────────────────────

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseURI(), Strings.toString(tokenId), ".json"));
    }

    // ──────────────────────────────────────────────
    // View Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Check if a token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // ──────────────────────────────────────────────
    // Interface Support
    // ──────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ──────────────────────────────────────────────
    // Override
    // ──────────────────────────────────────────────

    /**
     * @notice Prevent renouncing ownership
     */
    function renounceOwnership() public override onlyOwner {
        revert("Cannot renounce ownership");
    }
}

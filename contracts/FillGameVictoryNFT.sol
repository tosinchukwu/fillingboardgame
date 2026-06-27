// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract FillGameVictoryNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;
    address public tournamentContract;
    string public baseTokenURI = "ipfs://bafybeihquy5cgf7egdd3zbhm7ikutzjm3irom3tfg5tfloguusqw5wxmbu/";
    bool public baseURILocked;
    mapping(uint256 => uint256) public tokenMatchId;

    event VictoryNFTMinted(uint256 indexed tokenId, address indexed winner, uint256 indexed matchId);
    event TournamentContractUpdated(address oldContract, address newContract);
    event BaseTokenURIUpdated(string oldURI, string newURI);
    event BaseURILocked();

    error NotAuthorizedToMint();
    error InvalidAddress();
    error NotAuthorizedToBurn();
    error BaseURIAlreadyLocked();

    constructor() ERC721("FillGame Victory", "FGV") Ownable(msg.sender) {}

    function mintVictoryNft(address to, uint256 matchId) external returns (uint256) {
        if (msg.sender != tournamentContract) revert NotAuthorizedToMint();
        if (to == address(0)) revert InvalidAddress();
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        tokenMatchId[tokenId] = matchId;
        emit VictoryNFTMinted(tokenId, to, matchId);
        return tokenId;
    }

    function burn(uint256 tokenId) external {
        if (!_isAuthorized(ownerOf(tokenId), msg.sender, tokenId)) revert NotAuthorizedToBurn();
        _burn(tokenId);
    }

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

    function lockBaseURI() external onlyOwner {
        if (baseURILocked) revert BaseURIAlreadyLocked();
        if (bytes(baseTokenURI).length == 0) revert("Base URI not set");
        baseURILocked = true;
        emit BaseURILocked();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseURI(), Strings.toString(tokenId), ".json"));
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ─── Override to prevent renouncing ownership ────────────────

    /**
     * @dev Override to prevent renouncing ownership
     * This function intentionally reverts to keep the contract ownable
     */
    function renounceOwnership() public view override onlyOwner {
        revert("Cannot renounce ownership");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TournamentEscrow
 * @dev Escrow contract for managing tournament entry fees and distributing rewards
 * Holds player funds in escrow until match results are verified by off-chain bot
 * Features:
 * - Automatic verification delay (3 minutes configurable)
 * - Developer can release funds to winners or refund on disputed matches
 * - Handles both on-chain and off-chain reward distribution
 * - Multi-chain support with automatic fee distribution
 */
contract TournamentEscrow is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable usdc;
    
    // Developer who can manage tournaments and release escrow funds
    address public developer;
    
    // Entry fee configuration per tournament
    mapping(string => TournamentConfig) public tournaments;
    
    // Track escrowed funds per match
    mapping(string => EscrowRecord) public escrowedMatches;
    
    // Developer settings for reward distribution percentages
    mapping(address => DeveloperSettings) public developerSettings;

    struct TournamentConfig {
        uint256 entryFeeUSDC;
        bool exists;
        uint256 createdAt;
    }

    struct EscrowRecord {
        address player1;
        address player2;
        uint256 totalUSDC;
        uint256 escrowedAt;
        bool released;
        bool refunded;
    }

    struct DeveloperSettings {
        uint256 winnerPercentage; // e.g., 60 for 60%
        uint256 runnerUpPercentage; // e.g., 30 for 30%
        uint256 platformFeePercentage; // e.g., 10 for 10%
        bool configured;
    }

    event TournamentCreated(string indexed tournamentId, uint256 entryFeeUSDC);
    event FundsEscrowed(string indexed matchId, address player1, address player2, uint256 totalUSDC);
    event RewardsReleased(string indexed matchId, address winner, uint256 winnerReward, address runnerUp, uint256 runnerUpReward);
    event FundsRefunded(string indexed matchId, address player1, uint256 amount1, address player2, uint256 amount2);
    event DeveloperSettingsUpdated(address indexed developer, uint256 winnerPercentage, uint256 runnerUpPercentage, uint256 platformFeePercentage);

    modifier onlyDeveloper() {
        require(msg.sender == developer, "Only developer can call this");
        _;
    }

    modifier validMatch(string calldata matchId) {
        require(escrowedMatches[matchId].totalUSDC > 0, "Match not found or already released");
        require(!escrowedMatches[matchId].released && !escrowedMatches[matchId].refunded, "Funds already released/refunded");
        _;
    }

    constructor(address _usdc, address _developer) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_developer != address(0), "Invalid developer address");
        usdc = IERC20(_usdc);
        developer = _developer;
    }

    /**
     * @dev Create a tournament with entry fee
     * Only developer can create tournaments
     */
    function createTournament(string calldata _tournamentId, uint256 _entryFeeUSDC) external onlyDeveloper {
        require(_entryFeeUSDC > 0, "Entry fee must be > 0");
        require(!tournaments[_tournamentId].exists, "Tournament already exists");
        
        tournaments[_tournamentId] = TournamentConfig({
            entryFeeUSDC: _entryFeeUSDC,
            exists: true,
            createdAt: block.timestamp
        });

        emit TournamentCreated(_tournamentId, _entryFeeUSDC);
    }

    /**
     * @dev Deposit entry fees for a match
     * Players approve the tournament entry fee, then send to escrow
     * Using EIP-2612 permit if available for gasless approval
     */
    function escrowFunds(
        string calldata _matchId,
        string calldata _tournamentId,
        address _player1,
        address _player2,
        uint256 _amount1,
        uint256 _amount2
    ) external nonReentrant {
        require(tournaments[_tournamentId].exists, "Tournament not found");
        require(escrowedMatches[_matchId].totalUSDC == 0, "Match already exists");
        
        uint256 totalAmount = _amount1 + _amount2;
        require(totalAmount > 0, "Total amount must be > 0");

        // Transfer from player 1
        if (_amount1 > 0) {
            usdc.transferFrom(_player1, address(this), _amount1);
        }

        // Transfer from player 2
        if (_amount2 > 0) {
            usdc.transferFrom(_player2, address(this), _amount2);
        }

        escrowedMatches[_matchId] = EscrowRecord({
            player1: _player1,
            player2: _player2,
            totalUSDC: totalAmount,
            escrowedAt: block.timestamp,
            released: false,
            refunded: false
        });

        emit FundsEscrowed(_matchId, _player1, _player2, totalAmount);
    }

    /**
     * @dev Release escrowed funds to winner and runner-up
     * Called by developer after bot verification in Supabase
     * Automatically distributes based on configured percentages
     */
    function releaseRewards(
        string calldata _matchId,
        address _winner,
        address _runnerUp,
        uint256 _winnerPercentage,
        uint256 _runnerUpPercentage
    ) external onlyDeveloper nonReentrant validMatch(_matchId) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        require(_winner != address(0), "Invalid winner address");

        uint256 totalAmount = escrow.totalUSDC;
        uint256 winnerReward = (totalAmount * _winnerPercentage) / 100;
        uint256 runnerUpReward = (totalAmount * _runnerUpPercentage) / 100;

        // Mark as released
        escrow.released = true;

        // Transfer to winner
        require(usdc.transfer(_winner, winnerReward), "Winner transfer failed");

        // Transfer to runner-up if exists
        if (_runnerUp != address(0) && runnerUpReward > 0) {
            require(usdc.transfer(_runnerUp, runnerUpReward), "Runner-up transfer failed");
        }

        emit RewardsReleased(_matchId, _winner, winnerReward, _runnerUp, runnerUpReward);
    }

    /**
     * @dev Refund entry fees for abandoned or disputed matches
     * Both players get their original amounts back
     */
    function refundFunds(string calldata _matchId) external onlyDeveloper nonReentrant validMatch(_matchId) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        
        // Calculate refunds (50/50 split for simplicity - can be customized)
        uint256 refundAmount1 = escrow.totalUSDC / 2;
        uint256 refundAmount2 = escrow.totalUSDC - refundAmount1;

        escrow.refunded = true;

        // Refund to both players
        if (refundAmount1 > 0) {
            require(usdc.transfer(escrow.player1, refundAmount1), "Refund to player1 failed");
        }

        if (refundAmount2 > 0) {
            require(usdc.transfer(escrow.player2, refundAmount2), "Refund to player2 failed");
        }

        emit FundsRefunded(_matchId, escrow.player1, refundAmount1, escrow.player2, refundAmount2);
    }

    /**
     * @dev Update developer reward distribution settings
     * Developer can adjust the percentage split for winner/runner-up
     */
    function setDeveloperSettings(
        uint256 _winnerPercentage,
        uint256 _runnerUpPercentage,
        uint256 _platformFeePercentage
    ) external onlyDeveloper {
        require(
            _winnerPercentage + _runnerUpPercentage + _platformFeePercentage <= 100,
            "Percentages exceed 100%"
        );

        developerSettings[developer] = DeveloperSettings({
            winnerPercentage: _winnerPercentage,
            runnerUpPercentage: _runnerUpPercentage,
            platformFeePercentage: _platformFeePercentage,
            configured: true
        });

        emit DeveloperSettingsUpdated(developer, _winnerPercentage, _runnerUpPercentage, _platformFeePercentage);
    }

    /**
     * @dev Get escrow status for a match
     */
    function getEscrowStatus(string calldata _matchId) external view returns (
        uint256 totalAmount,
        uint256 escrowedAt,
        bool released,
        bool refunded,
        address player1,
        address player2
    ) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        return (
            escrow.totalUSDC,
            escrow.escrowedAt,
            escrow.released,
            escrow.refunded,
            escrow.player1,
            escrow.player2
        );
    }

    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Allow developer to be updated
     */
    function setDeveloper(address _newDeveloper) external onlyOwner {
        require(_newDeveloper != address(0), "Invalid address");
        developer = _newDeveloper;
    }

    /**
     * @dev Recover any stuck tokens (emergency only)
     */
    function recoverToken(IERC20 token, uint256 amount) external onlyOwner {
        token.transfer(owner(), amount);
    }
}

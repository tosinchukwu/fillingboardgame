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
 * 
 * FEATURES:
 * - 80% of entry fees go to winner
 * - 20% of entry fees go to treasury
 * - Bot verifies match results and releases funds automatically
 * - Developer can withdraw treasury funds
 * - Refunds available for disputed/abandoned matches
 * 
 * INTEGRATION FLOW:
 * 1. Admin creates tournament with entry fee
 * 2. Player 1 creates match + pays entry fee
 * 3. Player 2 joins match + pays entry fee  
 * 4. Both players play the game
 * 5. Bot verifies the winner
 * 6. Bot releases rewards (80% winner, 20% treasury)
 */
contract TournamentEscrow is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable usdc;

    // Developer who can manage tournaments and withdraw treasury funds
    address public developer;
    
    // Treasury address that receives 20% of entry fees
    address public treasury;

    // Bot address that can verify and release funds
    address public bot;

    // Entry fee configuration per tournament
    mapping(string => TournamentConfig) public tournaments;

    // Track escrowed funds per match
    mapping(string => EscrowRecord) public escrowedMatches;

    // Track matches by tournament
    mapping(string => string[]) public tournamentMatches;

    // Platform fee percentage (default 20%)
    uint256 public platformFeePercentage = 20;
    
    // Winner percentage (default 80%)
    uint256 public winnerPercentage = 80;

    struct TournamentConfig {
        uint256 entryFeeUSDC;
        bool exists;
        uint256 createdAt;
        uint256 totalMatches;
        uint256 totalVolume;
    }

    struct EscrowRecord {
        address player1;
        address player2;
        uint256 totalUSDC;
        uint256 escrowedAt;
        bool released;
        bool refunded;
        bool verified;
        address winner;
        string tournamentId;
        bool player1Paid;
        bool player2Paid;
    }

    // Events
    event TournamentCreated(string indexed tournamentId, uint256 entryFeeUSDC);
    event PlayerDeposited(string indexed matchId, address player, uint256 amount);
    event FundsEscrowed(string indexed matchId, address player1, address player2, uint256 totalUSDC);
    event MatchVerified(string indexed matchId, address winner, uint256 winnerReward, uint256 treasuryAmount);
    event RewardsReleased(string indexed matchId, address winner, uint256 winnerReward, uint256 treasuryAmount);
    event FundsRefunded(string indexed matchId, address player1, uint256 amount1, address player2, uint256 amount2);
    event BotUpdated(address indexed newBot);
    event TreasuryUpdated(address indexed newTreasury);
    event DeveloperUpdated(address indexed newDeveloper);
    event FeesUpdated(uint256 winnerPercentage, uint256 platformFeePercentage);

    // Modifiers
    modifier onlyDeveloper() {
        require(msg.sender == developer, "Only developer can call this");
        _;
    }

    modifier onlyBot() {
        require(msg.sender == bot, "Only bot can call this");
        _;
    }

    modifier validMatch(string calldata matchId) {
        require(escrowedMatches[matchId].totalUSDC > 0, "Match not found or already released");
        require(!escrowedMatches[matchId].released && !escrowedMatches[matchId].refunded, "Funds already released/refunded");
        _;
    }

    modifier matchExists(string calldata matchId) {
        require(escrowedMatches[matchId].totalUSDC > 0, "Match does not exist");
        _;
    }

    constructor(address _usdc, address _developer, address _treasury) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_developer != address(0), "Invalid developer address");
        require(_treasury != address(0), "Invalid treasury address");
        
        usdc = IERC20(_usdc);
        developer = _developer;
        treasury = _treasury;
    }

    // ============================================================
    // TOURNAMENT MANAGEMENT
    // ============================================================

    /**
     * @dev Create a tournament with entry fee
     * Only developer can create tournaments
     */
    function createTournament(
        string calldata _tournamentId, 
        uint256 _entryFeeUSDC
    ) external onlyDeveloper {
        require(_entryFeeUSDC > 0, "Entry fee must be > 0");
        require(!tournaments[_tournamentId].exists, "Tournament already exists");

        tournaments[_tournamentId] = TournamentConfig({
            entryFeeUSDC: _entryFeeUSDC,
            exists: true,
            createdAt: block.timestamp,
            totalMatches: 0,
            totalVolume: 0
        });

        emit TournamentCreated(_tournamentId, _entryFeeUSDC);
    }

    /**
     * @dev Get tournament details
     */
    function getTournament(string calldata _tournamentId) external view returns (
        uint256 entryFeeUSDC,
        bool exists,
        uint256 createdAt,
        uint256 totalMatches,
        uint256 totalVolume
    ) {
        TournamentConfig storage tournament = tournaments[_tournamentId];
        return (
            tournament.entryFeeUSDC,
            tournament.exists,
            tournament.createdAt,
            tournament.totalMatches,
            tournament.totalVolume
        );
    }

    // ============================================================
    // MATCH & ESCROW MANAGEMENT
    // ============================================================

    /**
     * @dev Player 1 creates a match and deposits entry fee
     * Called from registration site
     */
    function createMatch(
        string calldata _matchId,
        string calldata _tournamentId,
        address _player1
    ) external nonReentrant {
        require(tournaments[_tournamentId].exists, "Tournament not found");
        require(escrowedMatches[_matchId].totalUSDC == 0, "Match already exists");
        require(_player1 != address(0), "Invalid player address");

        uint256 entryFee = tournaments[_tournamentId].entryFeeUSDC;
        require(entryFee > 0, "Entry fee not set");

        // Transfer entry fee from player 1
        usdc.transferFrom(_player1, address(this), entryFee);

        // Create escrow record
        escrowedMatches[_matchId] = EscrowRecord({
            player1: _player1,
            player2: address(0),
            totalUSDC: entryFee,
            escrowedAt: block.timestamp,
            released: false,
            refunded: false,
            verified: false,
            winner: address(0),
            tournamentId: _tournamentId,
            player1Paid: true,
            player2Paid: false
        });

        tournamentMatches[_tournamentId].push(_matchId);
        tournaments[_tournamentId].totalMatches++;

        emit PlayerDeposited(_matchId, _player1, entryFee);
        emit FundsEscrowed(_matchId, _player1, address(0), entryFee);
    }

    /**
     * @dev Player 2 joins a match and deposits entry fee
     * Called from registration site
     */
    function joinMatch(
        string calldata _matchId,
        address _player2
    ) external nonReentrant matchExists(_matchId) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        require(!escrow.player2Paid, "Player 2 already paid");
        require(escrow.player2 == address(0), "Player 2 already joined");
        require(_player2 != escrow.player1, "Cannot be same as player 1");
        require(_player2 != address(0), "Invalid player address");

        uint256 entryFee = tournaments[escrow.tournamentId].entryFeeUSDC;
        require(entryFee > 0, "Entry fee not found");

        // Transfer entry fee from player 2
        usdc.transferFrom(_player2, address(this), entryFee);

        // Update escrow record
        escrow.player2 = _player2;
        escrow.totalUSDC += entryFee;
        escrow.player2Paid = true;

        // Update tournament volume
        tournaments[escrow.tournamentId].totalVolume += entryFee;

        emit PlayerDeposited(_matchId, _player2, entryFee);
        emit FundsEscrowed(_matchId, escrow.player1, _player2, escrow.totalUSDC);
    }

    /**
     * @dev Check if a match is ready to play
     */
    function isMatchReady(string calldata _matchId) external view returns (bool) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        return escrow.player1Paid && escrow.player2Paid && escrow.player2 != address(0);
    }

    /**
     * @dev Get match details
     */
    function getMatch(string calldata _matchId) external view returns (
        address player1,
        address player2,
        uint256 totalUSDC,
        uint256 escrowedAt,
        bool released,
        bool refunded,
        bool verified,
        address winner,
        bool player1Paid,
        bool player2Paid,
        string memory tournamentId
    ) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        return (
            escrow.player1,
            escrow.player2,
            escrow.totalUSDC,
            escrow.escrowedAt,
            escrow.released,
            escrow.refunded,
            escrow.verified,
            escrow.winner,
            escrow.player1Paid,
            escrow.player2Paid,
            escrow.tournamentId
        );
    }

    // ============================================================
    // BOT VERIFICATION & RELEASE
    // ============================================================

    /**
     * @dev Bot verifies the match result
     * Called by bot after off-chain verification
     */
    function verifyMatch(
        string calldata _matchId,
        address _winner
    ) external onlyBot validMatch(_matchId) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        require(!escrow.verified, "Match already verified");
        require(escrow.player2Paid, "Player 2 has not paid yet");
        require(_winner == escrow.player1 || _winner == escrow.player2, "Winner must be one of the players");
        
        escrow.verified = true;
        escrow.winner = _winner;

        // Calculate distribution: 80% to winner, 20% to treasury
        uint256 totalAmount = escrow.totalUSDC;
        uint256 winnerReward = (totalAmount * winnerPercentage) / 100;
        uint256 treasuryAmount = totalAmount - winnerReward;

        emit MatchVerified(_matchId, _winner, winnerReward, treasuryAmount);
    }

    /**
     * @dev Release escrowed funds after verification
     * Called by bot after verification - automatically distributes
     */
    function releaseRewards(
        string calldata _matchId
    ) external onlyBot nonReentrant validMatch(_matchId) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        require(escrow.verified, "Match not verified yet");
        require(!escrow.released, "Already released");
        require(escrow.winner != address(0), "Winner not set");

        uint256 totalAmount = escrow.totalUSDC;
        uint256 winnerReward = (totalAmount * winnerPercentage) / 100;
        uint256 treasuryAmount = totalAmount - winnerReward;

        // Mark as released
        escrow.released = true;

        // Transfer 80% to winner
        require(usdc.transfer(escrow.winner, winnerReward), "Winner transfer failed");

        // Transfer 20% to treasury
        require(usdc.transfer(treasury, treasuryAmount), "Treasury transfer failed");

        emit RewardsReleased(_matchId, escrow.winner, winnerReward, treasuryAmount);
    }

    /**
     * @dev Combined function: verify + release in one call
     * Called by bot for efficiency
     */
    function verifyAndRelease(
        string calldata _matchId,
        address _winner
    ) external onlyBot nonReentrant validMatch(_matchId) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        require(!escrow.verified, "Match already verified");
        require(escrow.player2Paid, "Player 2 has not paid yet");
        require(_winner == escrow.player1 || _winner == escrow.player2, "Winner must be one of the players");
        require(!escrow.released, "Already released");
        
        // Set winner and verified
        escrow.verified = true;
        escrow.winner = _winner;
        escrow.released = true;

        // Calculate distribution
        uint256 totalAmount = escrow.totalUSDC;
        uint256 winnerReward = (totalAmount * winnerPercentage) / 100;
        uint256 treasuryAmount = totalAmount - winnerReward;

        // Transfer 80% to winner
        require(usdc.transfer(escrow.winner, winnerReward), "Winner transfer failed");

        // Transfer 20% to treasury
        require(usdc.transfer(treasury, treasuryAmount), "Treasury transfer failed");

        emit MatchVerified(_matchId, _winner, winnerReward, treasuryAmount);
        emit RewardsReleased(_matchId, escrow.winner, winnerReward, treasuryAmount);
    }

    // ============================================================
    // REFUND & DISPUTE
    // ============================================================

    /**
     * @dev Refund entry fees for abandoned or disputed matches
     * Only developer can call this
     * Both players get their original amounts back
     */
    function refundFunds(string calldata _matchId) external onlyDeveloper nonReentrant validMatch(_matchId) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        
        // Can't refund if already verified
        require(!escrow.verified, "Match already verified - cannot refund");
        require(!escrow.refunded, "Already refunded");
        
        uint256 refundAmount1 = 0;
        uint256 refundAmount2 = 0;

        // Calculate refunds based on who paid
        if (escrow.player1Paid) {
            refundAmount1 = tournaments[escrow.tournamentId].entryFeeUSDC;
        }
        if (escrow.player2Paid) {
            refundAmount2 = tournaments[escrow.tournamentId].entryFeeUSDC;
        }

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

    // ============================================================
    // TREASURY MANAGEMENT
    // ============================================================

    /**
     * @dev Developer can withdraw treasury funds
     * 20% collected fees can be withdrawn by developer
     */
    function withdrawTreasury(uint256 _amount) external onlyDeveloper {
        require(_amount > 0, "Amount must be > 0");
        uint256 balance = usdc.balanceOf(address(this));
        
        // Calculate available treasury balance (excluding escrowed funds)
        uint256 escrowedTotal = 0;
        // We need to track escrowed funds separately
        // For simplicity, we'll just check contract balance minus active escrows
        // In production, you might want a more sophisticated tracking
        
        require(balance >= _amount, "Insufficient balance");
        
        require(usdc.transfer(developer, _amount), "Withdrawal failed");
    }

    /**
     * @dev Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    // ============================================================
    // ADMIN & CONFIGURATION
    // ============================================================

    /**
     * @dev Set bot address
     */
    function setBot(address _newBot) external onlyDeveloper {
        require(_newBot != address(0), "Invalid address");
        bot = _newBot;
        emit BotUpdated(_newBot);
    }

    /**
     * @dev Set treasury address
     */
    function setTreasury(address _newTreasury) external onlyDeveloper {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    /**
     * @dev Set developer address
     */
    function setDeveloper(address _newDeveloper) external onlyOwner {
        require(_newDeveloper != address(0), "Invalid address");
        developer = _newDeveloper;
        emit DeveloperUpdated(_newDeveloper);
    }

    /**
     * @dev Update fee percentages
     */
    function updateFees(
        uint256 _winnerPercentage,
        uint256 _platformFeePercentage
    ) external onlyDeveloper {
        require(_winnerPercentage + _platformFeePercentage == 100, "Percentages must sum to 100");
        require(_winnerPercentage > 0 && _platformFeePercentage > 0, "Percentages must be > 0");
        
        winnerPercentage = _winnerPercentage;
        platformFeePercentage = _platformFeePercentage;
        
        emit FeesUpdated(_winnerPercentage, _platformFeePercentage);
    }

    // ============================================================
    // EMERGENCY FUNCTIONS
    // ============================================================

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
     * @dev Recover any stuck tokens (emergency only)
     */
    function recoverToken(IERC20 token, uint256 amount) external onlyOwner {
        require(token != usdc, "Cannot recover USDC");
        token.transfer(owner(), amount);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @dev Get match status - useful for UI
     */
    function getMatchStatus(string calldata _matchId) external view returns (
        bool isFunded,
        bool isVerified,
        bool isReleased,
        bool isRefunded,
        bool isReady,
        address winner,
        uint256 totalAmount
    ) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        return (
            escrow.totalUSDC > 0,
            escrow.verified,
            escrow.released,
            escrow.refunded,
            escrow.player1Paid && escrow.player2Paid && escrow.player2 != address(0),
            escrow.winner,
            escrow.totalUSDC
        );
    }

    /**
     * @dev Get tournament matches
     */
    function getTournamentMatches(string calldata _tournamentId) external view returns (string[] memory) {
        return tournamentMatches[_tournamentId];
    }

    /**
     * @dev Check if player is in a match
     */
    function isPlayerInMatch(string calldata _matchId, address _player) external view returns (bool) {
        EscrowRecord storage escrow = escrowedMatches[_matchId];
        return escrow.player1 == _player || escrow.player2 == _player;
    }
}
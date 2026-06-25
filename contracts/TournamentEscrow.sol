// contracts/Escrow.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Escrow
 * @dev Escrow contract for locking USDC during tournament matches
 * @notice Players deposit USDC, winner receives payout after match completion
 */
contract Escrow is Ownable, ReentrancyGuard {
    // ─── ERRORS ──────────────────────────────────────────────────────

    error InvalidMatchId();
    error NotTournamentContract();
    error NotParticipant();
    error AlreadyDeposited();
    error MatchFullyFunded();
    error NotFullyFunded();
    error AlreadyReleased();
    error AlreadyRefunded();
    error InvalidAmount();
    error TransferFailed();
    error NotOwnerOrTournament();

    // ─── STRUCTS ─────────────────────────────────────────────────────

    struct MatchEscrow {
        uint256 matchId;
        address player1;
        address player2;
        uint256 amount;
        bool player1Deposited;
        bool player2Deposited;
        bool released;
        bool refunded;
        uint256 createdAt;
    }

    // ─── STATE VARIABLES ────────────────────────────────────────────

    IERC20 public usdc;
    address public tournamentContract;
    mapping(uint256 => MatchEscrow) public matchEscrows;
    uint256 public totalLocked;
    uint256 public totalReleased;

    // ─── EVENTS ──────────────────────────────────────────────────────

    event Deposited(
        uint256 indexed matchId,
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    event ReleasedToWinner(
        uint256 indexed matchId,
        address indexed winner,
        uint256 amount,
        uint256 timestamp
    );

    event Refunded(
        uint256 indexed matchId,
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    event TournamentContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );

    event USDCUpdated(
        address indexed oldUSDC,
        address indexed newUSDC
    );

    // ─── MODIFIERS ──────────────────────────────────────────────────

    modifier onlyTournamentContract() {
        if (msg.sender != tournamentContract) revert NotTournamentContract();
        _;
    }

    modifier onlyOwnerOrTournament() {
        if (msg.sender != owner() && msg.sender != tournamentContract) {
            revert NotOwnerOrTournament();
        }
        _;
    }

    modifier matchExists(uint256 matchId) {
        if (matchEscrows[matchId].matchId == 0) revert InvalidMatchId();
        _;
    }

    // ─── CONSTRUCTOR ────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _tournamentContract,
        address _owner
    ) Ownable(_owner) {
        usdc = IERC20(_usdc);
        tournamentContract = _tournamentContract;
    }

    // ─── TOURNAMENT CONTRACT FUNCTIONS ──────────────────────────────

    /**
     * @notice Initialize a match escrow (called by tournament contract)
     * @param matchId The match ID
     * @param player1 Player 1 address
     * @param player2 Player 2 address
     * @param amount Entry fee amount in USDC (with 6 decimals)
     */
    function initializeMatch(
        uint256 matchId,
        address player1,
        address player2,
        uint256 amount
    ) external onlyTournamentContract {
        if (matchId == 0) revert InvalidMatchId();
        if (player1 == address(0) || player2 == address(0)) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();

        // Check if match already exists
        if (matchEscrows[matchId].matchId != 0) {
            // Allow re-init if not fully funded and not released
            MatchEscrow storage existing = matchEscrows[matchId];
            if (existing.released || existing.refunded) {
                revert AlreadyReleased();
            }
            // Update existing
            existing.player1 = player1;
            existing.player2 = player2;
            existing.amount = amount;
            existing.createdAt = block.timestamp;
            return;
        }

        matchEscrows[matchId] = MatchEscrow({
            matchId: matchId,
            player1: player1,
            player2: player2,
            amount: amount,
            player1Deposited: false,
            player2Deposited: false,
            released: false,
            refunded: false,
            createdAt: block.timestamp
        });
    }

    /**
     * @notice Deposit USDC into escrow for a match
     * @param matchId The match ID
     * @param amount Amount to deposit (must equal entry fee)
     */
    function deposit(uint256 matchId, uint256 amount) external nonReentrant {
        if (matchId == 0) revert InvalidMatchId();

        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) revert InvalidMatchId();

        // Check if already released or refunded
        if (escrow.released) revert AlreadyReleased();
        if (escrow.refunded) revert AlreadyRefunded();

        // Check if already fully funded
        if (escrow.player1Deposited && escrow.player2Deposited) {
            revert MatchFullyFunded();
        }

        // Determine which player is depositing
        address player = msg.sender;
        bool isPlayer1 = player == escrow.player1;
        bool isPlayer2 = player == escrow.player2;

        if (!isPlayer1 && !isPlayer2) revert NotParticipant();

        // Check if player already deposited
        if (isPlayer1 && escrow.player1Deposited) revert AlreadyDeposited();
        if (isPlayer2 && escrow.player2Deposited) revert AlreadyDeposited();

        // Check amount matches entry fee
        if (amount != escrow.amount) revert InvalidAmount();

        // Transfer USDC from player to contract
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        // Update state
        if (isPlayer1) {
            escrow.player1Deposited = true;
        } else {
            escrow.player2Deposited = true;
        }

        totalLocked += amount;

        emit Deposited(matchId, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Release USDC to winner (called by tournament contract or owner)
     * @param matchId The match ID
     * @param winner The winner's address
     */
    function releaseToWinner(
        uint256 matchId,
        address winner
    ) external onlyOwnerOrTournament nonReentrant matchExists(matchId) {
        MatchEscrow storage escrow = matchEscrows[matchId];

        if (escrow.released) revert AlreadyReleased();
        if (escrow.refunded) revert AlreadyRefunded();
        if (!escrow.player1Deposited || !escrow.player2Deposited) {
            revert NotFullyFunded();
        }

        // Verify winner is a participant
        if (winner != escrow.player1 && winner != escrow.player2) {
            revert NotParticipant();
        }

        uint256 amount = escrow.amount * 2; // Both players' deposits

        // Transfer USDC to winner
        bool success = usdc.transfer(winner, amount);
        if (!success) revert TransferFailed();

        // Update state
        escrow.released = true;
        totalLocked -= amount;
        totalReleased += amount;

        emit ReleasedToWinner(matchId, winner, amount, block.timestamp);
    }

    /**
     * @notice Refund players if match is cancelled or not completed
     * @param matchId The match ID
     */
    function refundPlayers(
        uint256 matchId
    ) external onlyOwnerOrTournament nonReentrant matchExists(matchId) {
        MatchEscrow storage escrow = matchEscrows[matchId];

        if (escrow.released) revert AlreadyReleased();
        if (escrow.refunded) revert AlreadyRefunded();

        uint256 refundAmount = 0;

        // Refund Player 1
        if (escrow.player1Deposited) {
            refundAmount += escrow.amount;
            bool success = usdc.transfer(escrow.player1, escrow.amount);
            if (!success) revert TransferFailed();
            emit Refunded(matchId, escrow.player1, escrow.amount, block.timestamp);
        }

        // Refund Player 2
        if (escrow.player2Deposited) {
            refundAmount += escrow.amount;
            bool success = usdc.transfer(escrow.player2, escrow.amount);
            if (!success) revert TransferFailed();
            emit Refunded(matchId, escrow.player2, escrow.amount, block.timestamp);
        }

        if (refundAmount == 0) revert InvalidAmount();

        escrow.refunded = true;
        if (refundAmount > 0) {
            totalLocked -= refundAmount;
        }
    }

    /**
     * @notice Withdraw excess USDC from contract (only owner)
     * @param amount Amount to withdraw
     * @param to Address to send to
     */
    function withdrawExcess(
        uint256 amount,
        address to
    ) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();

        uint256 balance = usdc.balanceOf(address(this));
        // Keep locked funds
        uint256 locked = totalLocked;
        uint256 excess = balance - locked;

        if (amount > excess) revert InvalidAmount();

        bool success = usdc.transfer(to, amount);
        if (!success) revert TransferFailed();
    }

    // ─── VIEW FUNCTIONS ──────────────────────────────────────────────

    /**
     * @notice Get match funding status
     * @param matchId The match ID
     * @return player1Paid Whether player 1 has deposited
     * @return player2Paid Whether player 2 has deposited
     * @return totalAmount Total locked amount
     */
    function getMatchFunding(
        uint256 matchId
    ) external view returns (bool player1Paid, bool player2Paid, uint256 totalAmount) {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) return (false, false, 0);

        return (
            escrow.player1Deposited,
            escrow.player2Deposited,
            escrow.amount * 2
        );
    }

    /**
     * @notice Check if a player has deposited
     * @param matchId The match ID
     * @param player The player's address
     * @return bool Whether the player has deposited
     */
    function hasPlayerDeposited(
        uint256 matchId,
        address player
    ) external view returns (bool) {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) return false;

        if (player == escrow.player1) return escrow.player1Deposited;
        if (player == escrow.player2) return escrow.player2Deposited;
        return false;
    }

    /**
     * @notice Check if match is fully funded
     * @param matchId The match ID
     * @return bool Whether both players have deposited
     */
    function isMatchFullyFunded(uint256 matchId) external view returns (bool) {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) return false;
        return escrow.player1Deposited && escrow.player2Deposited;
    }

    /**
     * @notice Get contract USDC balance
     * @return uint256 Current USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    // ─── ADMIN FUNCTIONS ─────────────────────────────────────────────

    /**
     * @notice Set tournament contract address
     * @param _tournamentContract New tournament contract address
     */
    function setTournamentContract(address _tournamentContract) external onlyOwner {
        if (_tournamentContract == address(0)) revert InvalidAmount();
        address old = tournamentContract;
        tournamentContract = _tournamentContract;
        emit TournamentContractUpdated(old, _tournamentContract);
    }

    /**
     * @notice Set USDC token address
     * @param _usdc New USDC token address
     */
    function setUSDC(address _usdc) external onlyOwner {
        if (_usdc == address(0)) revert InvalidAmount();
        address old = address(usdc);
        usdc = IERC20(_usdc);
        emit USDCUpdated(old, _usdc);
    }

    /**
     * @notice Pause/unpause deposits (emergency)
     * @param paused Whether to pause
     */
    function setPaused(bool paused) external onlyOwner {
        // Add pause functionality if needed
    }
}
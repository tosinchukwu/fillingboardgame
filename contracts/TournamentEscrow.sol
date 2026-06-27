// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Escrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

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
    error MatchNotFound();

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

    IERC20 public usdc;
    address public tournamentContract;
    mapping(uint256 => MatchEscrow) public matchEscrows;
    uint256 public totalLocked;
    uint256 public totalReleased;

    event Deposited(uint256 indexed matchId, address indexed player, uint256 amount, uint256 timestamp);
    event ReleasedToWinner(uint256 indexed matchId, address indexed winner, uint256 amount, uint256 timestamp);
    event Refunded(uint256 indexed matchId, address indexed player, uint256 amount, uint256 timestamp);
    event TournamentContractUpdated(address indexed oldContract, address indexed newContract);
    event USDCUpdated(address indexed oldUSDC, address indexed newUSDC);
    event MatchInitialized(uint256 indexed matchId, address player1, address player2, uint256 amount);

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
        if (matchEscrows[matchId].matchId == 0) revert MatchNotFound();
        _;
    }

    constructor(address _usdc, address _tournamentContract, address _owner) Ownable(_owner) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_tournamentContract != address(0), "Invalid tournament address");
        usdc = IERC20(_usdc);
        tournamentContract = _tournamentContract;
    }

    function initializeMatch(uint256 matchId, address player1, address player2, uint256 amount)
        external onlyTournamentContract whenNotPaused
    {
        if (matchId == 0) revert InvalidMatchId();
        if (player1 == address(0) || player2 == address(0)) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();

        if (matchEscrows[matchId].matchId != 0) {
            MatchEscrow storage existing = matchEscrows[matchId];
            if (existing.released) revert AlreadyReleased();
            if (existing.refunded) revert AlreadyRefunded();
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

        emit MatchInitialized(matchId, player1, player2, amount);
    }

    function deposit(uint256 matchId, uint256 amount) external nonReentrant whenNotPaused {
        if (matchId == 0) revert InvalidMatchId();
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) revert MatchNotFound();
        if (escrow.released) revert AlreadyReleased();
        if (escrow.refunded) revert AlreadyRefunded();
        if (escrow.player1Deposited && escrow.player2Deposited) revert MatchFullyFunded();

        address player = msg.sender;
        bool isPlayer1 = player == escrow.player1;
        bool isPlayer2 = player == escrow.player2;
        if (!isPlayer1 && !isPlayer2) revert NotParticipant();
        if (isPlayer1 && escrow.player1Deposited) revert AlreadyDeposited();
        if (isPlayer2 && escrow.player2Deposited) revert AlreadyDeposited();
        if (amount != escrow.amount) revert InvalidAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        if (isPlayer1) {
            escrow.player1Deposited = true;
        } else {
            escrow.player2Deposited = true;
        }
        totalLocked += amount;
        emit Deposited(matchId, msg.sender, amount, block.timestamp);
    }

    function releaseToWinner(uint256 matchId, address winner)
        external onlyOwnerOrTournament nonReentrant matchExists(matchId) whenNotPaused
    {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.released) revert AlreadyReleased();
        if (escrow.refunded) revert AlreadyRefunded();
        if (!escrow.player1Deposited || !escrow.player2Deposited) revert NotFullyFunded();
        if (winner != escrow.player1 && winner != escrow.player2) revert NotParticipant();

        uint256 amount = escrow.amount * 2;
        usdc.safeTransfer(winner, amount);
        escrow.released = true;
        totalLocked -= amount;
        totalReleased += amount;
        emit ReleasedToWinner(matchId, winner, amount, block.timestamp);
    }

    function refundPlayers(uint256 matchId)
        external onlyOwnerOrTournament nonReentrant matchExists(matchId) whenNotPaused
    {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.released) revert AlreadyReleased();
        if (escrow.refunded) revert AlreadyRefunded();

        uint256 refundAmount = 0;
        if (escrow.player1Deposited) {
            refundAmount += escrow.amount;
            usdc.safeTransfer(escrow.player1, escrow.amount);
            emit Refunded(matchId, escrow.player1, escrow.amount, block.timestamp);
        }
        if (escrow.player2Deposited) {
            refundAmount += escrow.amount;
            usdc.safeTransfer(escrow.player2, escrow.amount);
            emit Refunded(matchId, escrow.player2, escrow.amount, block.timestamp);
        }
        if (refundAmount == 0) revert InvalidAmount();
        escrow.refunded = true;
        if (refundAmount > 0) {
            totalLocked -= refundAmount;
        }
    }

    function withdrawExcess(uint256 amount, address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();
        uint256 balance = usdc.balanceOf(address(this));
        uint256 locked = totalLocked;
        uint256 excess = balance - locked;
        if (amount > excess) revert InvalidAmount();
        usdc.safeTransfer(to, amount);
    }

    // ─── VIEW FUNCTIONS ──────────────────────────────────────────────

    function getMatchFunding(uint256 matchId) external view returns (bool player1Paid, bool player2Paid, uint256 totalAmount) {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) return (false, false, 0);
        return (escrow.player1Deposited, escrow.player2Deposited, escrow.amount * 2);
    }

    function hasPlayerDeposited(uint256 matchId, address player) external view returns (bool) {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) return false;
        if (player == escrow.player1) return escrow.player1Deposited;
        if (player == escrow.player2) return escrow.player2Deposited;
        return false;
    }

    function isMatchFullyFunded(uint256 matchId) external view returns (bool) {
        MatchEscrow storage escrow = matchEscrows[matchId];
        if (escrow.matchId == 0) return false;
        return escrow.player1Deposited && escrow.player2Deposited;
    }

    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function getMatchEscrow(uint256 matchId) external view returns (MatchEscrow memory) {
        return matchEscrows[matchId];
    }

    // ─── ADMIN FUNCTIONS ─────────────────────────────────────────────

    function setTournamentContract(address _tournamentContract) external onlyOwner {
        require(_tournamentContract != address(0), "Invalid address");
        address old = tournamentContract;
        tournamentContract = _tournamentContract;
        emit TournamentContractUpdated(old, _tournamentContract);
    }

    function setUSDC(address _usdc) external onlyOwner {
        require(_usdc != address(0), "Invalid address");
        address old = address(usdc);
        usdc = IERC20(_usdc);
        emit USDCUpdated(old, _usdc);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @dev Override to prevent renouncing ownership
     */
    function renounceOwnership() public view override onlyOwner {
        revert("Cannot renounce ownership");
    }
}

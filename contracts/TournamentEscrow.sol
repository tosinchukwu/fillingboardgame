// contracts/Escrow.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    // ─── STRUCTS ──────────────────────────────────────────────
    struct MatchEscrow {
        uint256 matchId;
        address player1;
        address player2;
        uint256 amount;
        bool player1Deposited;
        bool player2Deposited;
        bool released;
        bool refunded;
    }
    
    // ─── STATE ────────────────────────────────────────────────
    mapping(uint256 => MatchEscrow) public matchEscrows;
    IERC20 public usdc;
    address public tournamentContract;
    address public owner;
    
    // ─── EVENTS ────────────────────────────────────────────────
    event Deposited(uint256 matchId, address player, uint256 amount);
    event Released(uint256 matchId, address winner, uint256 amount);
    event Refunded(uint256 matchId, address player, uint256 amount);
    
    // ─── FUNCTIONS ─────────────────────────────────────────────
    function deposit(uint256 matchId, uint256 amount) external { ... }
    function releaseToWinner(uint256 matchId, address winner) external { ... }
    function refundPlayers(uint256 matchId) external { ... }
    function getMatchFunding(uint256 matchId) external view returns (...)
}
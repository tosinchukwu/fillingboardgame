// contracts/FillGameTournament.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IFillGameVictoryNFT {
    function mintVictoryNft(address to, uint256 matchId) external returns (uint256);
}

interface IEscrow {
    function initializeMatch(uint256 matchId, address player1, address player2, uint256 amount) external;
    function releaseToWinner(uint256 matchId, address winner) external;
    function refundPlayers(uint256 matchId) external;
    function getMatchFunding(uint256 matchId) external view returns (bool player1Paid, bool player2Paid, uint256 totalAmount);
    function isMatchFullyFunded(uint256 matchId) external view returns (bool);
}

contract FillGameTournament is Ownable, ReentrancyGuard, Pausable {

    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    // Structs
    // ──────────────────────────────────────────────

    struct Match {
        uint256 id;
        address player1;
        string  player1Name;
        address player2;
        string  player2Name;
        bool    player1Paid;
        bool    player2Paid;
        uint256 lockedEntryFee;
        address lockedPaymentToken;
        address winner;
        string  scoreline;
        bool    isCompleted;
        bool    isCancelled;
        uint256 prizePool;
        uint256 createdAt;
        bool    isCasual;
    }

    // Bundles createMatch params into one struct to fix "Stack too deep"
    struct CreateMatchParams {
        uint256 matchId;
        address player1;
        string  player1Name;
        address player2;
        string  player2Name;
        bool    isCasual;
    }

    // ──────────────────────────────────────────────
    // State Variables
    // ──────────────────────────────────────────────
    uint256 public entryFee = 0.1 ether;
    uint256 public protocolFeeBps = 1000; // 10%
    uint256 public matchTimeout = 7 days;

    address public nftContract;
    address public paymentToken;      // address(0) = native token (ETH/AVAX)
    address public treasury;
    address public escrowContract;    // ─── NEW: Escrow contract for USDC

    uint256 public protocolFeeBalance;

    // FIX: private instead of public — the auto-generated public getter
    // tries to put all 16 struct fields onto the EVM stack at once,
    // which exceeds the 16-slot limit. Use getMatch() below instead.
    mapping(uint256 => Match) private _matches;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────
    event MatchCreated(uint256 indexed matchId, address creator, bool isCasual);
    event PlayerJoined(uint256 indexed matchId, address player, uint256 amount);
    event MatchCancelled(uint256 indexed matchId, address cancelledBy);
    event RefundClaimed(uint256 indexed matchId, address player, uint256 amount);
    event ResultSubmitted(uint256 indexed matchId, address indexed winner, string scoreline, uint256 prizeToWinner, uint256 protocolFee);
    event PrizeDistributed(uint256 indexed matchId, address indexed winner, uint256 amount);
    event ProtocolFeeCollected(uint256 indexed matchId, uint256 amount);
    event VictoryNFTMinted(uint256 indexed matchId, address indexed winner, uint256 tokenId);

    // ─── NEW EVENTS ──────────────────────────────────────────────
    event EscrowContractUpdated(address indexed oldContract, address indexed newContract);
    event EscrowReleaseFailed(uint256 indexed matchId, address indexed winner);
    event EscrowRefundFailed(uint256 indexed matchId);
    event EscrowInitialized(uint256 indexed matchId, uint256 amount);

    // Configuration events
    event EntryFeeUpdated(uint256 oldFee, uint256 newFee);
    event ProtocolFeeBpsUpdated(uint256 oldBps, uint256 newBps);
    event MatchTimeoutUpdated(uint256 oldTimeout, uint256 newTimeout);
    event NftContractUpdated(address oldContract, address newContract);
    event PaymentTokenUpdated(address oldToken, address newToken);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ──────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────
    error InvalidEntryFee();
    error MatchAlreadyExists();
    error InvalidMatchId();
    error InvalidParticipants();
    error NotParticipant();
    error AlreadyPaid();
    error MatchInactive();
    error CasualMatchNoFee();
    error ExactFeeRequired();
    error NotYetRefundable();
    error NothingToRefund();
    error OnlyOwnerForOfficial();
    error BothPlayersMustPay();
    error InvalidWinner();
    error ResultSubmissionTimedOut();
    error NoBalanceToWithdraw();
    error InvalidTreasury();
    error EscrowNotSet();
    error EscrowInitializationFailed();
    error EscrowReleaseFailedError();

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────
    constructor(address _initialTreasury) Ownable(msg.sender) {
        require(_initialTreasury != address(0), InvalidTreasury());
        treasury = _initialTreasury;
    }

    // ──────────────────────────────────────────────
    // Configuration
    // ──────────────────────────────────────────────
    function setEntryFee(uint256 _fee) external onlyOwner {
        if (_fee == 0) revert InvalidEntryFee();
        emit EntryFeeUpdated(entryFee, _fee);
        entryFee = _fee;
    }

    function setProtocolFeeBps(uint256 _bps) external onlyOwner {
        require(_bps <= 3000, "Max 30%");
        emit ProtocolFeeBpsUpdated(protocolFeeBps, _bps);
        protocolFeeBps = _bps;
    }

    function setMatchTimeout(uint256 _seconds) external onlyOwner {
        require(_seconds >= 1 days && _seconds <= 30 days, "Timeout 1-30 days");
        emit MatchTimeoutUpdated(matchTimeout, _seconds);
        matchTimeout = _seconds;
    }

    function setNftContract(address _nft) external onlyOwner {
        require(_nft != address(0), "Invalid NFT address");
        emit NftContractUpdated(nftContract, _nft);
        nftContract = _nft;
    }

    function setPaymentToken(address _token) external onlyOwner {
        emit PaymentTokenUpdated(paymentToken, _token);
        paymentToken = _token;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), InvalidTreasury());
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    // ─── NEW: Set Escrow Contract ──────────────────────────────
    function setEscrowContract(address _escrow) external onlyOwner {
        require(_escrow != address(0), "Invalid escrow address");
        emit EscrowContractUpdated(escrowContract, _escrow);
        escrowContract = _escrow;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ──────────────────────────────────────────────
    // View — replaces the removed public mapping getter
    // ──────────────────────────────────────────────

    // Returns the full Match struct in memory (no stack pressure)
    function getMatch(uint256 matchId) external view returns (Match memory) {
        return _matches[matchId];
    }

    // ─── NEW: Get escrow funding status ──────────────────────────
    function getMatchEscrowFunding(uint256 matchId) external view returns (bool player1Paid, bool player2Paid, uint256 totalAmount) {
        if (escrowContract == address(0)) return (false, false, 0);
        return IEscrow(escrowContract).getMatchFunding(matchId);
    }

    function isMatchEscrowFunded(uint256 matchId) external view returns (bool) {
        if (escrowContract == address(0)) return false;
        return IEscrow(escrowContract).isMatchFullyFunded(matchId);
    }

    // ──────────────────────────────────────────────
    // Internal Helpers
    // ──────────────────────────────────────────────
    function _isNative(Match storage m) internal view returns (bool) {
        return m.lockedPaymentToken == address(0);
    }

    function _isUSDC(Match storage m) internal view returns (bool) {
        return m.lockedPaymentToken != address(0);
    }

    function _sendPayment(address to, uint256 amount, address token) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function _getMatch(uint256 matchId) internal view returns (Match storage) {
        Match storage m = _matches[matchId];
        if (m.id == 0) revert MatchInactive();
        return m;
    }

    // ─── NEW: Helper to get USDC entry fee (6 decimals) ──────────
    function _getUSDCAmount(uint256 ethAmount) internal pure returns (uint256) {
        // Convert from 18 decimals (ether) to 6 decimals (USDC)
        return ethAmount / 1e12;
    }

    // ──────────────────────────────────────────────
    // Main Functions
    // ──────────────────────────────────────────────

    function createMatch(CreateMatchParams calldata p) external whenNotPaused {
        if (p.matchId == 0) revert InvalidMatchId();
        if (_matches[p.matchId].id != 0) revert MatchAlreadyExists();
        if (p.player1 == address(0) || p.player2 == address(0) || p.player1 == p.player2) {
            revert InvalidParticipants();
        }
        if (!p.isCasual && msg.sender != owner()) {
            revert OnlyOwnerForOfficial();
        }

        Match storage m = _matches[p.matchId];
        m.id                 = p.matchId;
        m.player1            = p.player1;
        m.player1Name        = p.player1Name;
        m.player2            = p.player2;
        m.player2Name        = p.player2Name;
        m.createdAt          = block.timestamp;
        m.isCasual           = p.isCasual;
        m.lockedEntryFee     = entryFee;
        m.lockedPaymentToken = paymentToken;

        // ─── Initialize escrow for official USDC matches ──────────
        if (!p.isCasual && escrowContract != address(0) && paymentToken != address(0)) {
            // Entry fee in USDC (6 decimals) - convert from ether (18 decimals)
            uint256 usdcEntryFee = _getUSDCAmount(entryFee);
            if (usdcEntryFee > 0) {
                (bool success, ) = escrowContract.call(
                    abi.encodeWithSignature(
                        "initializeMatch(uint256,address,address,uint256)",
                        p.matchId,
                        p.player1,
                        p.player2,
                        usdcEntryFee
                    )
                );
                if (!success) revert EscrowInitializationFailed();
                emit EscrowInitialized(p.matchId, usdcEntryFee);
            }
        }

        emit MatchCreated(p.matchId, msg.sender, p.isCasual);
    }

    function joinMatch(uint256 matchId) external payable nonReentrant whenNotPaused {
        Match storage m = _getMatch(matchId);
        if (m.isCompleted || m.isCancelled) revert MatchInactive();
        if (m.isCasual) revert CasualMatchNoFee();

        _validateJoinPayment(m);
        _markPlayerAsPaid(m);

        if (!_isNative(m)) {
            IERC20(m.lockedPaymentToken).safeTransferFrom(msg.sender, address(this), m.lockedEntryFee);
        }

        m.prizePool += m.lockedEntryFee;
        emit PlayerJoined(matchId, msg.sender, m.lockedEntryFee);
    }

    function submitResult(
        uint256 matchId,
        address winnerAddr,
        string calldata scoreline
    ) external onlyOwner nonReentrant whenNotPaused {
        Match storage m = _getMatch(matchId);

        _validateResultSubmission(m, winnerAddr);
        _updateMatchResult(m, winnerAddr, scoreline);

        uint256 protocolFee = _calculateProtocolFee(m.prizePool);
        uint256 prize = m.prizePool - protocolFee;

        _distributePrize(m, winnerAddr, prize);
        _collectProtocolFee(m, protocolFee);
        _mintVictoryNFT(m, winnerAddr);

        // ─── Release USDC from escrow if applicable ──────────────
        if (!m.isCasual && escrowContract != address(0) && m.lockedPaymentToken != address(0)) {
            (bool success, ) = escrowContract.call(
                abi.encodeWithSignature(
                    "releaseToWinner(uint256,address)",
                    matchId,
                    winnerAddr
                )
            );
            // Don't revert if escrow fails - just log (prize already distributed via native/ERC20)
            if (!success) {
                emit EscrowReleaseFailed(matchId, winnerAddr);
            }
        }

        emit ResultSubmitted(matchId, winnerAddr, scoreline, prize, protocolFee);
    }

    function cancelMatch(uint256 matchId) external nonReentrant whenNotPaused {
        Match storage m = _getMatch(matchId);
        if (m.isCompleted) revert MatchInactive();
        if (m.isCancelled) return;

        bool isAuthorized = (msg.sender == m.player1 || msg.sender == m.player2 || msg.sender == owner());
        if (!isAuthorized) revert NotParticipant();

        m.isCancelled = true;

        // ─── Refund escrow if applicable ──────────────────────────
        if (!m.isCasual && escrowContract != address(0) && m.lockedPaymentToken != address(0)) {
            (bool success, ) = escrowContract.call(
                abi.encodeWithSignature(
                    "refundPlayers(uint256)",
                    matchId
                )
            );
            if (!success) {
                emit EscrowRefundFailed(matchId);
            }
        }

        emit MatchCancelled(matchId, msg.sender);
    }

    function claimRefund(uint256 matchId) external nonReentrant {
        Match storage m = _getMatch(matchId);

        if (!m.isCancelled && !_isRefundable(m)) revert NotYetRefundable();

        uint256 refundAmount = _getRefundAmount(m);
        if (refundAmount == 0) revert NothingToRefund();

        _processRefund(m, msg.sender, refundAmount);
        emit RefundClaimed(matchId, msg.sender, refundAmount);
    }

    function withdrawProtocolFees() external onlyOwner {
        uint256 bal = protocolFeeBalance;
        if (bal == 0) revert NoBalanceToWithdraw();

        protocolFeeBalance = 0;
        _sendPayment(treasury, bal, paymentToken);
    }

    receive() external payable {}

    // ──────────────────────────────────────────────
    // Internal Logic
    // ──────────────────────────────────────────────

    function _validateJoinPayment(Match storage m) internal view {
        bool isNative = _isNative(m);
        uint256 fee = m.lockedEntryFee;

        if (isNative) {
            if (msg.value != fee) revert ExactFeeRequired();
        } else if (msg.value != 0) {
            revert ExactFeeRequired();
        }
    }

    function _markPlayerAsPaid(Match storage m) internal {
        if (msg.sender == m.player1) {
            if (m.player1Paid) revert AlreadyPaid();
            m.player1Paid = true;
        } else if (msg.sender == m.player2) {
            if (m.player2Paid) revert AlreadyPaid();
            m.player2Paid = true;
        } else {
            revert NotParticipant();
        }
    }

    function _validateResultSubmission(Match storage m, address winnerAddr) internal view {
        if (m.isCasual) revert CasualMatchNoFee();
        if (m.isCompleted || m.isCancelled) revert MatchInactive();
        if (!m.player1Paid || !m.player2Paid) revert BothPlayersMustPay();
        if (block.timestamp > m.createdAt + matchTimeout) revert ResultSubmissionTimedOut();
        if (winnerAddr != m.player1 && winnerAddr != m.player2) revert InvalidWinner();
    }

    function _updateMatchResult(Match storage m, address winnerAddr, string calldata scoreline) internal {
        m.winner = winnerAddr;
        m.scoreline = scoreline;
        m.isCompleted = true;
    }

    function _calculateProtocolFee(uint256 prizePool) internal view returns (uint256) {
        return (prizePool * protocolFeeBps) / 10000;
    }

    function _distributePrize(Match storage m, address winnerAddr, uint256 prize) internal {
        if (prize == 0) return;
        _sendPayment(winnerAddr, prize, m.lockedPaymentToken);
        emit PrizeDistributed(m.id, winnerAddr, prize);
    }

    function _collectProtocolFee(Match storage m, uint256 protocolFee) internal {
        if (protocolFee == 0) return;
        _sendPayment(treasury, protocolFee, m.lockedPaymentToken);
        protocolFeeBalance += protocolFee;
        emit ProtocolFeeCollected(m.id, protocolFee);
    }

    function _mintVictoryNFT(Match storage m, address winnerAddr) internal {
        if (nftContract == address(0)) return;
        uint256 tokenId = IFillGameVictoryNFT(nftContract).mintVictoryNft(winnerAddr, m.id);
        emit VictoryNFTMinted(m.id, winnerAddr, tokenId);
    }

    function _isRefundable(Match storage m) internal view returns (bool) {
        return block.timestamp > m.createdAt + matchTimeout && !m.isCompleted;
    }

    function _getRefundAmount(Match storage m) internal view returns (uint256) {
        uint256 amount = 0;
        if (msg.sender == m.player1 && m.player1Paid) amount += m.lockedEntryFee;
        if (msg.sender == m.player2 && m.player2Paid) amount += m.lockedEntryFee;
        return amount;
    }

    function _processRefund(Match storage m, address player, uint256 amount) internal {
        if (player == m.player1) m.player1Paid = false;
        if (player == m.player2) m.player2Paid = false;

        _sendPayment(player, amount, m.lockedPaymentToken);
        m.prizePool -= amount;
    }
}

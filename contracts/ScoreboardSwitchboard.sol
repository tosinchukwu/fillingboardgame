// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * Minimal slice of Switchboard's ISwitchboard sufficient for on-demand verify.
 * Full interface: github.com/switchboard-xyz/evm-on-demand
 */
interface ISwitchboard {
    struct LegacyUpdate {
        int256 result;
        uint256 timestamp;
        uint256 slotNumber;
    }

    function getFee(bytes[] calldata updates) external view returns (uint256);
    function updateFeeds(bytes[] calldata updates) external payable;
    function latestUpdate(bytes32 feedId) external view returns (LegacyUpdate memory);
}

/**
 * @title  FillingGameScoreboard (Switchboard On-Demand edition)
 * @notice Public, append-only history of verified Filling Game matches.
 *
 * Gas-optimised migration from the Chainlink Functions implementation:
 *  - No LINK subscription, no async callback bookkeeping.
 *  - Single-tx verification: caller passes signed Switchboard updates, contract
 *    verifies them via the Switchboard router, then reads the latest signed
 *    value for our feed id.
 *  - `GameResult` is packed into 2 slots (was 5) by using uint128/uint64/bool.
 *  - Frontend-facing reads (`history`, `getResult`, `getLatestResults`,
 *    `getGameCount`) keep their previous shapes for ABI compatibility.
 *
 * Packed score layout (matches `switchboard/scoreVerifier.ts`):
 *   bits [248..255] winner index (0, 1, or 255 = no winner)
 *   bits [128..159] score0 * 10
 *   bits [  0..31 ] score1 * 10
 *
 * The recorded `score` field stores the WINNER's score * 10 (uint128). UI
 * decoders should divide by 10 — same convention as the Chainlink version.
 */
contract FillingGameScoreboard is Ownable, ReentrancyGuard {
    // ──────────────────────────── Storage ──────────────────────────── //

    struct GameResult {
        address winner;       // slot 1: 20 bytes
        uint96  padding1;     // slot 1: 12 bytes — kept zero, future use
        uint128 score;        // slot 2: 16 bytes (winner score * 10)
        uint64  timestamp;    // slot 2:  8 bytes
        bool    verified;     // slot 2:  1 byte
        // string storage uses additional slots; unavoidable for variable len.
        string  winnerName;
    }

    GameResult[] public history;

    /// Switchboard router for this chain (set in constructor, updatable by owner).
    ISwitchboard public switchboard;

    /// The Switchboard feed id our off-chain Function publishes to.
    bytes32 public feedId;

    /// Max age (seconds) of a Switchboard update we will accept.
    uint64 public maxUpdateAge = 5 minutes;

    // ──────────────────────────── Errors ───────────────────────────── //

    error EmptyWinnerName();
    error InvalidWinnerAddress();
    error InvalidResponse();
    error InsufficientFee(uint256 required, uint256 provided);
    error StaleUpdate(uint256 updatedAt, uint256 nowTs);
    error SwitchboardNotConfigured();

    // ──────────────────────────── Events ───────────────────────────── //

    event ScoreRecorded(
        address indexed winner,
        string winnerName,
        uint256 score,
        uint256 timestamp,
        bool verified
    );
    event SwitchboardRouterUpdated(address oldRouter, address newRouter);
    event FeedIdUpdated(bytes32 oldFeedId, bytes32 newFeedId);
    event MaxUpdateAgeUpdated(uint64 oldMax, uint64 newMax);

    // ─────────────────────────── Construction ──────────────────────── //

    constructor(address _switchboard, bytes32 _feedId) Ownable(msg.sender) {
        switchboard = ISwitchboard(_switchboard);
        feedId = _feedId;
    }

    // ──────────────── Verified submission (Switchboard) ────────────── //

    /**
     * @notice Verify a Switchboard-signed game result and record it.
     * @param updates Signed update bytes returned by the Switchboard Crossbar.
     * @param winnerName Display name for the winner (validated client-side).
     *
     * The caller forwards `msg.value` to cover Switchboard's per-update fee.
     * Any surplus is refunded. The reported score must be > 0 and timestamped
     * within `maxUpdateAge` of `block.timestamp`.
     */
    function submitVerifiedResult(
        bytes[] calldata updates,
        string calldata winnerName
    ) external payable nonReentrant {
        if (bytes(winnerName).length == 0) revert EmptyWinnerName();
        if (address(switchboard) == address(0) || feedId == bytes32(0)) {
            revert SwitchboardNotConfigured();
        }

        uint256 fee = switchboard.getFee(updates);
        if (msg.value < fee) revert InsufficientFee(fee, msg.value);

        // Signature verification happens inside updateFeeds; reverts on bad data.
        switchboard.updateFeeds{value: fee}(updates);

        ISwitchboard.LegacyUpdate memory latest = switchboard.latestUpdate(feedId);
        if (latest.timestamp + maxUpdateAge < block.timestamp) {
            revert StaleUpdate(latest.timestamp, block.timestamp);
        }
        if (latest.result <= 0) revert InvalidResponse();

        uint256 packed = uint256(latest.result);
        uint8 winnerIdx = uint8(packed >> 248);
        uint128 score0 = uint128((packed >> 128) & type(uint32).max);
        uint128 score1 = uint128(packed & type(uint32).max);

        if (winnerIdx > 1) revert InvalidResponse();
        uint128 winnerScore = winnerIdx == 0 ? score0 : score1;

        // The Switchboard quorum certifies the score; the caller asserts the
        // winning address. We store both so disputes are traceable.
        if (msg.sender == address(0)) revert InvalidWinnerAddress();

        _record(msg.sender, winnerName, winnerScore, true);

        // Refund any overpayment.
        uint256 refund = msg.value - fee;
        if (refund > 0) {
            (bool ok, ) = msg.sender.call{value: refund}("");
            require(ok, "refund failed");
        }
    }

    /**
     * @notice Owner-only manual record. Mirrors the legacy `recordScore` so
     *         frontend admin tools keep working until fully migrated.
     */
    function recordScore(
        address winner,
        string calldata winnerName,
        uint256 score,
        bool verified
    ) external onlyOwner {
        if (winner == address(0)) revert InvalidWinnerAddress();
        if (bytes(winnerName).length == 0) revert EmptyWinnerName();
        if (score > type(uint128).max) revert InvalidResponse();
        _record(winner, winnerName, uint128(score), verified);
    }

    function _record(
        address winner,
        string calldata winnerName,
        uint128 score,
        bool verified
    ) internal {
        history.push(
            GameResult({
                winner: winner,
                padding1: 0,
                score: score,
                timestamp: uint64(block.timestamp),
                verified: verified,
                winnerName: winnerName
            })
        );
        emit ScoreRecorded(winner, winnerName, score, block.timestamp, verified);
    }

    // ─────────────────────────── Reads ─────────────────────────────── //

    function getGameCount() external view returns (uint256) {
        return history.length;
    }

    function getResult(uint256 index) external view returns (GameResult memory) {
        return history[index];
    }

    function getLatestResults(uint256 count) external view returns (GameResult[] memory) {
        uint256 n = history.length;
        if (count > n) count = n;
        GameResult[] memory out = new GameResult[](count);
        for (uint256 i = 0; i < count; i++) {
            out[i] = history[n - 1 - i];
        }
        return out;
    }

    // ─────────────────────────── Admin ─────────────────────────────── //

    function setSwitchboardRouter(address router) external onlyOwner {
        emit SwitchboardRouterUpdated(address(switchboard), router);
        switchboard = ISwitchboard(router);
    }

    function setFeedId(bytes32 newFeedId) external onlyOwner {
        emit FeedIdUpdated(feedId, newFeedId);
        feedId = newFeedId;
    }

    function setMaxUpdateAge(uint64 newMax) external onlyOwner {
        emit MaxUpdateAgeUpdated(maxUpdateAge, newMax);
        maxUpdateAge = newMax;
    }

    // ─────────────────────────── Overrides ─────────────────────────── //

    /**
     * @notice Prevent renouncing ownership
     */
    function renounceOwnership() public override onlyOwner {
        revert("Cannot renounce ownership");
    }

    receive() external payable {}
}

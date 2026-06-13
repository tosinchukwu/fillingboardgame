// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {FillingGameScoreboard} from "../ScoreboardSwitchboard.sol";

/**
 * Deploy script for the Switchboard-powered Scoreboard.
 *
 * Usage:
 *   export PRIVATE_KEY=0x...
 *   export RPC_URL=...
 *   forge script script/DeployScoreboard.s.sol \
 *     --rpc-url $RPC_URL --broadcast --verify -vvvv
 *
 * Update `getConfig` with the canonical Switchboard router for each chain id
 * and the feed id you published via app.switchboard.xyz.
 */
contract DeployScoreboard is Script {
    struct Config {
        address switchboardRouter;
        bytes32 feedId;
    }

    function run() external {
        Config memory cfg = getConfig(block.chainid);
        require(cfg.switchboardRouter != address(0), "router not set for this chain");
        require(cfg.feedId != bytes32(0), "feedId not set for this chain");

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        FillingGameScoreboard scoreboard =
            new FillingGameScoreboard(cfg.switchboardRouter, cfg.feedId);
        vm.stopBroadcast();

        console2.log("FillingGameScoreboard deployed at:", address(scoreboard));
    }

    /**
     * Replace each placeholder with the canonical Switchboard router for the
     * chain. The feed id is global — the same id you registered in the
     * Switchboard app applies to every chain.
     *
     * Reference: https://docs.switchboard.xyz/docs-by-chain/evm
     */
    function getConfig(uint256 chainId) internal pure returns (Config memory) {
        // Replace `FEED_ID` with the bytes32 returned by app.switchboard.xyz
        bytes32 FEED_ID = bytes32(0); // TODO: e.g. 0xabc...

        if (chainId == 43113) {
            // Avalanche Fuji
            return Config({
                switchboardRouter: address(0), // TODO from docs
                feedId: FEED_ID
            });
        }
        if (chainId == 43114) {
            // Avalanche C-Chain
            return Config({
                switchboardRouter: address(0), // TODO
                feedId: FEED_ID
            });
        }
        if (chainId == 84532) {
            // Base Sepolia
            return Config({
                switchboardRouter: address(0), // TODO
                feedId: FEED_ID
            });
        }
        if (chainId == 8453) {
            // Base Mainnet
            return Config({
                switchboardRouter: address(0), // TODO
                feedId: FEED_ID
            });
        }
        if (chainId == 421614) {
            // Arbitrum Sepolia
            return Config({
                switchboardRouter: address(0), // TODO
                feedId: FEED_ID
            });
        }
        if (chainId == 42161) {
            // Arbitrum One
            return Config({
                switchboardRouter: address(0), // TODO
                feedId: FEED_ID
            });
        }
        if (chainId == 11155420) {
            // Optimism Sepolia
            return Config({
                switchboardRouter: address(0), // TODO
                feedId: FEED_ID
            });
        }
        if (chainId == 10) {
            // Optimism Mainnet
            return Config({
                switchboardRouter: address(0), // TODO
                feedId: FEED_ID
            });
        }

        return Config({switchboardRouter: address(0), feedId: bytes32(0)});
    }
}

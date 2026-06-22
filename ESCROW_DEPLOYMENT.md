# Tournament Escrow Smart Contract Deployment Guide

## Overview
The `TournamentEscrow.sol` contract manages tournament entry fees and reward distribution in a secure, decentralized manner. Funds are held in escrow until match results are verified by the automated bot.

## Prerequisites
- Solidity ^0.8.20
- OpenZeppelin Contracts v4.9+
- USDC token address for your network
- Developer wallet address (can release funds)

## Deployment Steps

### 1. Get USDC Token Address for Your Network

**Testnet:**
- **Arc Testnet**: USDC address: `0xA0D71B2EF35c95a6B0de3c71f9d7efDC0BFce18E`
- **Sepolia**: USDC address: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- **Mumbai (Polygon Testnet)**: USDC address: `0x0FA8781a83E46826621b3BC094Ea2A0212e71B23`

**Mainnet:**
- **Ethereum**: USDC address: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Polygon**: USDC address: `0x2791Bca1f2de4661ED88A30C99a7a9449Aa84174`
- **Base**: USDC address: `0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3D`

### 2. Compile the Contract
```bash
npx hardhat compile
```

### 3. Deploy Using Hardhat/Ethers

**Create deployment script (scripts/deploy-escrow.js):**

```javascript
const hre = require("hardhat");

async function main() {
  const USDC_ADDRESS = "0xA0D71B2EF35c95a6B0de3c71f9d7efDC0BFce18E"; // Arc Testnet
  const DEVELOPER_ADDRESS = "YOUR_WALLET_ADDRESS";

  const TournamentEscrow = await hre.ethers.getContractFactory("TournamentEscrow");
  const escrow = await TournamentEscrow.deploy(USDC_ADDRESS, DEVELOPER_ADDRESS);

  await escrow.deployed();
  console.log("TournamentEscrow deployed to:", escrow.address);

  // Save contract address to .env or config file
  return escrow.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Deploy:**
```bash
npx hardhat run scripts/deploy-escrow.js --network [testnet|mainnet]
```

### 4. Verify on Block Explorer (Optional but Recommended)

```bash
npx hardhat verify --network [testnet|mainnet] \
  CONTRACT_ADDRESS \
  USDC_ADDRESS \
  DEVELOPER_ADDRESS
```

### 5. Add Contract Address to Configuration

Update your `src/lib/constants.ts`:

```typescript
export const ESCROW_CONTRACT_ADDRESS_MAP: { [chainId: number]: string } = {
  5042002: "0x...", // Arc Testnet
  11155111: "0x...", // Sepolia
  80002: "0x...", // Mumbai
  1: "0x...", // Ethereum
  137: "0x...", // Polygon
  8453: "0x...", // Base
};
```

## Contract Functions

### Admin Functions (Developer Only)

1. **createTournament**
   - Set entry fee for a specific tournament
   - Call once per tournament
   ```solidity
   escrow.createTournament("tournament_id", 100 * 10**6); // $100 USDC (6 decimals)
   ```

2. **setDeveloperSettings**
   - Configure winner/runner-up percentage splits
   ```solidity
   escrow.setDeveloperSettings(60, 30, 10); // 60% winner, 30% runner-up, 10% platform
   ```

### Player Functions

3. **escrowFunds**
   - Players deposit their entry fees
   - Requires USDC approval first
   ```solidity
   // Step 1: Approve USDC
   usdc.approve(escrowAddress, totalAmount);
   
   // Step 2: Deposit to escrow
   escrow.escrowFunds(
     "match_id",
     "tournament_id",
     player1Address,
     player2Address,
     player1Amount,
     player2Amount
   );
   ```

### Bot/Developer Functions

4. **releaseRewards**
   - Bot calls this after verifying results
   - Automatically distributes rewards
   ```solidity
   escrow.releaseRewards(
     "match_id",
     winnerAddress,
     runnerUpAddress,
     60,  // winner percentage
     30   // runner-up percentage
   );
   ```

5. **refundFunds**
   - Refund on abandoned or disputed matches
   ```solidity
   escrow.refundFunds("match_id");
   ```

## Integration with Bot

The Vercel Cron bot will:

1. Check Supabase for verified matches
2. Call `releaseRewards` with winner/runner-up addresses
3. Funds automatically transfer from escrow to winners
4. Log transaction hash in `reward_distributions` table

Update `api/cron/distribute-rewards.ts`:

```typescript
// After creating reward_distributions entries:
const contractInterface = new ethers.Interface(ESCROW_ABI);
const tx = await provider.send("eth_sendTransaction", [{
  to: ESCROW_ADDRESS,
  data: contractInterface.encodeFunctionData("releaseRewards", [
    matchId,
    winnerAddress,
    runnerUpAddress,
    60,
    30
  ]),
  from: developerAddress,
  gas: "200000",
  gasPrice: "auto"
}]);
```

## Security Considerations

1. **Reentrancy Protection**: Contract uses `ReentrancyGuard`
2. **Access Control**: Only developer can release funds
3. **Emergency Functions**: Owner can pause and recover tokens
4. **Fund Verification**: All transfers are logged and verified
5. **Approval Requirement**: Players must approve USDC before depositing

## Testing the Contract

```bash
npx hardhat test test/TournamentEscrow.test.js
```

## Troubleshooting

**"Insufficient allowance"**
- Player must approve USDC first: `usdc.approve(escrowAddress, amount)`

**"Invalid tournament"**
- Tournament must be created first: `createTournament(tournamentId, entryFee)`

**"Developer only"**
- Only the developer wallet set during deployment can release funds

## Next Steps

1. Deploy contract to testnet and verify
2. Update Supabase `developer_settings.escrow_contract_address`
3. Update cron bot to call `releaseRewards`
4. Test end-to-end flow with test players
5. Deploy to mainnet when ready

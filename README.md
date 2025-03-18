# Reclaim Onchain Starter Kit - Lukso Network

This is a starter kit for building Web3 applications on Lukso that leverage the Reclaim Protocol for on-chain verification of off-chain data. The project demonstrates how to create an ERC20 token (CloutCoin) that converts verified Twitter social capital into tokens using the Reclaim Protocol.

- [Explorer Link](https://explorer.execution.testnet.lukso.network/address/0xE92a83Aa6E20fd6a8eAE2d3Af364dD6ADAc07a1e)
- [Live Link](https://reclaim-lukso-starterkit.vercel.app)

## Overview

This starter kit shows how to integrate Reclaim Protocol with Lukso's Universal Profile system, demonstrating:
1. A Solidity smart contract (`CloutCoin.sol`) that mints ERC20 tokens based on verified Twitter follower counts
2. A React-based frontend application that interacts with the Lukso network and Reclaim JS SDK

## How it Works

- Users connect their Lukso Universal Profile
- Verify their Twitter account through Reclaim Protocol
- The contract verifies the proof of Twitter followers
- Users receive 1000 CloutCoin tokens per Twitter follower
- Each Twitter account can only mint tokens once

## Tech Stack

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - TailwindCSS
  - wagmi
  - viem
  - React Query
  - Reclaim JS SDK

- **Smart Contracts**:
  - Solidity ^0.8.26
  - OpenZeppelin Contracts
  - Reclaim Protocol

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Start the development server:
```bash
yarn dev
```

3. Build the project:
```bash
yarn build
```

## Smart Contract

The `CloutCoin` contract:
- Inherits from OpenZeppelin's ERC20
- Verifies Twitter follower counts using the Reclaim Protocol
- Mints ERC20 tokens proportional to follower count (1000 tokens per follower)
- Prevents double-minting by tracking used Twitter accounts
- Includes utilities for parsing Twitter profile data from Reclaim proofs

## Frontend

The frontend application provides:
- Interface for verifying Twitter accounts
- Minting CloutCoin tokens
- Integration with Reclaim Protocol for verification

## Using this Starter Kit

This starter kit can be used as a template for building various applications on Lukso that require verified off-chain data. While this example uses Twitter followers, the same pattern can be applied to:
- Professional credentials
- Educational certificates
- Social media metrics
- Any other off-chain data supported by Reclaim Protocol

## Learn More

- [Reclaim Protocol Documentation](https://docs.reclaimprotocol.org/)


# SolSentry — Submission for Nosana x ElizaOS Builder Challenge

## Project Description (≤300 words)

SolSentry is a personal Solana blockchain assistant that monitors wallets, tracks tokens, and reports network health — all running on decentralized infrastructure.

**The Problem:** Every existing portfolio tracker (Phantom, Step, Birdeye) collects your data. They know your wallets, holdings, and trading patterns. Your financial data shouldn't be someone else's product.

**The Solution:** SolSentry queries the Solana blockchain directly via JSON-RPC. No centralized APIs, no data collection, no tracking. Combined with Nosana's decentralized GPU compute and the Qwen3.5 model, it's a fully decentralized personal finance assistant.

**What it does:**
- **Wallet Balance** — Check SOL balance for any address
- **Token Holdings** — View all SPL tokens with known-token labeling (USDC, BONK, JUP, etc.)
- **Transaction History** — Recent transactions with status and timestamps
- **Account Info** — Identify account types (wallet, stake, program, validator)
- **Network Status** — Live TPS, epoch progress, supply stats
- **Staking Monitor** — Active delegations with validator info

**Technical highlights:**
- Custom ElizaOS v2 plugin with 7 blockchain actions
- Zero third-party API dependencies — all data from Solana mainnet RPC
- Known-token registry for human-readable token labels
- Parallel RPC queries for network status (4 concurrent calls)
- TypeScript with full type safety

**Why this matters:** The OpenClaw philosophy is that your AI should work for you, not for a corporation. SolSentry proves this works for on-chain finance. Your wallet data never leaves the decentralized stack: Nosana for compute, Solana for data, you for control.

## Submission Links
- **GitHub:** https://github.com/robbarneveld760-ship-it/agent-challenge
- **Video Demo:** [TO BE ADDED]
- **Nosana Deployment:** [TO BE ADDED]
- **Social Post:** [TO BE ADDED]

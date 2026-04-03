# SolSentry — Personal Solana Blockchain Monitor

<p align="center">
  <strong>Your wallet. Your data. Your infrastructure.</strong>
</p>

**SolSentry** is a personal Solana blockchain assistant that runs on decentralized infrastructure. It monitors wallets, tracks tokens, fetches transactions, checks staking positions, and reports network health — all from on-chain data, with zero centralized APIs.

Built for the [Nosana x ElizaOS Builder Challenge](https://earn.superteam.fun/listings/nosana-builders-elizaos-challenge).

---

## Why SolSentry?

Every existing portfolio tracker (Phantom, Step, Birdeye) collects your data. They know your wallet, your holdings, your trading patterns. SolSentry is different:

- **No centralized APIs** — all data comes directly from Solana RPC
- **No data collection** — queries are ephemeral, nothing is stored or sent to third parties
- **Decentralized compute** — runs on Nosana GPU infrastructure, not AWS/GCP
- **Open source** — verify exactly what data is accessed and how

This is what personal AI should look like: **your tools, running on your infrastructure, serving only you.**

---

## Features

| Action | What it does |
|--------|-------------|
| `CHECK_WALLET_BALANCE` | SOL balance for any wallet |
| `GET_TOKEN_HOLDINGS` | All SPL token balances with known token labels |
| `GET_RECENT_TRANSACTIONS` | Last 10 transactions with status and timestamps |
| `GET_ACCOUNT_INFO` | Account type, owner program, rent status |
| `SOLANA_NETWORK_STATUS` | Current slot, epoch progress, TPS, supply stats |
| `CHECK_STAKE_ACCOUNTS` | Active stake delegations and validator info |
| `CHECK_TOKEN_PRICE` | Live token prices via Jupiter aggregator |

All actions query the Solana mainnet RPC directly. No API keys required. No rate limits hit for normal usage.

---

## Quick Start

### Prerequisites

- Node.js 23+ or Bun
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/agent-challenge.git
cd agent-challenge

# Configure environment
cp .env.example .env
# The default .env uses the Nosana-hosted Qwen3.5 endpoint — no changes needed

# Install dependencies
bun install
# or: npm install

# Install ElizaOS CLI
bun install -g @elizaos/cli

# Start the agent
elizaos dev --character ./characters/agent.character.json
```

Open [http://localhost:3000](http://localhost:3000) and start chatting with SolSentry.

### Example Commands

```
Check wallet 6Rx5arD2bowuE4rWhd8KWnaD7kVvixU93aQistJABAGq
Show my token holdings
Recent transactions
Solana network status
Check staking for [wallet]
Account info for [address]
```

---

## Architecture

```
User ──> ElizaOS Chat ──> SolSentry Plugin ──> Solana RPC (mainnet)
              │
              └── Qwen3.5-27B on Nosana (free inference)
```

The agent uses:
- **ElizaOS v2** for the conversational framework and plugin system
- **Qwen3.5-27B** hosted on Nosana for natural language understanding
- **Solana JSON-RPC** for all blockchain data (no third-party APIs)
- **Custom plugin** (`src/index.ts`) with 7 blockchain actions

### Known Token Registry

SolSentry recognizes major Solana tokens by mint address:

| Token | Mint |
|-------|------|
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| mSOL | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So` |
| jitoSOL | `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn` |
| BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` |
| JUP | `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` |
| RENDER | `rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof` |

Unrecognized tokens show as shortened mint addresses.

---

## Deployment on Nosana

### Docker

```bash
docker build -t solsentry .
docker run -p 3000:3000 --env-file .env solsentry
```

### Nosana Network

1. Claim free builder credits at [nosana.com/builders-credits](https://nosana.com/builders-credits)
2. Use the Nosana job definition in `nos_job_def/`
3. Deploy via Nosana CLI:

```bash
nosana job post --file nos_job_def/job.json --market GPU
```

---

## Privacy Philosophy

SolSentry is built on the [OpenClaw](https://openclaw.ai/) principle: **your AI should work for you, not for a corporation.**

- All blockchain queries go directly to public Solana RPC endpoints
- The LLM runs on Nosana's decentralized GPU network, not centralized cloud
- No analytics, no tracking, no telemetry
- No wallet connection required — just paste an address
- Open source: audit every line of code

---

## Tech Stack

- **ElizaOS v2** — Agent framework with plugin architecture
- **Nosana** — Decentralized GPU compute on Solana
- **Qwen3.5-27B-AWQ-4bit** — Free inference via Nosana endpoint
- **Solana Web3 JSON-RPC** — Direct blockchain queries
- **TypeScript** — Type-safe plugin implementation
- **Docker** — Container-ready deployment

---

## Challenge Submission

This project is a submission for the [Nosana x ElizaOS Builder Challenge](https://earn.superteam.fun/listings/nosana-builders-elizaos-challenge) on Superteam Earn.

- **Video Demo:** [Link]
- **Deployment:** [Nosana URL]
- **Social Post:** [Link]

---

## License

MIT — Use it however you want. That's the point.

/**
 * SolSentry — Personal Solana Blockchain Monitor
 * 
 * Custom ElizaOS plugin for the Nosana x ElizaOS Builder Challenge.
 * Provides real-time Solana wallet monitoring, token tracking, and DeFi insights.
 * All data comes directly from Solana RPC — no centralized APIs, no data collection.
 */

import type { Plugin, Action, ActionExample, Memory, State, IAgentRuntime, Content, HandlerCallback } from "@elizaos/core";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000;

const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "So11111111111111111111111111111111111111112": { symbol: "wSOL", decimals: 9 },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": { symbol: "USDC", decimals: 6 },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT", decimals: 6 },
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": { symbol: "mSOL", decimals: 9 },
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": { symbol: "jitoSOL", decimals: 9 },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": { symbol: "BONK", decimals: 5 },
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": { symbol: "JUP", decimals: 6 },
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": { symbol: "ETH (Wormhole)", decimals: 8 },
  "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof": { symbol: "RENDER", decimals: 8 },
};

async function solanaRpc(method: string, params: unknown[]): Promise<unknown> {
  const resp = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = (await resp.json()) as { result?: unknown; error?: { message: string } };
  if (data.error) throw new Error(`RPC error: ${data.error.message}`);
  return data.result;
}

function extractWallet(text: string): string | null {
  const match = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  return match ? match[0] : null;
}

function shorten(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function ex(name: string, text: string, action?: string): ActionExample {
  return { name, content: { text, ...(action ? { actions: [action] } : {}) } };
}

// ============================================================
// ACTION: Check Wallet Balance
// ============================================================
const checkBalanceAction: Action = {
  name: "CHECK_WALLET_BALANCE",
  description: "Check the SOL balance of a Solana wallet address. Triggers when user asks about balance, wallet check, or provides a Solana address.",
  similes: ["CHECK_BALANCE", "WALLET_BALANCE", "GET_BALANCE", "SOL_BALANCE", "CHECK_WALLET", "SHOW_BALANCE"],
  validate: async (_runtime: IAgentRuntime, message: Memory, _state?: State) => {
    const text = (message.content.text || "").toLowerCase();
    return extractWallet(message.content.text || "") !== null || text.includes("balance") || text.includes("wallet");
  },
  handler: async (_runtime: IAgentRuntime, message: Memory, _state?: State, _options?: unknown, callback?: HandlerCallback) => {
    const wallet = extractWallet(message.content.text || "");
    if (!wallet) {
      if (callback) await callback({ text: "Please provide a valid Solana wallet address." });
      return;
    }
    try {
      const result = (await solanaRpc("getBalance", [wallet])) as { value: number };
      const sol = result.value / LAMPORTS_PER_SOL;
      if (callback) await callback({
        text: `💰 **Wallet ${shorten(wallet)}**\n\n**SOL Balance:** ${sol.toFixed(4)} SOL\n\n_Data fetched directly from Solana mainnet via decentralized infrastructure._`,
      });
    } catch (err) {
      if (callback) await callback({ text: `⚠️ Error checking balance: ${(err as Error).message}` });
    }
  },
  examples: [
    [ex("{{user1}}", "Check wallet 6Rx5arD2bowuE4rWhd8KWnaD7kVvixU93aQistJABAGq"), ex("SolSentry", "💰 Wallet 6Rx5...BAGq\n\nSOL Balance: 0.8018 SOL", "CHECK_WALLET_BALANCE")],
  ],
};

// ============================================================
// ACTION: Get Token Holdings
// ============================================================
const getTokensAction: Action = {
  name: "GET_TOKEN_HOLDINGS",
  description: "Get all SPL token holdings for a Solana wallet. Shows token balances, symbols, and mint addresses.",
  similes: ["TOKEN_BALANCE", "TOKEN_HOLDINGS", "SHOW_TOKENS", "MY_TOKENS", "SPL_TOKENS", "PORTFOLIO", "HOLDINGS"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content.text || "").toLowerCase();
    return text.includes("token") || text.includes("holding") || text.includes("portfolio") || text.includes("spl");
  },
  handler: async (_runtime: IAgentRuntime, message: Memory, _state?: State, _options?: unknown, callback?: HandlerCallback) => {
    const wallet = extractWallet(message.content.text || "");
    if (!wallet) {
      if (callback) await callback({ text: "Please provide a Solana wallet address to check token holdings." });
      return;
    }
    try {
      const result = (await solanaRpc("getTokenAccountsByOwner", [
        wallet,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" },
      ])) as { value: Array<{ account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number } } } } } }> };

      const tokens = result.value
        .map((t) => {
          const info = t.account.data.parsed.info;
          const known = KNOWN_TOKENS[info.mint];
          return { symbol: known?.symbol || shorten(info.mint), amount: info.tokenAmount.uiAmount };
        })
        .filter((t) => t.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      if (tokens.length === 0) {
        if (callback) await callback({ text: `📊 Wallet ${shorten(wallet)} has no SPL token holdings.` });
        return;
      }

      let output = `📊 **Token Holdings for ${shorten(wallet)}**\n\n`;
      for (const t of tokens.slice(0, 20)) {
        output += `• **${t.symbol}**: ${t.amount.toLocaleString()}\n`;
      }
      if (tokens.length > 20) output += `\n_...and ${tokens.length - 20} more tokens_\n`;
      output += `\n_Total: ${tokens.length} tokens | Fetched from Solana mainnet_`;
      if (callback) await callback({ text: output });
    } catch (err) {
      if (callback) await callback({ text: `⚠️ Error fetching tokens: ${(err as Error).message}` });
    }
  },
  examples: [
    [ex("{{user1}}", "Show tokens in wallet 6Rx5arD2bowuE4rWhd8KWnaD7kVvixU93aQistJABAGq"), ex("SolSentry", "📊 Token Holdings for 6Rx5...BAGq", "GET_TOKEN_HOLDINGS")],
  ],
};

// ============================================================
// ACTION: Get Recent Transactions
// ============================================================
const getTransactionsAction: Action = {
  name: "GET_RECENT_TRANSACTIONS",
  description: "Get recent transactions for a Solana wallet. Shows signatures, status, and timestamps.",
  similes: ["RECENT_TRANSACTIONS", "TRANSACTION_HISTORY", "TX_HISTORY", "ACTIVITY", "RECENT_ACTIVITY"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content.text || "").toLowerCase();
    return text.includes("transaction") || text.includes("history") || text.includes("activity") || text.includes("tx");
  },
  handler: async (_runtime: IAgentRuntime, message: Memory, _state?: State, _options?: unknown, callback?: HandlerCallback) => {
    const wallet = extractWallet(message.content.text || "");
    if (!wallet) {
      if (callback) await callback({ text: "Please provide a Solana wallet address to check transactions." });
      return;
    }
    try {
      const sigs = (await solanaRpc("getSignaturesForAddress", [wallet, { limit: 10 }])) as Array<{
        signature: string; blockTime: number | null; err: unknown; memo: string | null;
      }>;

      if (sigs.length === 0) {
        if (callback) await callback({ text: `📋 No recent transactions found for ${shorten(wallet)}.` });
        return;
      }

      let output = `📋 **Recent Transactions for ${shorten(wallet)}**\n\n`;
      for (const tx of sigs) {
        const time = tx.blockTime ? new Date(tx.blockTime * 1000).toISOString().replace("T", " ").slice(0, 19) : "unknown";
        const status = tx.err ? "❌ Failed" : "✅ Success";
        output += `• ${status} | ${time}\n  \`${tx.signature.slice(0, 20)}...\`\n`;
      }
      output += `\n_Showing last ${sigs.length} transactions | Solana mainnet_`;
      if (callback) await callback({ text: output });
    } catch (err) {
      if (callback) await callback({ text: `⚠️ Error fetching transactions: ${(err as Error).message}` });
    }
  },
  examples: [
    [ex("{{user1}}", "Show recent transactions for 6Rx5arD2bowuE4rWhd8KWnaD7kVvixU93aQistJABAGq"), ex("SolSentry", "📋 Recent Transactions for 6Rx5...BAGq", "GET_RECENT_TRANSACTIONS")],
  ],
};

// ============================================================
// ACTION: Get Account Info
// ============================================================
const getAccountInfoAction: Action = {
  name: "GET_ACCOUNT_INFO",
  description: "Get detailed account information for a Solana address — type, owner program, data size.",
  similes: ["ACCOUNT_INFO", "ACCOUNT_DETAILS", "LOOKUP_ADDRESS", "ADDRESS_INFO"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content.text || "").toLowerCase();
    return text.includes("account") || text.includes("info") || text.includes("lookup") || text.includes("details");
  },
  handler: async (_runtime: IAgentRuntime, message: Memory, _state?: State, _options?: unknown, callback?: HandlerCallback) => {
    const wallet = extractWallet(message.content.text || "");
    if (!wallet) {
      if (callback) await callback({ text: "Please provide a Solana address to look up." });
      return;
    }
    try {
      const info = (await solanaRpc("getAccountInfo", [wallet, { encoding: "jsonParsed" }])) as {
        value: { lamports: number; owner: string; executable: boolean; rentEpoch: number } | null;
      };

      if (!info.value) {
        if (callback) await callback({ text: `⚠️ Account ${shorten(wallet)} not found.` });
        return;
      }

      const acc = info.value;
      const sol = acc.lamports / LAMPORTS_PER_SOL;
      const ownerLabels: Record<string, string> = {
        "11111111111111111111111111111111": "System Program (wallet)",
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
        "Stake11111111111111111111111111111111111111": "Stake Program",
        "Vote111111111111111111111111111111111111111": "Vote Program (validator)",
      };

      let output = `🔍 **Account Info: ${shorten(wallet)}**\n\n`;
      output += `• **Balance:** ${sol.toFixed(4)} SOL\n`;
      output += `• **Owner:** ${ownerLabels[acc.owner] || shorten(acc.owner)}\n`;
      output += `• **Executable:** ${acc.executable ? "Yes (program)" : "No"}\n`;
      if (callback) await callback({ text: output });
    } catch (err) {
      if (callback) await callback({ text: `⚠️ Error: ${(err as Error).message}` });
    }
  },
  examples: [
    [ex("{{user1}}", "Get account info for 6Rx5arD2bowuE4rWhd8KWnaD7kVvixU93aQistJABAGq"), ex("SolSentry", "🔍 Account Info: 6Rx5...BAGq", "GET_ACCOUNT_INFO")],
  ],
};

// ============================================================
// ACTION: Network Status
// ============================================================
const networkStatusAction: Action = {
  name: "SOLANA_NETWORK_STATUS",
  description: "Check Solana network health — current slot, epoch, TPS, supply.",
  similes: ["NETWORK_STATUS", "SOLANA_STATUS", "NETWORK_HEALTH", "TPS", "EPOCH", "IS_SOLANA_UP"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content.text || "").toLowerCase();
    return text.includes("network") || text.includes("status") || text.includes("tps") || text.includes("epoch") || text.includes("health");
  },
  handler: async (_runtime: IAgentRuntime, _message: Memory, _state?: State, _options?: unknown, callback?: HandlerCallback) => {
    try {
      const [slot, epoch, perf, supply] = await Promise.all([
        solanaRpc("getSlot", []) as Promise<number>,
        solanaRpc("getEpochInfo", []) as Promise<{ epoch: number; slotIndex: number; slotsInEpoch: number }>,
        solanaRpc("getRecentPerformanceSamples", [1]) as Promise<Array<{ numTransactions: number; samplePeriodSecs: number }>>,
        solanaRpc("getSupply", []) as Promise<{ value: { total: number; circulating: number } }>,
      ]);

      const tps = perf[0] ? Math.round(perf[0].numTransactions / perf[0].samplePeriodSecs) : 0;
      const epochProgress = ((epoch.slotIndex / epoch.slotsInEpoch) * 100).toFixed(1);

      let output = `🌐 **Solana Network Status**\n\n`;
      output += `• **Current Slot:** ${(slot as number).toLocaleString()}\n`;
      output += `• **Epoch:** ${epoch.epoch} (${epochProgress}% complete)\n`;
      output += `• **TPS:** ~${tps.toLocaleString()} tx/sec\n`;
      output += `• **Total Supply:** ${(supply.value.total / LAMPORTS_PER_SOL / 1e6).toFixed(1)}M SOL\n`;
      output += `• **Circulating:** ${(supply.value.circulating / LAMPORTS_PER_SOL / 1e6).toFixed(1)}M SOL\n`;
      output += `\n_Live data from Solana mainnet_`;
      if (callback) await callback({ text: output });
    } catch (err) {
      if (callback) await callback({ text: `⚠️ Error: ${(err as Error).message}` });
    }
  },
  examples: [
    [ex("{{user1}}", "How is the Solana network doing?"), ex("SolSentry", "🌐 Solana Network Status", "SOLANA_NETWORK_STATUS")],
  ],
};

// ============================================================
// ACTION: Check Stake Accounts
// ============================================================
const checkStakeAction: Action = {
  name: "CHECK_STAKE_ACCOUNTS",
  description: "Check staking positions for a Solana wallet — active delegations, validators, rewards.",
  similes: ["CHECK_STAKE", "STAKING", "STAKE_ACCOUNTS", "MY_STAKES", "VALIDATOR", "DELEGATED"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content.text || "").toLowerCase();
    return text.includes("stake") || text.includes("staking") || text.includes("delegat") || text.includes("validator");
  },
  handler: async (_runtime: IAgentRuntime, message: Memory, _state?: State, _options?: unknown, callback?: HandlerCallback) => {
    const wallet = extractWallet(message.content.text || "");
    if (!wallet) {
      if (callback) await callback({ text: "Please provide a Solana wallet address to check stake accounts." });
      return;
    }
    try {
      const result = (await solanaRpc("getProgramAccounts", [
        "Stake11111111111111111111111111111111111111",
        { encoding: "jsonParsed", filters: [{ memcmp: { offset: 12, bytes: wallet } }] },
      ])) as Array<{
        pubkey: string;
        account: { lamports: number; data: { parsed: { info: { stake?: { delegation: { voter: string; activationEpoch: string } } }; type: string } } };
      }>;

      if (result.length === 0) {
        if (callback) await callback({ text: `🥩 No stake accounts found for ${shorten(wallet)}.` });
        return;
      }

      let totalStaked = 0;
      let output = `🥩 **Stake Accounts for ${shorten(wallet)}**\n\n`;
      for (const acc of result.slice(0, 10)) {
        const sol = acc.account.lamports / LAMPORTS_PER_SOL;
        totalStaked += sol;
        const parsed = acc.account.data.parsed;
        if (parsed.type === "delegated" && parsed.info.stake) {
          output += `• **${sol.toFixed(4)} SOL** → Validator ${shorten(parsed.info.stake.delegation.voter)}\n`;
        } else {
          output += `• **${sol.toFixed(4)} SOL** (${parsed.type})\n`;
        }
      }
      output += `\n**Total Staked:** ${totalStaked.toFixed(4)} SOL`;
      if (callback) await callback({ text: output });
    } catch (err) {
      if (callback) await callback({ text: `⚠️ Error checking stakes: ${(err as Error).message}` });
    }
  },
  examples: [
    [ex("{{user1}}", "Check staking for 6Rx5arD2bowuE4rWhd8KWnaD7kVvixU93aQistJABAGq"), ex("SolSentry", "🥩 Stake Accounts for 6Rx5...BAGq", "CHECK_STAKE_ACCOUNTS")],
  ],
};

// ============================================================
// PLUGIN EXPORT
// ============================================================
export const customPlugin: Plugin = {
  name: "solsentry-plugin",
  description: "SolSentry — Personal Solana blockchain monitor with wallet tracking, token balances, transaction history, staking info, and network status.",
  actions: [checkBalanceAction, getTokensAction, getTransactionsAction, getAccountInfoAction, networkStatusAction, checkStakeAction],
  providers: [],
  evaluators: [],
};

export default customPlugin;

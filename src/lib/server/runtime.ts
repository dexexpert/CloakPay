import { createHash } from "crypto";
import { readFileSync } from "fs";
import path from "path";

import { Keypair } from "@solana/web3.js";

import { RuntimeInfo, RuntimeMode } from "@/lib/types";

const DEFAULT_MINTS = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
} as const;

function envFlag(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

function getTreasuryKeypair() {
  const rawSecret = process.env.CLOAK_TREASURY_SECRET_KEY_JSON;
  if (rawSecret) {
    const secret = Uint8Array.from(JSON.parse(rawSecret) as number[]);
    return Keypair.fromSecretKey(secret);
  }

  const keypairPath = process.env.CLOAK_TREASURY_KEYPAIR_PATH;
  if (!keypairPath) {
    return null;
  }

  const resolvedPath = path.isAbsolute(keypairPath) ? keypairPath : path.join(process.cwd(), keypairPath);
  const secret = Uint8Array.from(JSON.parse(readFileSync(resolvedPath, "utf8")) as number[]);
  return Keypair.fromSecretKey(secret);
}

function getDemoTreasuryWallet() {
  const source = process.env.NEXT_PUBLIC_ORG_NAME ?? "CloakPay Demo DAO";
  const digest = createHash("sha256").update(source).digest("hex").slice(0, 32);
  return `demo-${digest}`;
}

export function getRuntimeInfo(): RuntimeInfo {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const relayUrl = process.env.CLOAK_RELAY_URL ?? process.env.NEXT_PUBLIC_CLOAK_RELAY_URL ?? "https://api.cloak.ag";
  const requestedLiveMode = !envFlag(process.env.CLOAKPAY_USE_DEMO_MODE ?? process.env.NEXT_PUBLIC_USE_DEMO_MODE, true);
  const treasuryKeypair = getTreasuryKeypair();
  const isLiveConfigured = Boolean(treasuryKeypair);
  const mode: RuntimeMode = requestedLiveMode && isLiveConfigured ? "live" : "demo";

  return {
    mode,
    organizationName: process.env.NEXT_PUBLIC_ORG_NAME ?? "CloakPay Demo DAO",
    treasuryWallet: treasuryKeypair?.publicKey.toBase58() ?? getDemoTreasuryWallet(),
    relayUrl,
    rpcUrl,
    isLiveConfigured,
    note:
      mode === "live"
        ? "Live signer mode is active. Batches execute through the server-side treasury signer."
        : requestedLiveMode
          ? "Live mode was requested, but no treasury keypair was configured. Falling back to demo execution."
          : "Demo execution is active. Backend persistence and API flows are real; Cloak transactions are simulated.",
    tokenSupport: [
      {
        token: "SOL",
        livePayroll: true,
        liveClaim: true,
        note: "Full live Cloak flow is enabled for SOL: shielding, private payroll transfers, recipient withdrawal, and chain-scanned audit.",
      },
      {
        token: "USDC",
        livePayroll: true,
        liveClaim: true,
        mintAddress: process.env.CLOAK_USDC_MINT ?? DEFAULT_MINTS.USDC,
        note: "Live payroll and recipient withdrawal are executed through Cloak relay-backed SPL flows, with audit derived from registered chain notes.",
      },
      {
        token: "USDT",
        livePayroll: true,
        liveClaim: true,
        mintAddress: process.env.CLOAK_USDT_MINT ?? DEFAULT_MINTS.USDT,
        note: "Live payroll and recipient withdrawal are executed through Cloak relay-backed SPL flows, with audit derived from registered chain notes.",
      },
    ],
  };
}

export function requireTreasuryKeypair() {
  const keypair = getTreasuryKeypair();
  if (!keypair) {
    throw new Error("Treasury keypair is not configured. Set CLOAK_TREASURY_SECRET_KEY_JSON or CLOAK_TREASURY_KEYPAIR_PATH.");
  }

  return keypair;
}

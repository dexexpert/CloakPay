import Papa from "papaparse";
import { z } from "zod";

import { PayrollRecipientInput } from "@/lib/types";

const walletPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const recipientSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  wallet: z
    .string()
    .trim()
    .regex(walletPattern, "Wallet must look like a valid Solana address"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
});

export const batchSchema = z.object({
  title: z.string().trim().min(4, "Batch title must be at least 4 characters"),
  token: z.enum(["USDC", "USDT", "SOL"]),
  recipients: z.array(recipientSchema).min(1, "Add at least one recipient"),
});

export function parsePayrollCsv(csvText: string): PayrollRecipientInput[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Unable to parse CSV");
  }

  // Load rows leniently so users can review and fix them in the UI; strict validation runs at submit.
  return parsed.data
    .map((row) => {
      const name = (row.name ?? "").trim();
      const wallet = (row.wallet ?? "").trim();
      const rawAmount = (row.amount ?? "").trim();
      const amount = rawAmount === "" ? 0 : Number(rawAmount);

      return {
        name,
        wallet,
        amount: Number.isFinite(amount) ? amount : 0,
      } satisfies PayrollRecipientInput;
    })
    .filter((row) => row.name !== "" || row.wallet !== "" || row.amount > 0);
}

export function validateRecipients(recipients: PayrollRecipientInput[]) {
  const wallets = new Set<string>();

  recipients.forEach((recipient) => {
    recipientSchema.parse(recipient);

    if (wallets.has(recipient.wallet)) {
      throw new Error(`Duplicate wallet detected: ${recipient.wallet}`);
    }

    wallets.add(recipient.wallet);
  });
}

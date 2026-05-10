# Demo Video Plan (under 5 minutes)

The Cloak track rubric explicitly asks the video to "show the product working end to end" and "explain the decisions you made, not just what the product does." This script is built around that brief. The total target length is **4:30 to 4:45**, leaving headroom under the 5-minute hard cap.

## Pre-record checklistloo

Run this before opening the recorder. A retake is much cheaper than a re-deploy.

- `npm run dev` (or open the deployed Vercel URL) and confirm `/dashboard`, `/audit`, and a recipient claim link all load without console errors.
- Demo mode is the recommended recording mode (`CLOAKPAY_USE_DEMO_MODE=true`). It exercises the real backend, persistence, claim links, and audit sessions, while skipping unfunded on-chain calls — judges can still test the same flow locally.
- Wait for `/dashboard` to fully hydrate (the treasury wallet should no longer read `loading...` in the connect panel).
- Have `src/data/sample-payroll.csv` ready in the OS file picker; the three wallets in it are pre-validated base58 (`new PublicKey` round-trip checked).
- Reset persistence if you want a clean run: delete `.data/cloakpay-state.json`, then refresh `/dashboard`. The seed batches reload automatically.
- Have one browser tab on `/dashboard`, a second tab ready for a claim link, and a third on `/audit`. Switching tabs reads better on camera than navigating in one tab.

## Recording structure

### 0:00 - 0:30 — Problem (real-world use, 30%)

Open with the landing page (`/`). One sentence on what's broken: every Solana transaction is public by default, which means salary amounts, treasury timing, and counterparty relationships are permanently readable by competitors, contractors, and indexers. State the target user out loud: crypto-native finance teams, DAOs, agencies, and startups paying contractors in stablecoins. End with the thesis: privacy isn't a feature here, it's a precondition for the product to be usable.

### 0:30 - 1:00 — What the product is (product, 30%)

Click into `/dashboard`. Point out the three integration touchpoints visible on screen:

1. The connect/runtime panel showing demo vs live mode, treasury wallet, and supported tokens.
2. The metric cards (batches, private volume, recipients, pending claims) — this is real backend state, not mocked.
3. The payroll composer that we're about to drive.

Say explicitly: "The backend, persistence, claim links, and audit sessions are real. The Cloak SDK calls are simulated in demo mode so judges can run this without funded wallets — switching `CLOAKPAY_USE_DEMO_MODE` to `false` and providing a treasury keypair routes the same code path through real Cloak transactions." That sentence is what protects you on the integration-depth score even when the recorded run is in demo mode.

### 1:00 - 2:30 — End-to-end private payroll run (integration depth, 40%)

This is the core 90 seconds — judges will watch this section the closest.

1. Click **Upload CSV** and pick `src/data/sample-payroll.csv`. Three recipients populate.
2. Walk the right-hand summary: total private payroll, ready recipients, settlement rail. Edit the title or note inline so it's clear the form is live.
3. Click **Shield funds and run payroll**. Narrate what's happening on the backend while the button is busy:
   - The recipients are validated through Zod (`batchSchema`) and deduped.
   - In live mode, the treasury keypair signs a `transact` deposit that creates the initial shielded UTXOs (`createUtxo` + `createZeroUtxo`).
   - For each recipient, `selectUtxos` picks shielded inputs and `transfer` produces a private transfer to a fresh `generateUtxoKeypair()` keypair owned by the claim vault. The recipient never appears as a destination on the public ledger.
   - Each transfer's signature is stored as a private reference.
4. The batch row flips to `completed`. Open the row to show the recipients and their private references.

Two beats to hit verbally during this clip, both worth points:

- **Why batched, not single-payment:** "We run one shielded batch instead of N independent payments because batching prevents an observer from correlating payroll runs by counting on-chain transfers per cycle."
- **Why shield-then-pay, not direct transfer:** "Shielding the treasury before fan-out means that even the source treasury balance change is decoupled from the disbursement — competitors watching the public wallet don't see a payroll-shaped outflow."

### 2:30 - 3:20 — Recipient claim experience (product, 30%)

Click any recipient's claim link. The claim page shows only that recipient's name, amount, and a confirmation button — not the rest of the roster. Point out:        

- The link is recipient-scoped: a contractor cannot see anyone else's payment by holding their own claim URL.
- Clicking **Confirm private receipt** runs the claim path. In live mode this is a real `fullWithdraw` to the recipient's destination wallet using the stored UTXO; in demo mode it just transitions state.
- The status pill flips to `claimed` and persists across refresh, because the backend writes through `state.ts`.

### 3:20 - 4:20 — Selective audit via viewing key (integration depth, 40%)

Open `/audit`. This is the section that lifts you above projects that only do "private send."

1. Pick the batch you just ran from the dropdown and click **Generate key**. A fresh `vk_*` viewing key appears, and a new audit session is recorded with a 30-day expiry.
2. Click **View report**. The compliance table renders with type, recipient, amount, fee, and signature columns.
   - In live mode, this is `scanTransactions(...)` from the Cloak SDK piped through `toComplianceReport(...)` — it's reading actual chain notes through the viewing key, not a database mirror.
   - In demo mode it's a deterministic projection of the recorded batch so the UX is identical for judges.
3. Click **Export CSV**. The download is produced through `formatComplianceCsv` in live mode, which is the same shape the SDK ships for tax/regulatory consumers.

Verbal beat: "The viewing key is scoped to one batch and revocable — finance gets full visibility, an external auditor only sees the rows they need, and the public ledger still shows nothing. That's the part of the Cloak surface that turns this from 'private payments' into 'auditable private payments,' which is what makes it a real business product."

### 4:20 - 4:45 — Close (real-world use, 30%)

Recap in one breath: target user (Solana teams paying contractors in stablecoins), the load-bearing privacy guarantee (without Cloak the product can't exist), and the two-mode design (demo lets judges click through, live runs real shielded transactions through the same code paths). Cut to the GitHub repo URL and the deployed Vercel URL on screen as the last frame.

## Decisions worth naming on camera

The rubric specifically rewards explaining decisions. Pick three of these to hit during the recording — don't try to say all of them.

- **Server-side treasury signer over wallet popups.** Payroll is an operator workflow, not a per-transaction wallet experience. The treasury keypair lives on the server (`runtime.ts:22`) so a finance lead drives one batch, not seven wallet prompts.
- **Demo mode by default.** Real backend, simulated SDK calls. Lets judges validate the product without funded wallets, while keeping the live path on the same code (`payroll-service.ts:88`) so the integration is genuine.
- **Per-recipient claim vaults plus per-recipient claim URLs.** A recipient's URL reveals only their slice of the batch. Contractors don't see each other's salaries — that property would be lost if the batch were shared as a single page.
- **Viewing keys are scoped per audit session.** Each audit session gets its own `vk_*` key with an expiry, so revocation is a state mutation, not a key rotation event.
- **Persistence in JSON-backed state.** A judge resetting a demo by deleting `.data/cloakpay-state.json` is a feature, not a workaround — it makes the product trivially reproducible.

## What NOT to do on camera

- Don't switch into live mode mid-recording without a funded treasury keypair — a half-failed live transfer reads worse than a clean demo run.
- Don't read the README out loud. Judges have already read it; the video should add the "why," not repeat the "what."
- Don't show terminal logs unless something goes wrong — UI-first reads as a finished product, terminal-first reads as a prototype.
- Don't claim the batch is a single on-chain transaction. The implementation runs one shielded `transfer` per recipient inside one operator action; describe it as "a batched private payroll run," which is what it is.

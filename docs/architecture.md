# Architecture

## Product Thesis

CloakPay is a private payroll workspace for Solana-native teams. Privacy is load-bearing: without shielded execution, the product does not solve the payroll problem.

## App Layers

### UI

- Landing page for story and positioning
- Dashboard for batch creation and execution
- Claim page for recipient-facing confirmation
- Audit page for selective disclosure

### Domain

- Payroll batch, recipient, audit session, and status types live in `src/lib/types.ts`
- Validation and CSV parsing live in `src/lib/validation/payroll.ts`

### Persistence

- Backend state storage lives in `src/lib/server/state.ts`
- Initial seed data lives in `src/lib/demo-data.ts`

### Cloak Integration

- `src/lib/server/runtime.ts` resolves mode, signer, RPC, relay, and token support
- `src/lib/server/cloak-runtime.ts` executes demo/live payroll and claim flows
- `src/lib/server/payroll-service.ts` coordinates batches, claims, and audit sessions
- App routes under `src/app/api/*` expose the backend to the frontend

## Runtime Modes

### Demo mode

Enabled by default. Uses the real backend, API routes, state persistence, claim links, and audit sessions without requiring funded wallets or on-chain funds.

### Live integration mode

Turn off `CLOAKPAY_USE_DEMO_MODE` and provide a treasury signer. The backend will execute live Cloak flows.

- `SOL` supports shield, private payroll, claim withdrawal, and chain-scanned audit.
- `USDC` and `USDT` support live mint-scoped payroll, relay-backed recipient withdrawal, and chain-scanned audit.

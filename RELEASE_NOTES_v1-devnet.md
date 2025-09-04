# V1-devnet: Real SOL → Treasury + SPL Memo

This release enables real SOL bets on Devnet, transferring funds to a configured treasury address with an SPL Memo describing the bet.

## Features

- Real transfer path (when `NEXT_PUBLIC_MOCK_TX=0`):
  - Sends entire bet amount (SOL) to `NEXT_PUBLIC_PROTOCOL_TREASURY` via `SystemProgram.transfer`.
  - Attaches SPL Memo (JSON): `{ "t": "bet", "v": 1, "m": <marketId>, "s": <side>, "feeBps": <bps> }`.
  - Toasts: "Sending transaction…" → "Bet placed" + "View on Explorer" (Explorer URL includes `?cluster=devnet`).
- Mock path (when `NEXT_PUBLIC_MOCK_TX=1`): simulated success toast and no transfer.
- CTA shows fee/net computed in lamports: `Fee 0.01 • Net 0.49` for `0.5 SOL` with `200 bps`.
- Accessible UI: clickable market cards, polite live-region toasts, focus handling.

## Limitations

- No on-chain program logic yet (pure transfer + memo).
- No automatic reconciliation or payout logic.
- Explorer DOM varies; automated “To” address verification is best-effort in tests.

## Test steps (manual happy-path)

1. Set `.env.local`:
   ```bash
   NEXT_PUBLIC_CLUSTER=devnet
   NEXT_PUBLIC_PROTOCOL_TREASURY=<your_devnet_treasury_pubkey>
   NEXT_PUBLIC_FEE_BPS=200
   NEXT_PUBLIC_MOCK_TX=0
   ```
2. Start dev server: `npm run dev` (http://localhost:3000)
3. Connect Phantom (Devnet). Airdrop if balance < 0.6 SOL.
4. Open `/market/1`, choose YES, enter `0.5`.
5. Expect CTA: `Place 0.5 SOL Bet • Fee 0.01 • Net 0.49`.
6. Click CTA, sign in Phantom. Expect toasts and Explorer link.
7. In Explorer: `?cluster=devnet`, "System Program: Transfer" → To = treasury, amount ≈ 0.5, SPL Memo shown.

## Scripts

- Unit tests: `npm run unit`
- E2E mock: `npm run test:e2e:mock`
- E2E real (semi-automatic): `npm run test:e2e:real`

## Environment

- Devnet only in this release. Treasury must be a valid base58 public key.

# bot-blocker-validation

Shopify cart & checkout validation function. Blocks any cart that contains a line item priced at $0 — the signature move of card-testing bots that abuse free/sample products to probe stolen cards.

## How it works

- Target: `cart.validations.generate.run` (Shopify Functions, API 2026-10).
- Runs on `CHECKOUT_INTERACTION` and `CHECKOUT_COMPLETION`.
- Scans every line in the cart. If any one of the following is `<= 0` it blocks:
  - `line.cost.amountPerQuantity.amount`
  - `line.cost.totalAmount.amount`
  - `line.merchandise.price.amount` (variant price)
- Returns a single error against `$.cart`, which Shopify surfaces at checkout.

## Local commands

```bash
# From this directory
npm run typegen   # Regenerate generated/api.ts from the GraphQL input query
npm run build     # Compile JS → WASM via Javy
npm run preview   # Dry-run with a sample input
```

## Why this is bot-resistant

Scripts and theme-level checks run in the browser and are trivially bypassed by scripted checkouts. Cart validation functions run on Shopify's servers, before payment is attempted — a bot can't skip them.

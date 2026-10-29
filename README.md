# Bot Blocker

Shopify app that stops card-testing bots at checkout.

**Phase 1 (shipped):** block any cart that contains a $0 line item.

Card-testing bots probe stolen credit cards by abusing free or $0-priced products (sample bottles, gift-with-purchase, mis-priced variants). Bot Blocker runs a Shopify cart & checkout validation function on Shopify's servers, so these carts never reach the payment step — scripted requests can't bypass it the way they bypass theme-level or client-side checks.

## Architecture

```
Shopify Admin  ──embed──▶  Remix app (this repo, app/)
                              └── /app  dashboard with on/off toggle
                              └── Prisma  SQLite  shop settings

Shopify cart   ──runs──▶   Function: extensions/bot-blocker-validation
                              target: cart.validations.generate.run
                              api:    2026-10
                              build:  JavaScript → WASM via Javy
```

### Function behaviour

Target `cart.validations.generate.run` (JS → WASM). On `CHECKOUT_INTERACTION` and `CHECKOUT_COMPLETION`, scans every line in the cart. A line is flagged $0 if any of:

- `line.cost.amountPerQuantity.amount` ≤ 0
- `line.cost.totalAmount.amount` ≤ 0
- `line.merchandise.price.amount` ≤ 0 (variant price)

If flagged, returns a single validation error against `$.cart`. The checkout button is blocked and Shopify displays the error message.

Source: [extensions/bot-blocker-validation/src/cart_validations_generate_run.js](extensions/bot-blocker-validation/src/cart_validations_generate_run.js)

## Local development

```bash
# One-time
npm install
npm run setup                 # prisma generate + migrate

# Link to a Shopify Partner app (interactive)
shopify app config link

# Dev loop — tunnels to a dev store, hot-reloads function + app
npm run dev
```

To build the function in isolation:

```bash
cd extensions/bot-blocker-validation
npm run typegen               # regenerates generated/api.ts
npm run build                 # produces dist/function.wasm
npm run preview               # dry-run with a sample input
```

## Deploy

```bash
npm run deploy                # pushes app config + function to the linked Partner app
```

After deploy, install on a store and enable the validation under
**Settings → Checkout → Validations → bot-blocker-validation**.

## Roadmap

- Block carts above risk-score threshold
- Rate-limit new-customer checkouts by IP
- Block checkout from high-risk BIN ranges
- Allowlist for staff / test accounts
- Admin UI: cart-block log (which bots were stopped, when)

## License

UNLICENSED — © Soar Studio

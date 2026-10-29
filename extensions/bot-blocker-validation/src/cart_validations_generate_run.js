// @ts-check

/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 */

const ZERO_PRICE_MESSAGE =
  "This cart contains an item priced at $0 and can't be checked out. Please contact the store if you believe this is an error.";

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */
export function cartValidationsGenerateRun(input) {
  const step = input.buyerJourney?.step;
  if (step && step !== "CHECKOUT_INTERACTION" && step !== "CHECKOUT_COMPLETION") {
    return { operations: [] };
  }

  const errors = [];
  let flaggedZeroPrice = false;

  for (const line of input.cart.lines) {
    const perUnit = parseFloat(line.cost?.amountPerQuantity?.amount ?? "0");
    const lineTotal = parseFloat(line.cost?.totalAmount?.amount ?? "0");

    let variantPrice = Number.NaN;
    if (line.merchandise.__typename === "ProductVariant") {
      variantPrice = parseFloat(line.merchandise.price?.amount ?? "0");
    }

    const isZero =
      (!isNaN(perUnit) && perUnit <= 0) ||
      (!isNaN(lineTotal) && lineTotal <= 0) ||
      (!isNaN(variantPrice) && variantPrice <= 0);

    if (isZero) {
      flaggedZeroPrice = true;
      break;
    }
  }

  if (flaggedZeroPrice) {
    errors.push({
      message: ZERO_PRICE_MESSAGE,
      target: "$.cart",
    });
  }

  return {
    operations: [
      {
        validationAdd: { errors },
      },
    ],
  };
}

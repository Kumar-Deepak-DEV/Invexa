const mongoose = require('mongoose');
const ApiError = require('../errors/ApiError');
const { toDecimal, toDecimal128 } = require('./decimalHelper');

/**
 * Validates line items array for Receipts, Deliveries, and Transfers:
 * - Checks for duplicate productIds (400 DUPLICATE_LINE_ITEM)
 * - Checks that quantity > 0 for every line (400 INVALID_QUANTITY)
 * - Returns formatted lines with Decimal128 quantities
 */
function validateLineItems(lines, { isValidateAction = false } = {}) {
  if (isValidateAction && (!lines || lines.length === 0)) {
    throw new ApiError(400, 'EMPTY_DOCUMENT', 'Document has no line items to validate');
  }

  if (!lines || lines.length === 0) {
    return [];
  }

  const seenProducts = new Set();
  const formattedLines = [];

  for (const line of lines) {
    if (!line.productId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Each line item must contain a valid productId');
    }

    const prodIdStr = line.productId.toString();
    if (seenProducts.has(prodIdStr)) {
      throw new ApiError(400, 'DUPLICATE_LINE_ITEM', `Duplicate line item for productId: ${prodIdStr}`);
    }
    seenProducts.add(prodIdStr);

    const rawQty = line.quantity !== undefined ? line.quantity : (line.receivedQty !== undefined ? line.receivedQty : (line.requestedQty !== undefined ? line.requestedQty : line.expectedQty));
    const decQty = toDecimal(rawQty);
    if (decQty.isNegative() || decQty.isZero()) {
      throw new ApiError(400, 'INVALID_QUANTITY', `Quantity for productId ${prodIdStr} must be greater than 0`);
    }

    formattedLines.push({
      productId: new mongoose.Types.ObjectId(line.productId),
      quantity: toDecimal128(decQty)
    });
  }

  return formattedLines;
}

module.exports = {
  validateLineItems
};

'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.safeId = void 0;
const node_crypto_1 = require('node:crypto');
/**
 * Correlation-safe identifier for logs. Keep operational traces useful without putting user IDs,
 * email addresses, coupon codes, or storage paths into the log stream.
 */
const safeId = (value) =>
  (0, node_crypto_1.createHash)('sha256')
    .update(String(value ?? ''))
    .digest('hex')
    .slice(0, 12);
exports.safeId = safeId;

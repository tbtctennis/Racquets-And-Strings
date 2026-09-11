'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.normalizeCouponCode = normalizeCouponCode;
exports.optionalTrimmedString = optionalTrimmedString;
exports.requireAuth = requireAuth;
exports.requireTrimmedString = requireTrimmedString;
const https_1 = require('firebase-functions/v2/https');
function requireAuth(request) {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new https_1.HttpsError('unauthenticated', 'Sign in to continue.');
  return uid;
}
function requireTrimmedString(value, message, options = {}) {
  if (typeof value !== 'string') {
    throw new https_1.HttpsError('invalid-argument', message);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new https_1.HttpsError('invalid-argument', message);
  }
  if (typeof options.maxLength === 'number' && trimmed.length > options.maxLength) {
    throw new https_1.HttpsError('invalid-argument', message);
  }
  return trimmed;
}
function optionalTrimmedString(value, options = {}) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (typeof options.maxLength === 'number' && trimmed.length > options.maxLength) {
    throw new https_1.HttpsError('invalid-argument', 'Text is too long.');
  }
  return trimmed;
}
function normalizeCouponCode(value) {
  return requireTrimmedString(value, 'Missing coupon code.').toUpperCase();
}

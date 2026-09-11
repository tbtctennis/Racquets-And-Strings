/**
 * Drop keys whose values are `undefined` so the rest is assignable under
 * `exactOptionalPropertyTypes` (optional properties may be omitted, but not set to undefined).
 */
export function omitUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

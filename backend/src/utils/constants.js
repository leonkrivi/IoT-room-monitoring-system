// Allowed query param values for room state history endpoints
export const ALLOWED_HOURS = [1, 3, 6, 12, 24, 48, 168]; // 168h = 7 days
export const ALLOWED_GRANULARITIES = ["1m", "5m", "15m", "1h", "6h", "1d"];

// Scrypt parameters for password hashing, OWASP recommendations
export const passwordKeyLen = 64;
export const scryptParams = {
  N: 2 ** 17, // 131072
  r: 8,
  p: 1,
};

// Allowed query param values for room state history endpoints
export const ALLOWED_HOURS = [1, 3, 6, 12, 24, 48, 168]; // 168h = 7 days
export const ALLOWED_GRANULARITIES = ["1m", "5m", "15m", "1h", "6h", "1d"];

// Allowed device configuration values (in ms)
export const ALLOWED_HB_INTERVAL_MS = [5000, 10000, 15000, 30000, 60000];
export const ALLOWED_SENSOR_RATE_MS = [500, 1000, 2000, 5000, 10000];

// Scrypt parameters for password hashing, OWASP recommendations
export const passwordKeyLen = 64;
export const scryptParams = {
  N: 2 ** 17, // 131072
  r: 8,
  p: 1,
};

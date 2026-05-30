// Allowed query param values for room state history endpoints
export const ALLOWED_HOURS = [1, 3, 6, 12, 24, 48, 168]; // 168h = 7 days
export const ALLOWED_GRANULARITIES = ["1m", "5m", "15m", "1h", "6h", "1d"];

export const GRANULARITY_LABELS = {
  "1m": "1 minute",
  "5m": "5 minutes",
  "15m": "15 minutes",
  "1h": "1 hour",
  "6h": "6 hours",
  "1d": "1 day",
};

// Allowed device configuration values (in ms)
export const ALLOWED_HB_INTERVAL_MS = [5000, 10000, 15000, 30000, 60000];
export const ALLOWED_SENSOR_RATE_MS = [
  500, 1000, 2000, 5000, 10000, 30000, 60000,
];

// Scrypt parameters for password hashing, OWASP recommendations
export const passwordKeyLen = 64;
export const scryptParams = {
  N: 2 ** 17, // 131072
  r: 8,
  p: 1,
};

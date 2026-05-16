export const allowedInfluxGranularities = [
  "1m",
  "5m",
  "10m",
  "15m",
  "30m",
  "1h",
];

// Scrypt parameters for password hashing, OWASP recommendations
export const passwordKeyLen = 64;
export const scryptParams = {
  N: 2 ** 17, // 131072
  r: 8,
  p: 1,
};

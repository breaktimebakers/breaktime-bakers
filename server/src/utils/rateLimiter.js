const buckets = new Map();

const MAX_BUCKETS = 10000;

export const createRateLimiter = ({ windowMs, max, keyGenerator }) => {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart >= windowMs) {
      bucket = { count: 0, windowStart: now };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterMs = windowMs - (now - bucket.windowStart);
      res.setHeader("Retry-After", Math.ceil(retryAfterMs / 1000));
      res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        message: "Too many attempts. Please try again later.",
      });
      return;
    }

    if (buckets.size > MAX_BUCKETS) {
      for (const [bucketKey, value] of buckets) {
        if (now - value.windowStart >= windowMs) {
          buckets.delete(bucketKey);
        }
      }
    }

    next();
  };
};

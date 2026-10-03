const MAX_BUCKETS = 10000;

// Each limiter owns its own bucket map, so cleanup can use that limiter's
// own windowMs instead of guessing across limiters with different windows.
//
// skipSuccessfulRequests: the hit is counted up front (so a burst of
// concurrent attempts can't all slip past the check) and refunded when the
// response turns out to be a success, so only failed attempts use up the quota.
export const createRateLimiter = ({ windowMs, max, keyGenerator, skipSuccessfulRequests = false }) => {
  const buckets = new Map();

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

    if (skipSuccessfulRequests) {
      res.on("finish", () => {
        // Only refund if the bucket is still the same window we counted in.
        if (res.statusCode < 400 && buckets.get(key) === bucket && bucket.count > 0) {
          bucket.count -= 1;
        }
      });
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

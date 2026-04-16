// Simple rate limit tracker from JSearch API headers
let rateLimitInfo = {
  remaining: null,
  limit: null
};

const updateFromHeaders = (headers) => {
  const remaining = headers['x-ratelimit-requests-remaining'];
  const limit = headers['x-ratelimit-requests-limit'];

  if (remaining) rateLimitInfo.remaining = parseInt(remaining);
  if (limit) rateLimitInfo.limit = parseInt(limit);

  if (remaining) {
    console.log(`📊 [JSearch] ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining`);
  }
};

const getRateLimitInfo = () => rateLimitInfo;

module.exports = { updateFromHeaders, getRateLimitInfo };

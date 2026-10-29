const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

function getUploadLimit() {
  const parsed = Number(process.env.UPLOAD_RATE_LIMIT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  limit: getUploadLimit,
  keyGenerator: (req) => {
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return ipKeyGenerator(req.ip);
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: 'Terlalu banyak unggahan. Coba lagi dalam beberapa saat.',
  },
});

module.exports = { uploadLimiter };

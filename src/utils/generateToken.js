const jwt = require('jsonwebtoken');

// Access Token generate karo (short lived - 15 min)
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Refresh Token generate karo (long lived - 7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
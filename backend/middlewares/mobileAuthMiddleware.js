import jwt from 'jsonwebtoken';

/**
 * Middleware to verify mobile JWT tokens.
 * Tokens are issued by the mobile auth endpoint with iss: 'vp-esr-mobile'.
 */
const verifyMobileAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate issuer and audience claims for mobile tokens
    if (decoded.iss !== 'vp-esr-mobile' || decoded.aud !== 'vp-esr') {
      return res.status(401).json({ message: 'Invalid token claims' });
    }

    req.user = {
      name: decoded.name,
      email: decoded.email,
      role: decoded.role || '',
    };
    return next();
  } catch (error) {
    console.error('Mobile JWT verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to restrict access to admin users only.
 * Must be used AFTER verifyMobileAuth.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};

export { verifyMobileAuth, requireAdmin };

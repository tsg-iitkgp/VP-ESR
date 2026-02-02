import jwt from 'jsonwebtoken';

const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validate issuer and audience claims
        if (decoded.iss !== 'admin-backend' || decoded.aud !== 'vp-esr') {
            return res.status(401).json({ message: 'Invalid token claims' });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name ? decoded.name : decoded.email.split('@')[0]
        };
        return next();
    } catch (error) {
        console.error('Local JWT verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export default verifyAuth;

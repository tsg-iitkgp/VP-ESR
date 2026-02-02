import jwt from 'jsonwebtoken';

// POST /api/auth/callback
// Exchanges authorization code with AdminBackend for JWT
export const exchangeCode = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Authorization code required' });
        }

        // Exchange code with AdminBackend
        const authServerUrl = process.env.AUTH_SERVER_URL || 'http://localhost:8003';
        const response = await fetch(`${authServerUrl}/api/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                message: data.message || 'Failed to exchange authorization code'
            });
        }

        // Verify the token has proper claims
        const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

        if (decoded.iss !== 'admin-backend' || decoded.aud !== 'vp-esr') {
            return res.status(401).json({ message: 'Invalid token claims' });
        }

        // Return token and user info to frontend
        res.status(200).json({
            token: data.token,
            user: data.user
        });
    } catch (error) {
        console.error('Error exchanging code:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        res.status(500).json({ message: 'Failed to exchange authorization code' });
    }
};

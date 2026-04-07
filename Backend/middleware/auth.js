const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

const auth = (req, res, next) => {
    // 1. Get the token from the header (standard for mobile API integration) [cite: 28, 61]
    const token = req.header('x-auth-token');

    // 2. Check if the token exists [cite: 23]
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // 3. Verify the token
        // IMPORTANT: Replace 'YOUR_SECRET_KEY' with process.env.JWT_SECRET in production [cite: 160, 165]
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Align with your routes: your login route uses { id: user._id }
        // We attach the decoded object to req.user so your CRUD routes can access req.user.id
        req.user = decoded; 
        
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
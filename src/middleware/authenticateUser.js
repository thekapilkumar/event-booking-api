const jwt = require('jsonwebtoken');
const { responseFormat } = require('../utils/responseFormat');

// Middleware for authentication
exports.authenticateUser = (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      req.userData = { userId: decodedToken.userId, isAdmin: decodedToken.isAdmin };
      next();
    } catch (error) {
      res.status(401).json(responseFormat(false,"Authentication failed",{}));
    }
  };

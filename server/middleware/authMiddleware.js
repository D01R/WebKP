const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');

module.exports = function(req, res, next) {
    if (req.method === "OPTIONS") {
        next();
    }
    
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            req.log.warn('The user is not logged in');
            return next(ApiError.noAuth());
        }
        
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (e) {
        req.log.error(e.message);
        return next(ApiError.unexpectedError());
    }
}
const ApiError = require("../error/ApiError");

module.exports = function(role) {
    return function (req, res, next) {
        if (req.user.role !== role) {
            req.log.warn('Access denied');
            return ApiError.forbidden('Access denied');
        }
        next();
    }
}
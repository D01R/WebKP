const logger = require('../services/loggerService');
const pinoHTTP = require('pino-http');

module.exports = pinoHTTP({logger});
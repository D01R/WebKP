const pino = require('pino');
const path = require('path');

const levels = {
    http: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};

const logger = pino(
	{
		customLevels: levels,
		useOnlyCustomLevels: true,
		level: 'http',
		formatters: {
			level: (label) => {
				return { level: label.toUpperCase() };
			},
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	pino.destination(path.resolve(__dirname, '../logs/logger.log'))
);

module.exports = logger;


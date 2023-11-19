require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const router = require('./routes/index');
const errorHandling = require('./middleware/ErrorHandlingMiddleware');
const sequelize = require('./db');
const models = require('./models/models');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const logger = require('./services/loggerService');

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'static')));
app.use(fileUpload());
app.use(loggerMiddleware);
app.use('/api',router);

app.use(errorHandling);

const start = async () => {
    try{
        //await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
        logger.info(`Server started on port ${PORT}`);
    }
    catch (e){
        logger.error(e);
        console.log(e);
    }
}

start();

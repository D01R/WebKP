const Router = require('express');
const userRouter = require('./userRouter');
const roomRouter = require('./roomRouter');
const clientRouter = require('./clientRouter');
const reservationRouter = require('./reservationRouter');


const router = new Router();

router.use('/client', clientRouter);
router.use('/user', userRouter);
router.use('/room', roomRouter);
router.use('/reservation', reservationRouter);

module.exports = router;
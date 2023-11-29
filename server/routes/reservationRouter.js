const Router = require('express');
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = new Router();

router.post('/', reservationController.createReservation);
router.get('/', authMiddleware,reservationController.getReservations);
router.delete('/:id', authMiddleware, reservationController.softDeleteReser);

module.exports = router;
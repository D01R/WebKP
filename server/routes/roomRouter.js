const Router = require('express');
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');


const router = new Router();

router.post('/', authMiddleware, checkRoleMiddleware('ADMIN'), roomController.createRoom);
router.put('/:id', authMiddleware, checkRoleMiddleware('ADMIN'), roomController.updateRoom);
router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoom);

module.exports = router;
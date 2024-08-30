const express = require('express');
const router = express.Router();
const AppController = require('../contrallers/AppController');
const UsersController = require('../contrallers/UsersController');
router.get('/status', AppController.status);
router.get('/stats', AppController.stats);
router.post('/users', UsersController.postNew);

module.exports = router;
const express = require('express');
const router = express.Router();
const AppController = require('../contrallers/AppController');
const UsersController = require('../contrallers/UsersController');
const AuthContraller = require('../contrallers/AuthController');
const FilesController = require('../contrallers/FilesController');

// get status
router.get('/status', AppController.status);
router.get('/stats', AppController.stats);
// post new user
router.post('/users', UsersController.postNew);
// get encoded credentials
router.post('/encodedCredentials', AuthContraller.getEncodedCredentials);

// user auth
router.get('/connect', AuthContraller.getConnect);
router.get('/disconnect', AuthContraller.gitDisconnect);
router.get('/users/me', AuthContraller.getMe);
router.post('/files', FilesController.addFile);


module.exports = router;
const express = require('express');

const router = express.Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthContraller = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

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

// files routes
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

module.exports = router;

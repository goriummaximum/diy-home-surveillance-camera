var express = require('express');
var router = express.Router();
const boardController = require('../controllers/board.controller');

router.get('/', boardController.boardProcessing);

module.exports = router;
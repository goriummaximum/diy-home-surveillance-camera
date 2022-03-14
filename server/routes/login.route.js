var express = require('express');
var router = express.Router();
const loginController = require('../controllers/login.controller');

router.get('/', async function(req, res, next) {
    try {
        if(!req.session.login){
            res.render('login');
        }
        else res.redirect('/board');
    } catch (error) {
        console.log(error);
    }
});

router.post('/', loginController.loginProcessing);

module.exports = router;
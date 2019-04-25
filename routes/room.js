const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { isLoggedIn } = require('../config/auth');

router.get('/', ensureAuthenticated, (req, res) => {
    res.render('room', {
        user: req.user
    });
});

module.exports = router;




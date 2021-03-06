const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { ensureAuthenticated } = require('../config/auth');

router.get('/', ensureAuthenticated, (req, res) => {

    try {
        Room.find({
            "players.userId": {
                $in: [req.session.passport.user]
            },
            "status": "playing" // Looking for only playing room
        }).then(playingRooms => {
            // If room is not empty, the user has joined a chessroom before
            Room.find({}).then(rooms => {
                if (playingRooms.length > 0) {
                    res.render('lobby', {
                        user: req.user,
                        rooms,
                        redirect_link: "rooms/" + playingRooms[0]._id
                    });
                } else {
                    res.render('lobby', {
                        user: req.user,
                        rooms,
                    });
                }
            });
        })
    } catch (error) {
        console.log(error);
    }
});

router.get('/AIchessroom', ensureAuthenticated, (req, res) => {
    res.render('comingSoon');
})

router.post('/createRoom', ensureAuthenticated, (req, res) => {
    let { title } = req.body;
    if (title.length === 0) {
        req.flash('error_msg', 'Room title cannot be empty');
        res.redirect('/lobby');
    }
    Room.findOne({ title }).then(room => {
        if (room) {
            req.flash('error_msg', `Room ${title} has already existed`);
            res.redirect('/lobby');
        } else {
            const newRoom = new Room({
                title
            });
            newRoom.save().then(room => {
                req.flash('success_msg', `Room ${title} has been created`);
                res.redirect('/lobby');
            }).catch(err => console.log(err));
        }
    });
});

module.exports = router;




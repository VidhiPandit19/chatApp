const express = require('express');
const router = express.Router();

const { addUser } = require('../controllers/userControllers');
const { loginUser } = require('../controllers/loginControllers');

router.post('/register', addUser);
router.post('/login', loginUser);

const protect = require("../middlewares/auth");

router.get("/profile", protect, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
});


module.exports = router;

const express = require('express');
const router = express.Router();

const { addUser, searchUsers, updateProfile } = require('../controllers/userControllers');
const { loginUser } = require('../controllers/loginControllers');

router.post('/register', addUser);
router.post('/login', loginUser);
router.put("/update", protect, updateProfile)

const protect = require("../middlewares/auth");

router.get("/profile", protect, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
});




router.get("/search", protect, searchUsers);


module.exports = router;

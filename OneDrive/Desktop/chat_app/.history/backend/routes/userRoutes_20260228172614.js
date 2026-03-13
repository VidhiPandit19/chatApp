const express = require('express');
const router = express.Router();

const { addUser, searchUsers, updateProfile, getAllUsers } = require('../controllers/userControllers');
const { loginUser } = require('../controllers/loginControllers');
const protect = require("../middlewares/auth");
const upload = require("../middlewares/upload");


router.post('/register', addUser);
router.post('/login', loginUser);

router.get("/profile", protect, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
});


router.get("/users", protect)
router.get("/search", protect, searchUsers);
router.put("/update", protect, upload.single("profilePic"), updateProfile);


module.exports = router;

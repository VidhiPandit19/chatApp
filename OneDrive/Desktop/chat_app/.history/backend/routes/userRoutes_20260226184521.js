const express = require('express');
const router = express.Router();

const { addUser, searchUsers, updateProfile } = require('../controllers/userControllers');
const { loginUser } = require('../controllers/loginControllers');
const protect = require("../middlewares/auth");
router.post('/register', addUser);
router.post('/login', loginUser);




router.get("/profile", protect, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
});

const upload = require("../middleware/upload");

router.put(
  "/update",
  authMiddleware,
  upload.single("profilePic"),   // 👈 important
  updateProfile
);

router.get("/search", protect, searchUsers);
router.put("/update", protect, updateProfile)


module.exports = router;

const express = require('express');
const router = express.Router();

const { addUser } = require('../controllers/userControllers');
const { loginUser } = require('../controllers/loginControllers');

router.post('/register', addUser);
router.post('/login', loginUser);

module.exports = router;

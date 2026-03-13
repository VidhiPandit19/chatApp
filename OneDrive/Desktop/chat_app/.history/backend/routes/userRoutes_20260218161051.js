const express = require('express');
const router = express.Router();

const { addUser } = require('../controllers/authController');

router.post('/register', addUser);

module.exports = router;

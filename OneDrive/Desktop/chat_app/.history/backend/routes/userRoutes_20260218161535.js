const express = require('express');
const router = express.Router();

const { addUser } = require('../controllers/userController');

router.post('/register', addUser);

module.exports = router;

const express = require('express');
const router = express.Router();

const { addUser } = require('../controllers/userControllers');

router.post('/register', addUser);

module.exports = router;

const express = require('express');
const router = express.Router();

const { addUser } = require('../controllers/userControllers');

router.post('/register', addUser);
router.post('/login')

module.exports = router;

const dotenv = require('dotenv');
dotenv.config('./config.env');

const express = require('express');
const app = express();

const PORT = process.env.PORT_NUMBER || 5000;

app.use(express.json());

app.listen(PORT, () => {
    console.log("Server running on Port "+PORT);
})


module.exports = app;

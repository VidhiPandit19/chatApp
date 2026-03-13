const express = require('express');
const app = express();
const env = require('dotenv');

const PORT = 5000;

app.use(express.json());

app.listen(PORT, () => {
    console.log("Server running on Port "+PORT);
})


module.exports = app;

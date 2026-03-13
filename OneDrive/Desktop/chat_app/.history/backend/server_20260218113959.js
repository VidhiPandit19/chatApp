const express = require('express');
const app = express();

const PORT = 5000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server running", PORT);
})

module.exports = app;

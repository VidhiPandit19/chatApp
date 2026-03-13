const express = require('express');
const app = express();

const PORT = 5000;

app.use(express.json());

app.listen( port"/", (req, res) => {
    res.send("Server running");
})

module.exports = app;

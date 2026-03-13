const express = require('express');
const app = express();

const PORT = 
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server running");
})

module.exports = app;

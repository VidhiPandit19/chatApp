require('dotenv').config({ path: './.env' });

const express = require('express');
const { connectDB } = require('./config/db');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

// Connect Database
connectDB();

//connect tables whether crea
db.sync()
   .then(() => console.log("Tables synced"))
   .catch(err => console.log(err));


app.listen(PORT, () => {
    console.log("Server running on Port " + PORT);
});

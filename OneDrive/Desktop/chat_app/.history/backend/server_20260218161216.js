require('dotenv').config({ path: './.env' });

const express = require('express');
const { db, connectDB } = require('./config/db');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
app.use('/auth', userRoutes)

// Connect Database
connectDB();

require('./models/User');

//connect tables whether created or not
db.sync()
   .then(() => console.log("Tables synced"))
   .catch(err => console.log(err));


app.listen(PORT, () => {
    console.log("Server running on Port " + PORT);
});

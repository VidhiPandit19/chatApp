const bcrypt = require("bcrypt");
const  User  = require("../models");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.Vitzi@0019042004;

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            where: { email: email }
        });

        if (!existingUser) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, existingUser.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }


        const token = jwt.sign(
            { id: existingUser.id, email: existingUser.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        // if Success
        return res.status(200).json({ message: "Login successful" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser };

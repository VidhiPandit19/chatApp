const bcrypt = require("bcrypt");
const { User } = require("../models");

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1️⃣ Check required fields
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2️⃣ Check if user exists
        const existingUser = await User.findOne({
            where: { email: email }
        });

        if (!existingUser) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 3️⃣ Compare password
        const isMatch = await bcrypt.compare(password, existingUser.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Success
        return res.status(200).json({ message: "Login successful" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser };

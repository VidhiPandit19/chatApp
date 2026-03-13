const bcrypt = require('bcrypt');
const User = require("../models/User");

const addUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Check fields
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        //  Check password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords didn't match"
            });
        }

        //  Check existing user
        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        //  Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //  Create user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Send safe response
        return res.status(201).json({message: "User registered successfully",
            user: {
                id: newUser.id,
      name: newUser.name,
      email: newUser.email
   }
});

        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { addUser };

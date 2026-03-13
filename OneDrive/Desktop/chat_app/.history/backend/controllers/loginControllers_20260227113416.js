const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const  User  = require("../models/User");


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
            { id: existingUser.id, name: existingUser.name, email: existingUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // if Success
        return res.status(200).json({ 
            message: "Login successful", 
            token });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser };



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({
      where: { email }
    });

    if (!existingUser) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        profilePic: existingUser.profilePic || ""
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({ token });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};


// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (name) user.name = name;

    // if image uploaded
    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    await user.save();

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || ""
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
      token
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

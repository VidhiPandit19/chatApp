const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Op } = require("sequelize");


// ================= REGISTER =================
const addUser = async (req, res) => {
  try {
    const { name, mobile_number, email, password, confirmPassword } = req.body;

    if (!name || !mobile_number || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords didn't match"
      });
    }

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      mobile_number,
      email,
      password: hashedPassword
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        mobile_number: newUser.mobile_number,
        email: newUser.email
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};





// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const { name, mobile_number } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (name) user.name = name;
    if 

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
        mobile_number: user.mobile_number,
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


// ================= SEARCH USERS =================
const searchUsers = async (req, res) => {
  try {
    const name = req.query.name;

    if (!name) {
      return res.status(400).json({
        message: "Name query is required"
      });
    }

    const users = await User.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        },
        id: {
          [Op.ne]: req.user.id
        }
      },
      attributes: ["id", "name", "email", "profilePic"]
    });

    res.status(200).json(users);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  addUser,
  updateProfile,
  searchUsers
};
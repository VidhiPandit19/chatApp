const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Op } = require("sequelize");
const { use } = require('react');

const addUser = async (req, res) => {

    try {
        //await User.destroy({ where: {}, truncate: true });
        const { name, mobile_number, email, password, confirmPassword } = req.body;

        // Check fields
        if (!name || !mobile_number || !email || !password || !confirmPassword) {
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
            mobile_number,
            email,
            password: hashedPassword
        });

        //jwt token
        const token = jwt.sign(
            {id : newUser.id, email: newUser.email},
            process.env.JWT_SECRET,
            {expiresIn : "5h"}
        );

        
        return res.status(201).json({message: "User registered successfully",
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                mobile_number : newUser.mobile_number,
                email: newUser.email
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


const searchUsers = async(req, res) => {
    try{
        const username = req.query.username

        if(!username) {
            return res.status(400).json({
                message : "Username query is required"
            });
        }

        const users = await User.findAll({
            where:{
                username: {
                    [Op.like] : `%${username}%`
                },
                id: {
                    [Op.ne] : req.user.id 
                }
            },
            attributes: ["id", "username", "email"]
        });

        res.status(200).json(users);

    } catch (error){


    }

} 

module.exports = { addUser, searchUsers };

const bcrypt = require('bcrypt');

const User = require("../models/User");
const { Op } = require("sequelize");


const addUser = async (req, res) => {

    try {
        
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
        
        return res.status(201).json({message: "User registered successfully",
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
        const name = req.query.name

        if(!name) {
            return res.status(400).json({
                message : "Name query is required"
            });
        }

        const users = await User.findAll({
            where:{
                name: {
                    [Op.like] : `%${name}%`
                },
                id: {
                    [Op.ne] : req.user.id 
                }
            },
            attributes: ["id", "name", "email"]
        });

        res.status(200).json(users);

    } catch (error){
        res.status(500).json({
            message: error.message 
        });
    }

}; 

module.exports = { addUser, searchUsers };

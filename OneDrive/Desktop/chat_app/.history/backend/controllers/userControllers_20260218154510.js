const { User } = require("../models");

const addUser = async(req, res) => {
    try{
        const { name, email, password } = req.body

        if( !name || !email || !password) {
            return res.status(404).json({message})
        }
    }
}
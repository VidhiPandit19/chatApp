const { User } = require("../models");

const addUser = async(req, res) => {
    try{
        const { name, email, password, confirmPassword } = req.body

        if( !name || !email || !password || !confirmPassword) {
            return res.status(404).json({message: "All feilds are required "});
        }

        if (password === confirmPassword) {
            return res.status(400).json({message : "Passwords didn't match"});
        }

        res.json({message: "Validation Passed"});

    }

    catch(error) {
        res.status(500).json({message :error})
    }
}
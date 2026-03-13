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
        res.status(500).json({message : error.message});
    }
};

const existingUser = await User.findOne({
    where : {email : email}
});

if(existingUser) {
    return res.json(400).json({message : "User Already Exists"});
}


const hashedPassword = await bcrypt.hash(password, 10);
await User.create({
    name,
    email,
    password : hashedPassword
});

return res.status)
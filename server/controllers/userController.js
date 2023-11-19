const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User} = require('../models/models');


function generateJwt (id_user, login, role) {
    return jwt.sign(
        {id_user, login, role},
        process.env.SECRET_KEY,
        {expiresIn: '12h'}
    )
}


class UserController {
    async registration (req,res, next) {
        let  {login, password, role} = req.body;
        
        if (!login || !password) {
            req.log.warn("Empty fields received");
            return next(ApiError.badRequest("Check all fields"));
        }
        const candidate = await User.findOne({where: {login}});

        if (candidate) {
            req.log.warn("User with same username already exists");
            return next(ApiError.badRequest("User with login already exists"));
        }

        password = await bcrypt.hash(password, 5);
        const user = await User.create({login, password, 'role': role || 'CONSIERGE'});
        const token = generateJwt(user.id_user, user.login, user.role);

        return res.json({token});
    }

    async login (req, res, next){
        const {login, password} = req.body;
        const user = await User.findOne({where: {login}});
        
        if (!user){
            req.log.warn("User not found")
            return next(ApiError.internal("User not found"));
        }

        let comparePassword = bcrypt.compareSync(password, user.password);
        if (!comparePassword) {
            req.log.warn("The user entered an incorrect password");
            return next(ApiError.internal("Entered an incorrect password"));
        }
        
        const token = generateJwt(user.id_user, user.login, user.role);
        return res.json({token});
    }


    async check (req,res,next) {
        const token = generateJwt(req.user.id_user, req.user.login, req.user.role);
        return res.json({token});
    }
}

module.exports = new UserController();
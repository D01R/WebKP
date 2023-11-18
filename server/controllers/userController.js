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
            return next(ApiError.badRequest("Проверьте все поля"));
        }
        const candidate = await User.findOne({where: {login}});

        if (candidate) {
            return next(ApiError.badRequest("Пользователь с таким логином уже существует"));
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
            return next(ApiError.internal("Неверный логин или пароль"));
        }

        let comparePassword = bcrypt.compareSync(password, user.password);
        if (!comparePassword) {
            return next(ApiError.internal("Неверный логин или пароль"));
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
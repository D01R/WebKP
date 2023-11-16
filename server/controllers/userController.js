const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User} = require('../models/models');


function generateJwt (id, login, role) {
    return jwt.sign(
        {id, login, role},
        process.env.SECRET_KEY,
        {expiresIn: '12h'}
    )
}


class UserController {
    async registration (req,res, next) {
        const {login, password, role} = req.body;
        
        if (!login || !password) {
            return next(ApiError.badRequest("Проверьте все поля"));
        }
        const candidate = await User.findOne({where: login});

        if (candidate) {
            return next(ApiError.badRequest("Пользователь с таким логином уде существует"));
        }

        password = await bcrypt.hash(password, 5);
        const user = await User.create({login, password, 'role': role || 'CONSIERGE'});
        const token = generateJwt(user.id_user, user.login, user.role);

        return res.json({token});
    }

    
}

module.exports = new UserController();
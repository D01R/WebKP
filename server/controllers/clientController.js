const ApiError = require('../error/ApiError');
const { Client } = require('../models/models');
const {Op} = require('sequelize');


class ClientController {
    async createClient (req, res) {
        try {
            let {last_name, first_name, patronymic, phone, mail} = req.body;

            if (!last_name || !first_name || !phone || !mail){
                req.log.warn('Problems with fields');
                return ApiError.badRequest('Check all fields');
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){ //Check validation of mail
                req.log.warn('Problems with fields');
                return ApiError.badRequest('Check all fields');
            }

            const candidate = await Client.findOne({where: {mail}});
            if (candidate && candidate.last_name === last_name && candidate.first_name === first_name) {
                req.client_create = candidate;
                return;
            }
            
            const client = await Client.create({
                last_name, first_name, patronymic: patronymic || null, phone, mail, active: 1
            })

            req.client_create = client;

        } catch (e) {
            req.log.error(e.message);
            return ApiError.badRequest(e.message);
        }
    }

}

module.exports = new ClientController();
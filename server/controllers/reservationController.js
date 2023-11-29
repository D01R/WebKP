const ApiError = require('../error/ApiError');
const clientController = require('./clientController');
const { Room, Reservation, Client } = require('../models/models');
const { Op } = require('sequelize');
const reservationSortings = require('../utils/reservationSortings');


class ReservationController {
    async createReservation(req, res, next) {
        try {
            let {period, comment, id_room} = req.body;


            const {periodWhereCondition, date_in, date_out} = ReservationController.formPeriodWhereCondition(period);

            if (!id_room) {
                req.log.warn('Invalid room');
                return next(ApiError.badRequest('Invalid room'));
            }

            if (!periodWhereCondition[Symbol.for('or')]){
                req.log.warn('Invalid period');
                return next(ApiError.badRequest('Invalid period'));
            }

            let room = await Room.findByPk(id_room, {
                include: [{
                    model: Reservation,
                    as: 'roomReservations',
                    required: false,
                    where: {...periodWhereCondition, active: 1}
                }],
            });
            
            if (!room || room.roomReservations.length > 0) {
                req.log.warn('Invalid room');
                return next(ApiError.badRequest('Invalid room'));
            }

            const err = await clientController.createClient(req,res);
            if (err instanceof ApiError)
                return next(err);


            const total_price = Math.round((date_out - date_in) / (1000*60*60*24)) * room.price;
            
            const reservation = await Reservation.create({
                check_in: 0, date_in, date_out, total_price, comment, active: 1, id_room, id_client: req.client_create.id_client
            })
            
            return res.json({client: req.client_create, reservation});

        } catch(e) {
            req.log.error(e.message);
            next(ApiError.badRequest(e.message));
        }
    }

    async getReservations(req,res,next) {
        let {q, sorting, limit, page} = req.query;
        limit = limit > 0 ? limit : 10;
        page = page > 0 ? page : 1;
        let offset = page * limit - limit;

        let reservations;
        const whereCondition = ReservationController.formWhereConditionGetReservation(q);

        
        reservations = await Reservation.findAndCountAll({
            distinct: true,
            where: {...whereCondition, date_out: {[Op.gte]: Date.now()}, active: 1},
            include: {
                model: Client,
                as: 'client',
                required: true,
            },
            order: [reservationSortings[sorting] || reservationSortings.by_check_in_date],
            limit, offset
        })

        return res.json(reservations);
    }

    async softDeleteReser (req, res, next) {
        try {
            const {id} = req.params;

            const [, rowsUpdated] = await Reservation.update(
                {active: 0},
                {
                    where: {id_reser: id},
                    returning: true
                }
            );

            if (rowsUpdated < 1) {
                req.log.warn('Bad id of the reservation');
                return next(ApiError.badRequest('No reservation found'));
            }

            return res.json(rowsUpdated);
        } catch (e) {
            req.log.error(e.message);
            next(ApiError.badRequest(e.message));
        }
    }

    static formWhereConditionGetReservation (q) {
        let condition = {};

        if (q) {
            condition = {
                [Op.or]:[
                    {id_reser: {[Op.substring]: q}},
                    {'$client.last_name$': {[Op.substring]: q}}
                ]
            }
        }

        return condition;
    }

    static formPeriodWhereCondition (period){
        const periodArray = period.split(':');
        const date_in = new Date(periodArray[0]);
        const date_out = new Date(periodArray[1]);

        if (!period || periodArray.length !== 2 ||
            isNaN(date_in.getTime()) || isNaN(date_out.getTime()) || 
            date_in > date_out || date_in < Date.now() || date_in < Date.now()
        ) {
            return {};
        }

        const query = {
            periodWhereCondition: {
                [Op.or]: [
                    {
                        [Op.and]: [
                            {date_out: {[Op.gt]: date_in}},
                            {date_out: {[Op.lte]: date_out}},
                        ]
                    },
                    {
                        [Op.and]: [
                            {date_in: {[Op.gte]: date_in}},
                            {date_in: {[Op.lt]: date_out}},
                        ]
                    },
                    {
                        [Op.and]: [
                            {date_in: {[Op.lt]: date_in}},
                            {date_out: {[Op.gt]: date_out}},
                        ]
                    },
                ]
            },
            date_in,
            date_out
        };

        return query;
    }
}

module.exports = new ReservationController();
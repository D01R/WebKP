const ApiError = require('../error/ApiError');
const { Room, Reservation , Image} = require('../models/models');
const roomCategories = require('../utils/roomCategories');
const roomStatuses = require('../utils/roomStatuses');
const { Op } = require('sequelize');
const uuid = require('uuid');
const path = require('path');

class RoomController {
    //Creating of the Room
    async createRoom (req, res, next) {
        try {
            const {name, seats, category, price, allow_smoking, air_conditioner, priv_bathroom, inc_breakfast} = req.body;
            const {images} = req.files;

            if (
                !name || 
                !seats || 
                !category || 
                !price || 
                !roomCategories.includes(category) ||
                seats <= 0 ||
                price <= 0
            ) {
                req.log.warn('Problems with fields');
                return next(ApiError.badRequest('Check all fields'));
            }
            
            const room = await Room.create({
                name, seats, status: 'FREE', category, price, active: 1, 
                allow_smoking: allow_smoking || 0, 
                air_conditioner: air_conditioner || 0, 
                priv_bathroom: priv_bathroom || 0, 
                inc_breakfast: inc_breakfast || 0
            });

            images.forEach( async(element) => {
                let fileName = uuid.v4()+'.jpg';
                element.mv(path.resolve(__dirname,'..','static',fileName));

                await Image.create({id_room: room.id_room, link: fileName});
            });

            return res.json(room);
        } catch (e) {
            req.log.error(e.message);
            next(ApiError.badRequest(e.message));
        }
    }

    //Change info of the room
    async updateRoom (req, res, next) {
        try {
            const {name, seats, status, category, price, allow_smoking, air_conditioner, priv_bathroom, inc_breakfast} = req.body;
            const {id} = req.params;

            if (
                !name || 
                !seats || 
                !category || 
                !price || 
                !roomCategories.includes(category) ||
                !roomStatuses.includes(status) ||
                seats <= 0 ||
                price <= 0
            ) {
                req.log.warn('Problems with fields');
                return next(ApiError.badRequest('Check all fields'));
            }

            const [ , rowsUpdated] = await Room.update(
                {
                    name, seats, status, category, price, 
                    allow_smoking: allow_smoking || 0, 
                    air_conditioner: air_conditioner || 0, 
                    priv_bathroom: priv_bathroom || 0, 
                    inc_breakfast: inc_breakfast || 0
                },
                {
                    where: {id_room : id},
                    returning: true
                }
            );

            if (rowsUpdated < 1){
                req.log.warn('Bad id of the room');
                return next(ApiError.badRequest('No room found'));
            }

            const room = await Room.findByPk(id);
            return res.json(room);
        } catch (e) {
            req.log.error(e.message);
            next(ApiError.badRequest(e.message));
        }
    }

    //Get rooms with params
    async getRooms (req, res, next) {
        let {limit, page, period, ...queries} = req.query;
        limit = limit > 0 ? limit : 10;
        page = page > 0 ? page : 1;
        let offset = page * limit - limit;

        // If there are other queries form a where conditions
        const whereConditions = Object.entries(queries).length? RoomController.formWhereConditions(queries): {};

        let periodWhereCondition = {};
        let rooms;

        if (period){
            periodWhereCondition = RoomController.formPeriodWhereCondition(periodWhereCondition, period);
        }

        
        if (periodWhereCondition[Symbol.for('or')]){
            rooms = await Room.findAndCountAll({
                distinct: true,
                where: {...whereConditions, status: {[Op.notIn]: ["DECOMMISIONED"]}},
                include: [
                    {
                        model: Reservation,
                        as: 'roomReservations',
                        required: false,
                        where: {...periodWhereCondition, active: 1}
                    },
                    {
                        model: Image,
                        as: 'roomImages',
                        required: false
                    }
                ],
                limit, offset
            });
        } else {
            rooms = await Room.findAndCountAll({
                distinct: true,
                where: {...whereConditions, status: {[Op.notIn]: ["DECOMMISIONED"]}},
                include: {model: Image, as: 'roomImages', required: false},
                limit, offset
            })
        }

        return res.json(rooms);
    }

    async getRoom(req, res, next) {
        let {id} = req.params;

        const room = await Room.findByPk(id,
            {
                include: [
                    {
                        model: Reservation,
                        as: 'roomReservations',
                        required: false,
                        where: {active: 1, date_out: {[Op.gte]: Date.now()}},
                        order: ['date_in', 'ASC'],
                        limit: 20,
                        offset: 0
                    },
                    {
                        model: Image,
                        as: 'roomImages',
                        required: false
                    }
                ]
            }   
        )
        return res.json(room);
    }

    //Form where condition for query to DB
    static formWhereConditions (query){
        let {seats, category, price, allow_smoking, air_conditioner, priv_bathroom, inc_breakfast, period} = query;

        let whereConditions = {};

        if (roomCategories.includes(category))
            whereConditions = {category};

        if (seats && /^(\d+(-\d)*)?$/.test(seats)) // проверка что строка состоит из чисел через тире
            whereConditions = {...whereConditions, seats: {[Op.in]: seats.split('-')}};

        if (allow_smoking in [0,1])
            whereConditions = {...whereConditions, allow_smoking};

        if (air_conditioner in [0,1])
            whereConditions = {...whereConditions, air_conditioner};
        
        if (priv_bathroom in [0,1])
            whereConditions = {...whereConditions, priv_bathroom};

        if (inc_breakfast in [0,1])
            whereConditions = {...whereConditions, inc_breakfast};

        if (price){
            whereConditions = RoomController.formPriceWhereCondition(whereConditions, price);
        }

        console.log(whereConditions);
        return whereConditions;
    }

    //Check price and where conditions to DB
    static formPriceWhereCondition (whereConditions, price){
        const array = price.split('-');
        if (array.length > 2){
            return whereConditions;
        }
        let [minPrice, maxPrice] = array;
        if (minPrice && !isNaN(minPrice) && maxPrice && !isNaN(maxPrice) && minPrice > maxPrice){
            [minPrice, maxPrice] = [maxPrice, minPrice];
        }
        if (minPrice && !isNaN(minPrice)) {
            whereConditions.price = {[Op.gte]: minPrice};
        }
        if (maxPrice && !isNaN(maxPrice)) {
            whereConditions.price = {...whereConditions.price, [Op.lte]: maxPrice};
        }
        return whereConditions;
    }

    static formPeriodWhereCondition (whereConditions, period){
        const periodArray = period.split(':');
        const date_in = new Date(periodArray[0]);
        const date_out = new Date(periodArray[1]);

        if (!period || periodArray.length !== 2 ||
            isNaN(date_in.getTime()) || isNaN(date_out.getTime()) || 
            date_in > date_out || date_in < Date.now() || date_in < Date.now()
        ) {
            return whereConditions;
        }

        whereConditions = {
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
        };

        return whereConditions;
    }
}

module.exports = new RoomController();
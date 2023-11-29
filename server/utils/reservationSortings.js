const { Reservation } = require("../models/models");

const reservationSortings = {
    by_check_in_date: ['date_in', 'ASC'],
    new_first: ['createdAt', 'DESC']
}

module.exports = reservationSortings;
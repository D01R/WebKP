const sequelize = require('../db');
const {DataTypes} = require('sequelize');

const User = sequelize.define('user', {
    id_user: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    login: {type: DataTypes.STRING, unique: true, allowNull: false},
    password: {type: DataTypes.STRING, unique: true, allowNull: false}
});

const Client = sequelize.define('client', {
    id_client: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    last_name: {type: DataTypes.STRING, allowNull: false},
    first_name: {type: DataTypes.STRING, allowNull: false},
    patronymic: {type: DataTypes.STRING, allowNull: true},
    phone: {type: DataTypes.STRING, allowNull: false},
    mail: {type: DataTypes.STRING, allowNull: false},
    sitizenship: {type: DataTypes.STRING, allowNull: true},
    passport_number: {type: DataTypes.STRING, allowNull: true},
});

const Room = sequelize.define('room', {
    id_room: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    seats: {type: DataTypes.INTEGER, allowNull: false},
    status: {type: DataTypes.STRING, allowNull: false},
    category: {type: DataTypes.STRING, allowNull: false},
    price: {type: DataTypes.DOUBLE, allowNull: false},
    allow_smoking: {type: DataTypes.INTEGER, allowNull: false},
    air_conditioner: {type: DataTypes.INTEGER, allowNull: false},
    priv_bathroom: {type: DataTypes.INTEGER, allowNull: false},
    inc_breakfast: {type: DataTypes.INTEGER, allowNull: false}
});

const Reservation = sequelize.define('reservetion', {
    id_reser: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    check_in: {type: DataTypes.INTEGER, allowNull: false},
    date_in: {type: DataTypes.STRING, allowNull: false},
    date_out: {type: DataTypes.STRING, allowNull: true},
    reason_eviction: {type: DataTypes.STRING, allowNull: true},
    discount: {type: DataTypes.DOUBLE, allowNull: true},
    total_price: {type: DataTypes.DOUBLE, allowNull: false},
    id_room: {type: DataTypes.INTEGER, allowNull: false},
    id_client: {type: DataTypes.INTEGER, allowNull: false},
    id_reser_ref: {type: DataTypes.INTEGER, allowNull: true},
    id_user: {type: DataTypes.INTEGER, allowNull: true}
});

User.hasMany(Reservation, {foreignKey: {name: 'id_user'}});
Reservation.belongsTo(User, {foreignKey: {name: 'id_user'}});

Client.hasMany(Reservation, {foreignKey: {name: 'id_client'}});
Reservation.belongsTo(Client, {foreignKey: {name: 'id_client'}});

Room.hasMany(Reservation, {foreignKey: {name: 'id_room'}});
Reservation.belongsTo(Room, {foreignKey: {name: 'id_room'}});

Reservation.hasOne(Reservation, {foreignKey: {name: 'id_reser_ref'}});
Reservation.belongsTo(Reservation, {foreignKey: {name: 'id_reser_ref'}});

module.exports = {
    User,
    Client,
    Room,
    Reservation,
}
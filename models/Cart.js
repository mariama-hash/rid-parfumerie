const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // un seul panier actif par utilisateur
  },
}, {
  tableName: 'carts',
  timestamps: true,
});

module.exports = Cart;
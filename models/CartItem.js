const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productVariantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'cart_items',
  timestamps: true,
});

module.exports = CartItem;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
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
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'order_items',
  timestamps: true,
});

module.exports = OrderItem;
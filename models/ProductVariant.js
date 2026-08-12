const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contenance_ml: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  prix_promo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'product_variants',
  timestamps: true,
});

module.exports = ProductVariant;
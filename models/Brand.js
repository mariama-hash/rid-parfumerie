const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'brands',
  timestamps: true,
});

module.exports = Brand;
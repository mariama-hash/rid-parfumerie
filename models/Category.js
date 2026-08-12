const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
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
  type: {
    type: DataTypes.ENUM('genre', 'famille_olfactive', 'autre'),
    defaultValue: 'autre',
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;
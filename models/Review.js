const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  note: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
});

module.exports = Review;
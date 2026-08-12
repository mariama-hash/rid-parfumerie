const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('client', 'admin'),
    defaultValue: 'client',
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
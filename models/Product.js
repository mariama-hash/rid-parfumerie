const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes_tete: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes_coeur: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes_fond: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  genre: {
    type: DataTypes.ENUM('Homme', 'Femme', 'Mixte', 'Maison'),
    allowNull: false,
  },
  image_principale: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'products',
  timestamps: true,
});

module.exports = Product;
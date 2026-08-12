const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero_commande: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'confirmee', 'expediee', 'livree', 'annulee'),
    defaultValue: 'en_attente',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  mode_paiement: {
    type: DataTypes.ENUM('mobile_money', 'livraison'),
    allowNull: false,
  },
  adresse_livraison: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ville_livraison: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telephone_contact: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

module.exports = Order;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mode: {
    type: DataTypes.ENUM('flooz', 'tmoney', 'livraison'),
    allowNull: false,
  },
  numero_expediteur: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference_transaction: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  montant_recu: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  capture_ecran: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'refuse'),
    defaultValue: 'en_attente',
  },
  valide_par: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  valide_le: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

module.exports = Payment;
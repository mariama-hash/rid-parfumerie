const sequelize = require('../config/database');
const User = require('./User');
const Brand = require('./Brand');
const Category = require('./Category');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Review = require('./Review');
const Cart = require('./Cart');
const CartItem = require('./CartItem');

Brand.hasMany(Product, { foreignKey: 'brandId' });
Product.belongsTo(Brand, { foreignKey: 'brandId' });

Product.belongsToMany(Category, { through: 'product_categories' });
Category.belongsToMany(Product, { through: 'product_categories' });

Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

ProductVariant.hasMany(OrderItem, { foreignKey: 'productVariantId' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

Order.hasOne(Payment, { foreignKey: 'orderId' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });

// User <-> Cart
User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });

// Cart <-> CartItem
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

// ProductVariant <-> CartItem
ProductVariant.hasMany(CartItem, { foreignKey: 'productVariantId' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

module.exports = {
  sequelize,
  User,
  Brand,
  Category,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Payment,
  Review,
  Cart,
  CartItem,
};
const path = require('path');
module.paths.push(path.join(__dirname, '../node_modules'));

const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Theater = require('../src/models/Theater');
const User = require('../src/models/User');
const Menu = require('../src/models/Menu');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/theater-qr-order';

async function seed() {
  console.log('Connecting to MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // Clear existing seed data
  await Theater.deleteMany({});
  await User.deleteMany({});
  await Menu.deleteMany({});
  console.log('Cleared existing Theater, User, and Menu collections.');

  // 1. Create Demo Theater
  const theater = await Theater.create({
    name: 'PVP Multiplex',
    address: 'M.S. Road, Krishnancoil, Nagercoil, Tamil Nadu 629001',
    screens: 4,
    rows: 8,
    seatsPerRow: 16,
    settings: {
      printerIp: '192.168.1.100',
      printerPort: 9100,
      autoPrint: true,
      currency: 'INR',
      taxRate: 5.0,
    },
    isActive: true,
  });

  console.log(`Created Theater: ${theater.name} (ID: ${theater._id})`);

  // 2. Create Users
  const adminUser = await User.create({
    email: 'admin@theaterbites.in',
    password: 'admin123',
    name: 'Suresh Kumar (Admin)',
    role: 'admin',
    theaterId: theater._id,
    isActive: true,
  });

  const staffUser = await User.create({
    email: 'staff@theaterbites.in',
    password: 'staff123',
    name: 'Counter Staff (Audi 1)',
    role: 'staff',
    theaterId: theater._id,
    isActive: true,
  });

  console.log('Created Users:');
  console.log(`  Admin : admin@theaterbites.in / admin123`);
  console.log(`  Staff : staff@theaterbites.in / staff123`);

  // 3. Create Sample Concession Menu Items
  const sampleItems = [
    // Snacks
    {
      name: 'Butter Popcorn (Large)',
      description: 'Classic warm cinema popcorn tossed in rich melted butter',
      price: 290,
      category: 'Snacks',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&q=80',
    },
    {
      name: 'Caramel Crunch Popcorn',
      description: 'Sweet and crunchy popcorn glazed with premium caramel',
      price: 320,
      category: 'Snacks',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&q=80',
    },
    {
      name: 'Cheese Loaded Nachos',
      description: 'Crisp tortilla chips topped with melted jalapeño cheese sauce & salsa dip',
      price: 240,
      category: 'Snacks',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80',
    },
    {
      name: 'Peri Peri French Fries',
      description: 'Golden crispy fries dusted with spicy African bird-eye chili mix',
      price: 180,
      category: 'Snacks',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&q=80',
    },
    {
      name: 'Crispy Veg Samosas (2 pcs)',
      description: 'Spiced potato and peas pastry served with tangy mint chutney',
      price: 120,
      category: 'Snacks',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    },

    // Beverages
    {
      name: 'Fountain Pepsi (750ml)',
      description: 'Chilled carbonated fountain soda served in theater cup with ice',
      price: 160,
      category: 'Beverages',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80',
    },
    {
      name: 'Hazelnut Cold Coffee',
      description: 'Freshly brewed espresso blended with rich milk, hazelnut syrup & ice cream',
      price: 220,
      category: 'Beverages',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80',
    },
    {
      name: 'Virgin Mint Mojito',
      description: 'Refreshing crush of lime, fresh mint leaves, cane sugar & sparkling soda',
      price: 190,
      category: 'Beverages',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
    },
    {
      name: 'Natural Spring Water (1 Litre)',
      description: 'Packaged mineral water bottle',
      price: 60,
      category: 'Beverages',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400&q=80',
    },

    // Combos
    {
      name: 'Blockbuster Combo for 2',
      description: '1x Large Butter Popcorn + 2x Fountain Pepsi (750ml) — Save ₹120',
      price: 490,
      category: 'Combos',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&q=80',
    },
    {
      name: 'Nachos & Soft Drink Combo',
      description: 'Cheese Loaded Nachos with dip + 1x Pepsi (750ml)',
      price: 360,
      category: 'Combos',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80',
    },
    {
      name: 'Triple Delight Box',
      description: 'Large Caramel Popcorn + Cheese Nachos + 2x Cold Coffees',
      price: 790,
      category: 'Combos',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&q=80',
    },

    // Desserts
    {
      name: 'Warm Choco Lava Cake',
      description: 'Gooey decadent chocolate cake with molten chocolate center',
      price: 190,
      category: 'Desserts',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80',
    },
    {
      name: 'Belgian Chocolate Brownie',
      description: 'Rich fudge brownie loaded with chocolate chunks and walnut bits',
      price: 160,
      category: 'Desserts',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1607920592519-bab4d7db727d?w=400&q=80',
    },

    // Main Course
    {
      name: 'Paneer Tikka Ciabatta Roll',
      description: 'Grilled tandoori paneer cubes, capsicum and spicy mayo in toasted ciabatta bread',
      price: 240,
      category: 'Main Course',
      isVeg: true,
      available: true,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    },
    {
      name: 'Crispy Chicken Wrap',
      description: 'Golden chicken tenders wrapped with lettuce, cheese & southwest chipotle dressing',
      price: 280,
      category: 'Main Course',
      isVeg: false,
      available: true,
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
    },
  ];

  const menuDocs = sampleItems.map((item) => ({
    ...item,
    theaterId: theater._id,
  }));

  const inserted = await Menu.insertMany(menuDocs);
  console.log(`Created ${inserted.length} cinema menu items.`);

  console.log('\n===============================================');
  console.log('Seed completed successfully!');
  console.log(`Theater ID: ${theater._id}`);
  console.log('Customer Test URL:');
  console.log(`http://localhost:5173/${theater._id}?screen=1&seat=A5`);
  console.log('===============================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});


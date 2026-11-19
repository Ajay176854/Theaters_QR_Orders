const mongoose = require('mongoose');
const Menu = require('../models/Menu');
const Theater = require('../models/Theater');

const DEFAULT_MENU_ITEMS = [
  {
    _id: 'sample-popcorn-l',
    name: 'Butter Popcorn (Large)',
    price: 290,
    category: 'Snacks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80',
    description: 'Classic warm cinema popcorn tossed in rich melted butter',
  },
  {
    _id: 'sample-caramel-popcorn',
    name: 'Caramel Crunch Popcorn',
    price: 320,
    category: 'Snacks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80',
    description: 'Sweet and crunchy popcorn glazed with premium caramel',
  },
  {
    _id: 'sample-nachos',
    name: 'Cheese Loaded Nachos',
    price: 240,
    category: 'Snacks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80',
    description: 'Tortilla chips topped with warm jalapeño cheese sauce & salsa',
  },
  {
    _id: 'sample-fries',
    name: 'Peri Peri French Fries',
    price: 180,
    category: 'Snacks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    description: 'Golden crispy fries dusted with spicy chili seasoning',
  },
  {
    _id: 'sample-samosa',
    name: 'Crispy Veg Samosas (2 pcs)',
    price: 120,
    category: 'Snacks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    description: 'Spiced potato and peas pastry with tangy mint chutney',
  },
  {
    _id: 'sample-pepsi',
    name: 'Fountain Pepsi (750ml)',
    price: 160,
    category: 'Drinks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80',
    description: 'Chilled fountain soda served in cinema cup with ice',
  },
  {
    _id: 'sample-coffee',
    name: 'Hazelnut Cold Coffee',
    price: 220,
    category: 'Drinks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    description: 'Freshly brewed espresso blended with rich milk & ice cream',
  },
  {
    _id: 'sample-mojito',
    name: 'Virgin Mint Mojito',
    price: 190,
    category: 'Drinks',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    description: 'Refreshing crush of lime, fresh mint leaves & sparkling soda',
  },
  {
    _id: 'sample-combo',
    name: 'Blockbuster Combo for 2',
    price: 490,
    category: 'Combos',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=600&auto=format&fit=crop&q=80',
    description: '1x Large Butter Popcorn + 2x Fountain Pepsi (750ml)',
  },
  {
    _id: 'sample-nachos-combo',
    name: 'Nachos & Soft Drink Combo',
    price: 360,
    category: 'Combos',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
    description: 'Loaded Cheese Nachos + 1x Fountain Drink',
  },
  {
    _id: 'sample-lava-cake',
    name: 'Warm Choco Lava Cake',
    price: 190,
    category: 'Desserts',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    description: 'Molten chocolate filled warm bakery cake',
  },
  {
    _id: 'sample-brownie',
    name: 'Belgian Chocolate Brownie',
    price: 160,
    category: 'Desserts',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1607920592519-bab4d7db727d?w=600&auto=format&fit=crop&q=80',
    description: 'Fudge chocolate brownie with roasted walnuts',
  },
  {
    _id: 'sample-burger',
    name: 'Paneer Tikka Ciabatta Roll',
    price: 240,
    category: 'Main Course',
    isVeg: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    description: 'Tandoori spiced paneer cubes and crisp veggies in toasted ciabatta',
  },
  {
    _id: 'sample-wrap',
    name: 'Crispy Chicken Wrap',
    price: 280,
    category: 'Main Course',
    isVeg: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
    description: 'Golden chicken tenders wrapped with lettuce, cheese & chipotle sauce',
  },
];

/**
 * Helper to resolve theaterId (handles 'demo-theater' or invalid objectIds gracefully)
 */
async function resolveTheaterId(theaterId) {
  if (!theaterId || theaterId === 'demo-theater' || !mongoose.Types.ObjectId.isValid(theaterId)) {
    const defaultTheater = await Theater.findOne();
    return defaultTheater ? defaultTheater._id : null;
  }
  return theaterId;
}

/**
 * Create a menu item
 * POST /api/menu
 */
const createMenuItem = async (req, res, next) => {
  try {
    let { theaterId, name, description, price, category, image, available, isVeg } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: 'name, price, and category are required.' });
    }

    theaterId = await resolveTheaterId(theaterId);
    if (!theaterId) {
      return res.status(400).json({ error: 'Valid theaterId is required. Seed the database first.' });
    }

    const item = await Menu.create({
      theaterId,
      name,
      description: description || '',
      price,
      category,
      image: image || '',
      available: available !== undefined ? available : true,
      isVeg: isVeg !== undefined ? isVeg : true,
    });

    res.status(201).json({ message: 'Menu item created.', item });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all menu items (with optional filters)
 * GET /api/menu?theaterId=X&category=Y&available=true&isVeg=true
 */
const getMenuItems = async (req, res, next) => {
  try {
    const { theaterId, category, available, isVeg } = req.query;
    const filter = {};

    if (theaterId) {
      const resolved = await resolveTheaterId(theaterId);
      if (resolved) filter.theaterId = resolved;
    }

    if (category && category.toLowerCase() !== 'all') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }
    if (available !== undefined) filter.available = available === 'true';
    if (isVeg !== undefined) filter.isVeg = isVeg === 'true';

    const items = await Menu.find(filter)
      .sort({ category: 1, name: 1 })
      .lean();

    res.json({ count: items.length, items });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle GET /api/menu/:idOrTheaterId
 * Checks if parameter is theaterId or menuItemId
 */
const getMenuItemOrTheater = async (req, res, next) => {
  try {
    const param = req.params.id;

    // If MongoDB is not connected yet, immediately serve default menu items
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        count: DEFAULT_MENU_ITEMS.length,
        items: DEFAULT_MENU_ITEMS,
      });
    }

    // 1. If 'demo-theater' or special keyword -> return all menu items for the default theater
    if (param === 'demo-theater' || !mongoose.Types.ObjectId.isValid(param)) {
      const resolvedTheaterId = await resolveTheaterId(param);
      const query = resolvedTheaterId ? { theaterId: resolvedTheaterId } : {};
      const items = await Menu.find(query).sort({ category: 1, name: 1 }).lean();
      return res.json({
        count: items.length || DEFAULT_MENU_ITEMS.length,
        items: items.length > 0 ? items : DEFAULT_MENU_ITEMS,
      });
    }

    // 2. Check if param is a Theater ID
    const theater = await Theater.findById(param);
    if (theater) {
      const items = await Menu.find({ theaterId: theater._id }).sort({ category: 1, name: 1 }).lean();
      return res.json({
        count: items.length || DEFAULT_MENU_ITEMS.length,
        items: items.length > 0 ? items : DEFAULT_MENU_ITEMS,
        theater,
      });
    }

    // 3. Otherwise check if param is a Menu item ID
    const item = await Menu.findById(param);
    if (item) {
      return res.json({ item });
    }

    // 4. If neither, fallback to all menu items
    const items = await Menu.find().sort({ category: 1, name: 1 }).lean();
    res.json({ count: items.length, items });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a menu item
 * PUT /api/menu/:id
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'description', 'price', 'category', 'image', 'available', 'isVeg'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const item = await Menu.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    res.json({ message: 'Menu item updated.', item });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a menu item
 * DELETE /api/menu/:id
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }
    res.json({ message: 'Menu item deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItem: getMenuItemOrTheater,
  updateMenuItem,
  deleteMenuItem,
};

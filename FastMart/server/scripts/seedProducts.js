const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('../models/Product');

dotenv.config();

const products = [
  {
    name: 'Fresh Apples',
    description: 'Crisp, sweet apples for snacks, desserts, and everyday groceries.',
    price: 149,
    originalPrice: 199,
    category: 'Fruits',
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Organic Bananas',
    description: 'Naturally ripened bananas with a soft texture and rich flavor.',
    price: 79,
    originalPrice: 99,
    category: 'Fruits',
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Basmati Rice 5kg',
    description: 'Long-grain basmati rice suitable for biryani, pulao, and daily meals.',
    price: 649,
    originalPrice: 799,
    category: 'Grocery',
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Whole Wheat Bread',
    description: 'Soft whole wheat bread baked for sandwiches and breakfast toast.',
    price: 55,
    originalPrice: 65,
    category: 'Bakery',
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Farm Fresh Milk 1L',
    description: 'Fresh milk for tea, coffee, cereal, and daily cooking.',
    price: 68,
    originalPrice: 88,
    category: 'Dairy',
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Mixed Vegetables Pack',
    description: 'A ready selection of seasonal vegetables for quick home cooking.',
    price: 199,
    originalPrice: 249,
    category: 'Vegetables',
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80'
  }
];

const seedProducts = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const product of products) {
      await Product.findOneAndUpdate(
        { name: product.name },
        product,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`${products.length} sample products are ready.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedProducts();

// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const path = require('path');


// dotenv.config();
// connectDB();

// const app = express();

// // Set CORS for frontend URL / allow single-node deploy
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.FRONTEND_URL],
//   credentials: true
// }));

// app.use(express.json({
//   limit: '50mb' // Increase limit for handling larger payloads (e.g., Base64 images)
// }));

// app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For parsing form data with larger payloads

// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/products', require('./routes/productRoutes'));
// app.use('/api/orders', require('./routes/orderRoutes'));
// app.use('/api/payment', require('./routes/paymentRoutes'));
// app.use('/api/analytics', require('./routes/analyticsRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));

// // Serve frontend in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
  
//   app.use((req, res) => {
//     res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
//   });
// } else {
//   app.get('/', (req, res) => {
//     res.send('FastMart API is running in Development mode...');
//   });
// }

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// CORS Configuration
// app.use(
//   cors({
//     origin: [
//       'http://localhost:5173',
//       'http://127.0.0.1:5173',
//       process.env.FRONTEND_URL, // Your deployed frontend URL
//     ],
//     credentials: true,
//   })
// );


const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL, // your stable production URL, e.g. https://fast2mart.vercel.app
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/fast2mart-[a-z0-9]+-sandip-maity-2023s-projects\.vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Body Parser
app.use(
  express.json({
    limit: '50mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb',
  })
);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/products',require('./routes/productRoutes'));
//app.use('/api/ai', require('./routes/aiRoutes'));

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FastMart API is running successfully!',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

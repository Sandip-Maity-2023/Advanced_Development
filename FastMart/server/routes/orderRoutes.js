const express = require('express');
const { addOrderItems, getMyOrders, getOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id/status').put(protect, admin, updateOrderStatus);

module.exports = router;

/*

PUT /:id/status (Update Order Status)
Security: protect + admin (Must be a logged-in admin)
Action: updateOrderStatus updates a specific order's progress (e.g. changing it from "Processing" to "Shipped" using its ID).

he router uses router.route() to chain different HTTP methods (post, get) to the same URL path, while ensuring normal users can only manage their own orders and admin-level actions are strictly locked down.
*/ 
/*
it's an endpoint for admin-only endpoint for fetching data,protected by a two-layer security endpoint

Creates an isolated instance of a router to handle specific endpoints.
Listens for standard HTTP GET requests on the base path of this router.

protect: First, this middleware checks if the user is logged in (usually by verifying a JWT token). If not, it blocks the request.
admin: Next, this middleware checks if the logged-in user has admin privileges. If they are a regular user, it blocks the request.
getAdminStats: If the user passes both checks, this final controller function runs, fetches the administration statistics from the database, and sends them back to the user.

*/

const express = require('express');
const { getAdminStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', protect, admin, getAdminStats);

module.exports = router;


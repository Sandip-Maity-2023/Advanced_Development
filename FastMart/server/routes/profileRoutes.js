const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const protect = require('../middleware/authMiddleware'); 

/* ==========================================================================
   ROUTE: UPDATE USER PROFILE (INCLUDING BASE64 AVATAR) IN MONGODB
   PATH: PUT /api/users/profile
   ========================================================================== */
router.put('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User profile instance not found.' });
    }

    // Overwrite schema properties with incoming data
    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    
    // Safely captures the Base64 string from the frontend layout
    user.avatar = req.body.avatar || user.avatar; 

    const updatedUser = await user.save();

    // Respond with updated data to sync frontend local storage and AuthContext
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      address: updatedUser.address,
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    console.error("MongoDB Profile Update Error: ", error);
    res.status(500).json({ message: 'Internal server error overwriting database profile documents.' });
  }
});

module.exports = router;
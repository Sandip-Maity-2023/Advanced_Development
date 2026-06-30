const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');


/* ==========================================================================
   ROUTE: UPDATE USER PROFILE (Saves Base64 avatar text direct to Mongo)
   PATH: PUT /api/users/profile
   ========================================================================== */


router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Overwrite schema fields with incoming values or fallback to current database state
    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    user.avatar = req.body.avatar || user.avatar; // <-- This field receives and commits the image data

    const updatedUser = await user.save();

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
    console.error(error);
    res.status(500).json({ message: 'Database error processing profile alterations.' });
  }
});

module.exports = router;
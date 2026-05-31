const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // Update karo
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Purana avatar delete karo cloudinary se
    const user = await User.findById(req.user._id);
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`intellmeet/avatars/${publicId}`);
    }

    // Naya avatar URL save karo
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully!',
      avatar: updatedUser.avatar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // User with password
    const user = await User.findById(req.user._id).select('+password');

    // Current password check karo
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // New password set karo
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/users/profile
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  deleteAccount
};
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { responseFormat } = require("../utils/responseFormat");
const { updateUserSchema } = require("../utils/validation/updateUserSchema");

exports.updateUser = async (req, res) => {
  try {

    const { error } =  updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json(responseFormat(false, error.details[0].message, {}));
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      address,
    } = req.body;

    // Find the user
    const user = await User.findById(req.userData.userId);
    if (!user)
      return res.status(404).json(responseFormat(false, "User not found", {}));

    // Check if user already exists with the same email or phone number
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser)
      return res.status(409).json(responseFormat(false,"User already exists with this email or phone number",{}));

    // Update the user
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.address = address || user.address;
    if (password) {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }
    await user.save();

    res
      .status(200)
      .json(responseFormat(true, "Profile updated successfully", {}));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.viewProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).select("-password"); // exclude password from response
    if (!user) {
      return res
        .status(404)
        .json(responseFormat(false, "Profile not found", {}));
    }
    res
      .status(200)
      .json(responseFormat(true, "Profile found successfully", { user }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.viewProfilebyID = async (req, res) => {
  try {
    const user = await User.findById(req.params.ID).select("-password"); // exclude password from response
    if (!user) {
      return res
        .status(404)
        .json(responseFormat(false, "Profile not found", {}));
    }
    res
      .status(200)
      .json(responseFormat(true, "Profile found successfully", { user }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find().select("-password");
    res
      .status(200)
      .json(responseFormat(true, "Data fetch successfully", { users }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

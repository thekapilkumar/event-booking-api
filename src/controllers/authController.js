const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { registerSchema } = require("../utils/validation/registerSchema");
const { responseFormat } = require("../utils/responseFormat");
const { logger } = require("../utils/logger");

exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error)
      return res.status(400).json(responseFormat(false, error.details[0].message,{}));

    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      address,
    } = req.body;

    // Check if user already exists with the same email or phone number
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser)
      return res.status(409).json(responseFormat(false,"User already exists with this email or phone number",{}));

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      dateOfBirth,
      address,
    });
    await user.save();

    res.status(201).json(responseFormat(true,"User registered successfully",{}));
  } catch (error) {
    res.status(500).json(responseFormat(false,"Internal server error",{}));
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists with the same email
    const user = await User.findOne({ email });
    if (!user){
      logger.info("Invalid email or password");
      return res.status(401).json(responseFormat(false,"Invalid email or password",{}));
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect){
      logger.info("Invalid email or password");
      return res.status(401).json(responseFormat(false,"Invalid email or password",{}));
    }

    // Create the token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info("User authenticated successfully");
    res.status(200).json(responseFormat(true,"User authenticated successfully",{token}));
  } catch (err) {
    logger.error("Internal server error")
    res.status(500).json(responseFormat(false,"Internal server error",{}));
  }
};

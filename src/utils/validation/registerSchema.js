const Joi = require("joi");

exports.registerSchema = Joi.object({
  firstName: Joi.string().required().min(3),
  lastName: Joi.string().required().min(5),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phoneNumber: Joi.string().length(10).required(),
  dateOfBirth: Joi.date().required(),
  address: Joi.string().required(),
});
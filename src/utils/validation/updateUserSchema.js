const Joi = require("joi");

exports.updateUserSchema = Joi.object({
    firstName: Joi.string().min(3),
    lastName: Joi.string().min(5),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    phoneNumber: Joi.string().length(10),
    dateOfBirth: Joi.date(),
    address: Joi.string()
  });

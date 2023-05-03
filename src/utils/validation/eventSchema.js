const Joi = require("joi");

exports.eventSchema = Joi.object({
  name: Joi.string().required().min(5),
  description: Joi.string().required().min(10),
  dateTime: Joi.date(),
  location: Joi.string().required().min(5),
  //Add on
  longitude: Joi.number().required(),
  latitude: Joi.number().required(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  frequency: Joi.alternatives().try(Joi.string(), Joi.array()),
  recurrenceType: Joi.string(),
});

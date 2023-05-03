const Joi = require("joi");

exports.updateEventSchema = Joi.object({
  name: Joi.string().min(5),
  description: Joi.string().min(10),
  dateTime: Joi.date(),
  location: Joi.string().min(5),
  //Add on
  longitude: Joi.number(),
  latitude: Joi.number(),
});

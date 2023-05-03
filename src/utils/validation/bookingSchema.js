const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi)

exports.bookingSchema = Joi.object({
    userId: Joi.objectId().required(),
    eventId: Joi.objectId().required()
});
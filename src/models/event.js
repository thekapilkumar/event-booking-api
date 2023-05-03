const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  //Add on
  longitude: {
    type: Number,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  id: {
    type: String,
    required: true,
    unique: true,
  },
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;

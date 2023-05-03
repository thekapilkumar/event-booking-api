const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    firstName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 20,
    },
    lastName: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 10,
    },
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    }
  },
  event: {
    name: {
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
    eventId: {
      type: String,
      required: true,
    }
  },
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;

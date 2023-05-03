const express = require("express");

const { authenticateUser } = require("../middleware/authenticateUser");
const { isAdmin } = require("../middleware/isAdmin");
const {
  bookEvent,
  getAllBookings,
  getUserBookings,
  cancelBooking,
  exportBookingDataToCSV,
  generateTicket,
} = require("../controllers/bookingController");

const router = express.Router();

//for user
router.post("/", authenticateUser, bookEvent);
router.get("/all", authenticateUser, getUserBookings);
router.delete("/", authenticateUser, cancelBooking);

//for admin
router.get("/", authenticateUser, isAdmin, getAllBookings);
router.get("/export/csv", authenticateUser, isAdmin, exportBookingDataToCSV);
router.get("/export/bookingTicket/:id",authenticateUser, generateTicket);

module.exports = router;

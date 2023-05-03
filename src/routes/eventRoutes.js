const express = require("express");

const { authenticateUser } = require("../middleware/authenticateUser");
const { isAdmin } = require("../middleware/isAdmin");
const {
  createEvent,
  updateEvent,
  getAllEvents,
  getEventById,
  deleteEvent,
  getEventsByMap,
  createRecurringEvent,
} = require("../controllers/eventController");

const router = express.Router();

//for user
router.get("/all", authenticateUser, getAllEvents);
router.get("/map", authenticateUser, getEventsByMap);
router.get("/:ID", authenticateUser, getEventById);

//for admin
router.post("/add", authenticateUser, isAdmin, createEvent);
router.post("/addRecurring", authenticateUser, isAdmin, createRecurringEvent);
router.patch("/:ID", authenticateUser, isAdmin, updateEvent);
router.delete("/:ID", authenticateUser, isAdmin, deleteEvent);

module.exports = router;

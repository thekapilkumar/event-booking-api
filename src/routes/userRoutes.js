const express = require("express");
const { register, login } = require("../controllers/authController");
const {
  updateUser,
  viewProfile,
  viewProfilebyID,
  getAllUsers,
} = require("../controllers/userController");
const { authenticateUser } = require("../middleware/authenticateUser");
const { isAdmin } = require("../middleware/isAdmin");

const router = express.Router();

//for user
router.post("/register", register);
router.post("/login", login);
router.patch("/editprofile", authenticateUser, updateUser);
router.get("/viewprofile", authenticateUser, viewProfile);

//for admin
router.get("/allusers", authenticateUser, isAdmin, getAllUsers);
router.get("/:ID", authenticateUser, isAdmin, viewProfilebyID);

module.exports = router;

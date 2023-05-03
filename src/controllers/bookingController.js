const Booking = require("../models/booking");
const Event = require("../models/event");
const User = require("../models/user");
const csv = require("csv-writer").createObjectCsvWriter;
const PDFDocument = require("pdfkit");
const { bookingSchema } = require("../utils/validation/bookingSchema");
const { responseFormat } = require("../utils/responseFormat");
const { generateQRCode } = require("../utils/generateQRCode");

exports.bookEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.userData.userId;

    const { error } = bookingSchema.validate({ userId, eventId });
    if (error) {
      return res
        .status(400)
        .json(responseFormat(false, error.details[0].message, {}));
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json(responseFormat(false, "User not found", {}));

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json(responseFormat(false, "Event not found", {}));

    //check if booking already exists for the user and event
    const existingBooking = await Booking.findOne({
      "user.userId": user._id,
      "event.eventId": event._id,
    });
    if (existingBooking) {
      return res
        .status(409)
        .json(responseFormat(false, "Booking already exists", {}));
    }

    const booking = new Booking({
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
      },
      event: {
        eventId: event._id,
        name: event.name,
        dateTime: event.dateTime,
        location: event.location,
      },
    });
    const result = await booking.save();
    const qrCodeData = {
      userName: user.firstName + " " + user.lastName,
      eventName: event.name,
      dateTime: event.dateTime,
      location: event.location,
      longitude: event.longitude,
      latitude: event.latitude,
      id: event.id,
    };
    generateQRCode(qrCodeData, res);
    res
      .status(201)
      .json(responseFormat(true, "Booking Successfully", { result }));
  } catch (err) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res
      .status(200)
      .json(responseFormat(true, "Bookings fetch Successfully", { bookings }));
  } catch (err) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const bookings = await Booking.find({ "user.userId": userId });

    res
      .status(200)
      .json(responseFormat(true, "Bookings fetch Successfully", { bookings }));
  } catch (err) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const eventId = req.body.eventId;

    const booking = await Booking.findOne({
      "user.userId": userId,
      "event.eventId": eventId,
    });

    if (!booking) {
      return res
        .status(404)
        .json(responseFormat(false, "Booking not found", {}));
    }
    await Booking.deleteOne({
      "user.userId": userId,
      "event.eventId": eventId,
    });

    res
      .status(200)
      .json(responseFormat(true, "Booking cancel successfully", {}));
  } catch (err) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.exportBookingDataToCSV = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    const bookings = await Booking.find({
      "event.dateTime": { $gte: fromDateObj, $lte: toDateObj },
    });

    const csvWriter = csv({
      path: `./data/files/bookings${fromDate}to${toDate}.csv`,
      header: [
        { id: "bookingID", title: "Booking ID" },
        { id: "firstName", title: "First Name" },
        { id: "lastName", title: "Last Name" },
        { id: "phoneNumber", title: "Phone Number" },
        { id: "email", title: "Email" },
        { id: "eventName", title: "Event Name" },
        { id: "eventDateTime", title: "Event Date and Time" },
        { id: "eventLocation", title: "Event Location" },
      ],
    });

    const records = bookings.map((booking) => {
      return {
        bookingID: booking._id,
        firstName: booking.user.firstName,
        lastName: booking.user.lastName,
        phoneNumber: booking.user.phoneNumber,
        email: booking.user.email,
        eventName: booking.event.name,
        eventDateTime: booking.event.dateTime.toLocaleString(),
        eventLocation: booking.event.location,
      };
    });

    await csvWriter.writeRecords(records);

    res
      .status(200)
      .json(responseFormat(true, "Booking data exported to CSV", {}));
  } catch (err) {
    res
      .status(500)
      .json(responseFormat(false, "Internal server error", { err }));
  }
};

exports.generateTicket = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.userData.userId;

    const booking = await Booking.findOne({
      "user.userId": userId,
      _id: bookingId,
    });

    if (!booking) {
      return res
        .status(404)
        .json(responseFormat(false, "Booking not found", {}));
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the document title
    doc.info["Title"] = `Booking Ticket - ${bookingId}`;

    // Set the response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${bookingId}.pdf`
    );

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add the booking information to the PDF
    // doc.fontSize(20).text('Booking Information');
    doc
      .fontSize(14)
      .text(`Name: ${booking.user.firstName} ${booking.user.lastName}`);
    doc.fontSize(14).text(`Email: ${booking.user.email}`);
    doc.fontSize(14).text(`Phone: ${booking.user.phoneNumber}`);
    doc.fontSize(14).text(`Event: ${booking.event.name}`);
    doc.fontSize(14).text(`Date: ${booking.event.dateTime}`);
    doc.fontSize(14).text(`Location: ${booking.event.location}`);

    // Finalize the PDF document
    doc.end();
  } catch (err) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

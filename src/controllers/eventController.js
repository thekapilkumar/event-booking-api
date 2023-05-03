const Event = require("../models/event");
const { eventSchema } = require("../utils/validation/eventSchema");
const { updateEventSchema } = require("../utils/validation/updateEventSchema");
const { responseFormat } = require("../utils/responseFormat");
const { generateUniqueId } = require("../utils/generateUniqueID");
const { calculateDistance } = require("../utils/calculateDistance");
const ObjectId = require('mongoose').Types.ObjectId;

exports.createEvent = async (req, res) => {
  try {
    const { error } = eventSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(responseFormat(false, error.details[0].message, {}));
    }

    const event = new Event({
      name: req.body.name,
      description: req.body.description,
      dateTime: req.body.dateTime,
      location: req.body.location,
      //add on
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      id: generateUniqueId(),
    });
    await event.save();

    res
      .status(201)
      .json(responseFormat(true, "Event created successfully", { event }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { name, description, dateTime, location, longitude, latitude } =
      req.body;
    
    const isValidObjectID = ObjectId.isValid(req.params.ID);
    if(!isValidObjectID){
      return res.status(404).json(responseFormat(false, "Event ID is not valid", {}));
    }
    const { error } = updateEventSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(responseFormat(false, error.details[0].message, {}));
    }

    const event = await Event.findById(req.params.ID);
    if (!event)
      return res.status(404).json(responseFormat(false, "Event not found", {}));

    event.name = name || event.name;
    event.description = description || event.description;
    event.dateTime = dateTime || event.dateTime;
    event.location = location || event.location;
    //Add on
    event.longitude = longitude || event.longitude;
    event.latitude = latitude || event.latitude;
    await event.save();

    res
      .status(200)
      .json(responseFormat(true, "Event updated successfully", { event }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ dateTime: "asc" });
    res
      .status(200)
      .json(responseFormat(true, "Events found successfully", { events }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.ID;
    const isValidObjectID = ObjectId.isValid(eventId);
    if(!isValidObjectID){
      return res.status(404).json(responseFormat(false, "Event ID is not valid", {}));
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json(responseFormat(false, "Event not found", {}));
    }
    res
      .status(200)
      .json(responseFormat(true, "Event found successfully", { event }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.ID;
    const isValidObjectID = ObjectId.isValid(eventId);
    if(!isValidObjectID){
      return res.status(404).json(responseFormat(false, "Event ID is not valid", {}));
    }
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return res.status(404).json(responseFormat(false, "Event not found", {}));
    }
    res
      .status(200)
      .json(responseFormat(true, "Event deleted successfully", { event }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};


exports.getEventsByMap = async (req, res) => {
  try {
    const { longitude, latitude, radius } = req.query;
    const events = await Event.find({
      longitude: {
        $gte: Number(longitude) - Number(radius),
        $lte: Number(longitude) + Number(radius),
      },
      latitude: {
        $gte: Number(latitude) - Number(radius),
        $lte: Number(latitude) + Number(radius),
      },
    });
    if (events.length===0)
      return res
        .status(404)
        .json(responseFormat(false, "Events not found", {}));
    
    // Calculate distance for each event
    const eventsWithDistance = events.map(event => {
      const distance = calculateDistance(Number(latitude), Number(longitude), event.latitude, event.longitude);
      return { ...event.toObject(), distance };
    });

    res
      .status(200)
      .json(responseFormat(true, "Events found successfully", { events: eventsWithDistance }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};


exports.createRecurringEvent = async (req, res) => {
  try {
    const { name, description, location, longitude, latitude } = req.body;
    const { startDate, endDate, frequency, recurrenceType } = req.body;

    // validate input data
    const { error } = eventSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(responseFormat(false, error.details[0].message, {}));
    }
    if (!name || !description || !location || !longitude || !latitude || !startDate || !endDate || !frequency || !recurrenceType) {
      return res.status(400).json(responseFormat(false, "Invalid input data", {}));
    }

    // ensure frequency is an array
    const frequencies = Array.isArray(frequency) ? frequency : [frequency];

    // calculate recurring dates for each frequency
    let recurringDates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(endDate)) {
      frequencies.forEach((freq) => {
        if (recurrenceType === 'weekly') {
          // add event for selected day of the week
          const weekday = +freq;
          if (currentDate.getDay() === weekday) {
            recurringDates.push(new Date(currentDate));
          }
        } else if (recurrenceType === 'monthly') {
          // add event for selected day of the month
          const dayOfMonth = +freq;
          if (currentDate.getDate() === dayOfMonth) {
            recurringDates.push(new Date(currentDate));
          }
        } else if (recurrenceType === 'daily') {
          // add event for every day
          recurringDates.push(new Date(currentDate));
        }
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // create recurring events
    const events = await Promise.all(recurringDates.map(async (date) => {
      const event = new Event({
        name,
        description,
        dateTime: date,
        location,
        longitude,
        latitude,
        id: generateUniqueId(),
      });
      await event.save();
      return event;
    }));

    res.status(201).json(responseFormat(true, "Recurring events created successfully", { events }));
  } catch (error) {
    res.status(500).json(responseFormat(false, "Internal server error", {}));
  }
};
const request = require("supertest");
const app = require("../server");
const Event = require("../models/event");
const User = require("../models/user");
const Booking = require("../models/booking");
const { ObjectId } = require("mongoose").Types;
const bcrypt = require("bcrypt");
const { generateUniqueId } = require("../utils/generateUniqueID");

describe("POST /api/booking", () => {
  let user, event, token;

  beforeAll(async () => {
    // Create test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);
    user = await User.create({
      firstName: "user",
      lastName: "testing",
      password: hashedPassword,
      email: "testuser@test.com",
      phoneNumber: "1234567890",
      dateOfBirth: "01/01/2000",
      address: "Noida",
      isAdmin: false,
    });

    // Create test event
    event = await Event.create({
      name: "Test Event",
      description: "This is a test event",
      dateTime: "01/01/2024",
      location: "123 Main St",
      longitude: 0,
      latitude: 0,
      id: generateUniqueId(),
    });

    // Get JWT token for user
    const res = await request(app).post("/api/user/login").send({
      email: user.email,
      password: "password",
    });
    token = res.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteOne({ _id: user._id });
    await Event.deleteOne({ _id: event._id });
  });

  it("should return a 201 status code and create a booking", async () => {
    const response = await request(app)
      .post("/api/booking")
      .send({ eventId: event._id })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe("Booking Successfully");
    expect(response.body.data.result.user.userId).toBe(user._id.toString());
    expect(response.body.data.result.user.firstName).toBe(user.firstName);
    expect(response.body.data.result.user.lastName).toBe(user.lastName);
    expect(response.body.data.result.user.phoneNumber).toBe(user.phoneNumber);
    expect(response.body.data.result.user.email).toBe(user.email);
    expect(response.body.data.result.event.eventId).toBe(event._id.toString());
    expect(response.body.data.result.event.name).toBe(event.name);
    expect(response.body.data.result.event.dateTime).toBe(
      event.dateTime.toISOString()
    );
    expect(response.body.data.result.event.location).toBe(event.location);

    // Check that the booking was actually created in the database
    const booking = await Booking.findById(response.body.data.result._id);
    expect(booking).not.toBeNull();
    expect(booking.user.userId.toString()).toBe(user._id.toString());
    expect(booking.event.eventId.toString()).toBe(event._id.toString());

    await Booking.findByIdAndDelete(response.body.data.result._id);
  });

  it("should return 401 if user is not authenticated", async () => {
    const res = await request(app)
      .post("/api/booking")
      .send({ eventId: event.id });
    expect(res.status).toBe(401);
  });

  it("should return 400 if eventId is not provided", async () => {
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe('"eventId" is required');
  });

  it("should return 404 if event is not found", async () => {
    const nonExistentID = new ObjectId().toString();
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: nonExistentID });
    expect(res.status).toBe(404);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Event not found");
  });
});

describe("GET /api/booking", () => {
  let token, event, user;
  beforeAll(async () => {
    // Create test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);
    user = await User.create({
      firstName: "user",
      lastName: "testing",
      password: hashedPassword,
      email: "testuser@test.com",
      phoneNumber: "1234567890",
      dateOfBirth: "01/01/2000",
      address: "Noida",
      isAdmin: true,
    });

    // Create test event
    event = await Event.create({
      name: "Test Event",
      description: "This is a test event",
      dateTime: "01/01/2024",
      location: "123 Main St",
      longitude: 0,
      latitude: 0,
      id: generateUniqueId(),
    });

    // Get JWT token for user
    const res = await request(app).post("/api/user/login").send({
      email: user.email,
      password: "password",
    });
    token = res.body.data.token;
    await request(app)
      .post("/api/booking")
      .send({ eventId: event._id })
      .set("Authorization", `Bearer ${token}`);
  });

  afterAll(async () => {
    await Booking.deleteMany({});
    await User.deleteOne({ _id: user._id });
    await Event.deleteOne({ _id: event._id });
  });

  it("should return a list of bookings", async () => {
    const response = await request(app)
      .get("/api/booking")
      .set("Authorization", "Bearer " + token);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe("Bookings fetch Successfully");
    expect(response.body.data.bookings.length).toBeGreaterThan(0);
  });

  it("should return an error if an invalid token is provided", async () => {
    const response = await request(app)
      .get("/api/booking")
      .set("Authorization", "Bearer " + "invalidtoken");
    expect(response.status).toBe(401);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
  });

  it("should return an error if there is an internal server error", async () => {
    jest.spyOn(Booking, "find").mockImplementation(() => {
      throw new Error();
    });
    const response = await request(app)
      .get("/api/booking")
      .set("Authorization", "Bearer " + token);
    expect(response.status).toBe(500);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Internal server error");
  });
});

describe("DELETE /api/booking", () => {
  let token, event, user, booking;
  beforeAll(async () => {
    // Create test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);
    user = await User.create({
      firstName: "user",
      lastName: "testing",
      password: hashedPassword,
      email: "user1@test.com",
      phoneNumber: "1234567428",
      dateOfBirth: "01/01/2000",
      address: "Noida",
      isAdmin: false,
    });

    // Create test event
    event = await Event.create({
      name: "Test Event",
      description: "This is a test event",
      dateTime: "01/01/2024",
      location: "123 Main St",
      longitude: 0,
      latitude: 0,
      id: generateUniqueId(),
    });

    // Get JWT token for user
    const res = await request(app).post("/api/user/login").send({
      email: user.email,
      password: "password",
    });
    token = res.body.data.token;
    booking = await request(app)
      .post("/api/booking")
      .send({ eventId: event._id })
      .set("Authorization", `Bearer ${token}`);
  });

  afterAll(async () => {
    await Booking.deleteMany({});
    await User.deleteOne({ _id: user._id });
    await Event.deleteOne({ _id: event._id });
  });

  it("should return 404 if the booking is not found", async () => {
    const nonExistentID = new ObjectId().toString();
    const response = await request(app)
      .delete("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: nonExistentID });
    expect(response.status).toBe(404);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Booking not found");
  });

  it("should delete the booking and return 200", async () => {
    const response = await request(app)
      .delete("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: event._id });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: true,
      message: "Booking cancel successfully",
      data: {},
    });
    const deletedBooking = await Booking.findById(booking._id);
    expect(deletedBooking).toBeNull();
  });

  it("should return 500 if there is an error", async () => {
    jest.spyOn(Booking, "findOne").mockImplementation(() => {
      throw new Error("Test Error");
    });
    const response = await request(app)
      .delete("/api/booking")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: event._id });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: false,
      message: "Internal server error",
      data: {},
    });
    jest.spyOn(Booking, "findOne").mockRestore();
  });
});

describe("GET /api/booking/export/bookingTicket/:bookingId", () => {
  let token, event, user, bookingId;
  beforeAll(async () => {
    // Create test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);
    user = await User.create({
      firstName: "user",
      lastName: "testing",
      password: hashedPassword,
      email: "user1@test.com",
      phoneNumber: "1234567428",
      dateOfBirth: "01/01/2000",
      address: "Noida",
      isAdmin: false,
    });

    // Create test event
    event = await Event.create({
      name: "Test Event",
      description: "This is a test event",
      dateTime: "01/01/2024",
      location: "123 Main St",
      longitude: 0,
      latitude: 0,
      id: generateUniqueId(),
    });

    // Get JWT token for user
    const res = await request(app).post("/api/user/login").send({
      email: user.email,
      password: "password",
    });
    token = res.body.data.token;
    const booking = await request(app)
      .post("/api/booking")
      .send({ eventId: event._id })
      .set("Authorization", `Bearer ${token}`);

    bookingId = booking._body.data.result._id;
  });

  afterAll(async () => {
    await Booking.deleteMany({});
    await User.deleteOne({ _id: user._id });
    await Event.deleteOne({ _id: event._id });
  });

  it("should generate a PDF ticket for a valid booking", async () => {
    const response = await request(app)
      .get(`/api/booking/export/bookingTicket/${bookingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.header["content-type"]).toBe("application/pdf");
    expect(response.header["content-disposition"]).toContain(
      `${bookingId}.pdf`
    );
  });

  it("should return a 404 error if the booking is not found", async () => {
    const nonExistentID = new ObjectId().toString();
    const response = await request(app)
      .get(`/api/booking/export/bookingTicket/${nonExistentID}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Booking not found");
    expect(response.body.data).toEqual({});
  });

  it("should return 401 if user is not authenticated", async () => {
    const res = await request(app).get(
      `/api/booking/export/bookingTicket/${bookingId}`
    );
    expect(res.status).toBe(401);
  });
});

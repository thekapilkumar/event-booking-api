const request = require("supertest");
const app = require("../server");
const Event = require("../models/event");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongoose").Types;
const { generateUniqueId } = require("../utils/generateUniqueID");

describe("POST /api/event/add", () => {
  let user;
  let token;

  beforeAll(async () => {
    // Create a test user
    user = new User({
      firstName: "user",
      lastName: "testing",
      email: "usertesting@test.com",
      password: "password",
      phoneNumber: "1234567890",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });
    await user.save();

    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    // Delete the test user
    await User.findByIdAndRemove(user._id);
  });

  it("should create an event when valid input is provided", async () => {
    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 43.5,
      latitude: 56.8,
    };

    const response = await request(app)
      .post("/api/event/add")
      .set("Authorization", `Bearer ${token}`)
      .send(event)
      .expect(201);

    const createdEvent = await Event.findOne({
      _id: response.body.data.event._id,
    });
    expect(createdEvent).toBeTruthy();
    expect(createdEvent.name).toBe(event.name);
    expect(createdEvent.description).toBe(event.description);
    expect(createdEvent.dateTime.toISOString()).toBe(
      event.dateTime.toISOString()
    );
    expect(createdEvent.location).toBe(event.location);
    expect(createdEvent.longitude).toBe(event.longitude);
    expect(createdEvent.latitude).toBe(event.latitude);
    expect(createdEvent.id).toHaveLength(10);

    await Event.findByIdAndRemove(createdEvent._id);
  });

  it("should return 400 when invalid input is provided", async () => {
    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
    };

    const response = await request(app)
      .post("/api/event/add")
      .set("Authorization", `Bearer ${token}`)
      .send(event)
      .expect(400);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toMatch(/is required/);
  });

  it("should return 401 when user is not authenticated", async () => {
    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 0,
      latitude: 0,
    };

    const response = await request(app)
      .post("/api/event/add")
      .send(event)
      .expect(401);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
  });

  it("should return 403 when user is not an admin", async () => {
    const nonAdminToken = jwt.sign(
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET
    );

    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 0,
      latitude: 0,
    };

    const response = await request(app)
      .post("/api/event/add")
      .set("Authorization", `Bearer ${nonAdminToken}`)
      .send(event)
      .expect(403);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Not authorized");
  });
});

describe("PATCH /api/event/:ID", () => {
  let user;
  let token;

  beforeAll(async () => {
    // Create a test user
    user = new User({
      firstName: "user",
      lastName: "testing",
      email: "user@test.com",
      password: "password",
      phoneNumber: "1234567890",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });
    await user.save();

    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    // Delete the test user
    await User.findByIdAndRemove(user._id);
  });

  it("should update an event when valid input is provided", async () => {
    // Create a new event
    const newEvent = new Event({
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 43.5,
      latitude: 56.8,
      id: generateUniqueId(),
    });
    await newEvent.save();

    const updatedEvent = {
      name: "Updated Test Event",
      description: "This is an updated test event.",
      dateTime: new Date(),
      location: "Updated Test Location",
      longitude: 46.5,
      latitude: 59.8,
    };

    const response = await request(app)
      .patch(`/api/event/${newEvent._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedEvent)
      .expect(200);

    const event = response.body.data.event;
    expect(event.name).toBe(updatedEvent.name);
    expect(event.description).toBe(updatedEvent.description);
    expect(event.dateTime).toBe(updatedEvent.dateTime.toISOString());
    expect(event.location).toBe(updatedEvent.location);
    expect(event.longitude).toBe(updatedEvent.longitude);
    expect(event.latitude).toBe(updatedEvent.latitude);

    await Event.findByIdAndRemove(newEvent._id);
  });

  it("should return 404 when invalid event ID is provided", async () => {
    const updatedEvent = {
      name: "Updated Test Event",
      description: "This is an updated test event.",
      dateTime: new Date(),
      location: "Updated Test Location",
      longitude: 46.5,
      latitude: 59.8,
    };

    const response = await request(app)
      .patch(`/api/event/1234`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedEvent)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Event ID is not valid");
  });

  it("should return 404 when event not found", async () => {
    const nonExistentID = new ObjectId().toString();
    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 0,
      latitude: 0,
    };
    const response = await request(app)
      .patch(`/api/event/${nonExistentID}`)
      .set("Authorization", `Bearer ${token}`)
      .send(event)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Event not found");
  });

  it("should return 401 when user is not authenticated", async () => {
    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 45.26,
      latitude: 78.6,
    };
    const nonExistentID = new ObjectId().toString();
    const response = await request(app)
      .patch(`/api/event/${nonExistentID}`)
      .send(event)
      .expect(401);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
  });

  it("should return 403 when user is not an Admin", async () => {
    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 45.26,
      latitude: 78.6,
    };
    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET
    );
    const nonExistentID = new ObjectId().toString();
    const response = await request(app)
      .patch(`/api/event/${nonExistentID}`)
      .set("Authorization", `Bearer ${token}`)
      .send(event)
      .expect(403);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Not authorized");
  });
});

describe("GET /api/event/all", () => {
  let token, user;

  beforeAll(async () => {
    // Create a test user
    user = new User({
      firstName: "user",
      lastName: "testing",
      email: "user@test.com",
      password: "password",
      phoneNumber: "1234567890",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });
    await user.save();

    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    // Delete all events and the test user
    await User.findByIdAndRemove(user._id);
  });

  it("should return all events when user is authenticated", async () => {
    // Create test events
    const event1 = new Event({
      name: "Event 1",
      description: "This is event 1.",
      dateTime: new Date("2023-06-01T14:00:00.000Z"),
      location: "Location 1",
      longitude: 43.5,
      latitude: 56.8,
      id: generateUniqueId(),
    });

    const event2 = new Event({
      name: "Event 2",
      description: "This is event 2.",
      dateTime: new Date("2023-06-02T14:00:00.000Z"),
      location: "Location 2",
      longitude: 44.5,
      latitude: 57.8,
      id: generateUniqueId(),
    });

    await event1.save();
    await event2.save();

    const response = await request(app)
      .get("/api/event/all")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe("Events found successfully");
    expect(response.body.data.events.length).toBeGreaterThan(1);
  });

  it("should return 401 when user is not authenticated", async () => {
    const response = await request(app).get("/api/event/all").expect(401);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
  });
});

describe("GET /api/event/:ID", () => {
  let token;
  let event;
  let user;

  beforeAll(async () => {
    // Create a test user
    user = new User({
      firstName: "user",
      lastName: "testing",
      email: "user@test.com",
      password: "password",
      phoneNumber: "1234567890",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });
    await user.save();

    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET
    );

    // Create a test event
    event = new Event({
      name: "Event 1",
      description: "This is event 1.",
      dateTime: new Date(),
      location: "Location 1",
      longitude: 43.5,
      latitude: 56.8,
      id: generateUniqueId(),
    });
    await event.save();
  });

  afterAll(async () => {
    // Delete the test event
    await Event.findByIdAndRemove(event._id);
    await User.findByIdAndRemove(user._id);
  });

  it("should return 401 when user is not authenticated", async () => {
    const response = await request(app)
      .get(`/api/event/${event._id}`)
      .expect(401);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
  });

  it("should return a 404 status if the event ID is not valid", async () => {
    const response = await request(app)
      .get(`/api/event/123`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Event ID is not valid");
  });

  it("should return a 404 status if the event with the given ID is not found", async () => {
    const nonExistentID = new ObjectId().toString();
    const response = await request(app)
      .get(`/api/event/${nonExistentID}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Event not found");
  });

  it("should return the event object with a 200 status if the event is found", async () => {
    const response = await request(app)
      .get(`/api/event/${event._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe("Event found successfully");
    expect(response.body.data.event.name).toBe(event.name);
    expect(response.body.data.event.description).toBe(event.description);
    expect(response.body.data.event.dateTime).toBe(
      event.dateTime.toISOString()
    );
    expect(response.body.data.event.location).toBe(event.location);
    expect(response.body.data.event._id).toBe(event._id.toString());
  });

  it("should return a 500 status if an error occurs while processing the request", async () => {
    // Mock the Event.findById method to throw an error
    //spyOn is a function to create a mock implementation
    jest.spyOn(Event, "findById").mockImplementationOnce(() => {
      throw new Error();
    });

    const response = await request(app)
      .get(`/api/event/${event._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(500);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Internal server error");
  });
});

describe("DELETE /api/event/:ID", () => {
  let user;
  let token;
  let eventId;

  beforeAll(async () => {
    // Create a test user
    user = new User({
      firstName: "user",
      lastName: "testing",
      email: "user@test.com",
      password: "password",
      phoneNumber: "1234567890",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });

    await user.save();

    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET
    );

    // Create a test event
    const event = {
      name: "Test Event",
      description: "This is a test event.",
      dateTime: new Date(),
      location: "Test Location",
      longitude: 43.5,
      latitude: 56.8,
      id: generateUniqueId(),
    };

    const createdEvent = await Event.create(event);
    eventId = createdEvent._id.toString();
  });

  afterAll(async () => {
    // Delete the test user and event
    await User.findByIdAndRemove(user._id);
    await Event.findByIdAndRemove(eventId);
  });

  it("should delete an event when a valid event ID is provided", async () => {
    const response = await request(app)
      .delete(`/api/event/${eventId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe("Event deleted successfully");
    expect(response.body.data.event._id).toBe(eventId);

    const deletedEvent = await Event.findById(eventId);
    expect(deletedEvent).toBeNull();
  });

  it("should return a 404 error when an invalid event ID is provided", async () => {
    const invalidId = "78295552";

    const response = await request(app)
      .delete(`/api/event/${invalidId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Event ID is not valid");
    expect(response.body.data).toEqual({});
  });

  it("should return a 404 error when the event with the provided ID is not found", async () => {
    const nonExistentID = new ObjectId().toString();

    const response = await request(app)
      .delete(`/api/event/${nonExistentID}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Event not found");
    expect(response.body.data).toEqual({});
  });

  it("should return a 401 error when the user is not authenticated", async () => {
    const response = await request(app)
      .delete(`/api/event/${eventId}`)
      .expect(401);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
    expect(response.body.data).toEqual({});
  });

  it("should return a 403 error when the user is not an Admin", async () => {
    token = jwt.sign(
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET
    );
    const response = await request(app)
      .delete(`/api/event/${eventId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Not authorized");
    expect(response.body.data).toEqual({});
  });
});

describe("GET /api/event/map", () => {
  let token;
  let user;

  beforeAll(async () => {
    // Create a test user
    user = new User({
      firstName: "user",
      lastName: "testing",
      email: "user@test.com",
      password: "password",
      phoneNumber: "1234567890",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });

    await user.save();

    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET
    );
    // Create test events
    const testEvents = [
      {
        name: "Test Event 1",
        description: "This is a test event 1.",
        dateTime: new Date(),
        location: "Test Location 1",
        longitude: 10.0,
        latitude: 20.0,
        id: generateUniqueId(),
      },
      {
        name: "Test Event 2",
        description: "This is a test event 2.",
        dateTime: new Date(),
        location: "Test Location 2",
        longitude: 20.0,
        latitude: 30.0,
        id: generateUniqueId(),
      },
      {
        name: "Test Event 3",
        description: "This is a test event 3.",
        dateTime: new Date(),
        location: "Test Location 3",
        longitude: 30.0,
        latitude: 40.0,
        id: generateUniqueId(),
      },
    ];
    await Event.insertMany(testEvents);

    // Generate a JWT for authentication
    token = jwt.sign(
      { userId: user._id, isAdmin: true },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    // Delete the test events
    await Event.deleteMany({});
    await User.findByIdAndDelete(user._id);
  });

  it("should return events within the given radius", async () => {
    const response = await request(app)
      .get("/api/event/map")
      .set("Authorization", `Bearer ${token}`)
      .query({ longitude: 20.0, latitude: 30.0, radius: 20 });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe("Events found successfully");
  });

  it("should return 404 if no events found", async () => {
    const response = await request(app)
      .get("/api/event/map")
      .set("Authorization", `Bearer ${token}`)
      .query({ longitude: 5.0, latitude: 6.0, radius: 1 });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Events not found");
    expect(response.body.data).toEqual({});
  });

  it("should return 401 if user is not authenticated", async () => {
    const response = await request(app)
      .get("/api/event/map")
      .query({ longitude: 20.0, latitude: 30.0, radius: 200 });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
    expect(response.body.data).toEqual({});
  });
});

describe("POST /api/event/addRecurring", () => {
  let token;
  // Mock user data
  const user = {
    firstName: "user",
    lastName: "testing",
    email: "user@test.com",
    password: "password",
    phoneNumber: "1234567890",
    dateOfBirth: "1990-01-01",
    address: "Noida",
  };

  // Mock event data
  const event = {
    name: "Test Event",
    description: "This is a test event",
    location: "Test Location",
    longitude: 12.3456789,
    latitude: 98.7654321,
    startDate: "2023-05-01",
    endDate: "2023-05-10",
    frequency: [1, 3, 5], // Monday, Wednesday, Friday
    recurrenceType: "weekly",
  };

  beforeAll(async () => {
    // Create a test user
    const newUser = new User(user);
    await newUser.save();

    // Generate a JWT for the test user
    token = jwt.sign(
      { userId: newUser._id, isAdmin: true },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    // Delete the test user
    await User.deleteMany({ email: user.email });
    await Event.deleteMany();
  });

  it("should create recurring events when valid input data is provided", async () => {
    const response = await request(app)
      .post("/api/event/addRecurring")
      .set("Authorization", `Bearer ${token}`)
      .send(event);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe("Recurring events created successfully");
    expect(response.body.data.events.length).toBeGreaterThan(0);
  });

  it("should return a 400 status code if invalid input data is provided", async () => {
    const invalidEvent = { ...event, name: "" };

    const response = await request(app)
      .post("/api/event/addRecurring")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidEvent);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('"name" is not allowed to be empty');
  });

  it("should return a 401 status code if no authentication token is provided", async () => {
    const response = await request(app)
      .post("/api/event/addRecurring")
      .send(event);

    expect(response.status).toBe(401);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Authentication failed");
  });

  it("should return a 403 status code if the user is not an admin", async () => {
    const newUser = new User({
      ...user,
      isAdmin: false,
      email: "notadmin@test.com",
      phoneNumber: "7412589630",
    });
    await newUser.save();

    const nonAdminToken = jwt.sign(
      { userId: newUser._id, isAdmin: false },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post("/api/event/addRecurring")
      .set("Authorization", `Bearer ${nonAdminToken}`)
      .send(event);

    expect(response.status).toBe(403);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Not authorized");

    await User.findByIdAndDelete(newUser._id);
  });
});

const request = require("supertest");
//supertest is a library that allows for easy testing of HTTP requests and responses in Node.js applications.
//It provides a fluent API for sending HTTP requests and making assertions about the response.
const app = require("../server");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

describe("POST /login", () => {
  let user;

  beforeEach(async () => {
    // Create a test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);
    user = new User({
      firstName: "Rahul",
      lastName: "kumar",
      email: "rahul@test.com",
      password: hashedPassword,
      phoneNumber: "7894561230",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });
    await user.save();
  });

  afterEach(async () => {
    // Delete the test user from the database after running each test case
    await User.findByIdAndDelete(user._id);
  });

  it("should return 401 if email is invalid", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "invalid@test.com",
      password: "password",
    });
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("should return 401 if password is invalid", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "rahul@test.com",
      password: "invalid",
    });
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("should return 200 with token if credentials are valid", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "rahul@test.com",
      password: "password",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe("User authenticated successfully");
    expect(res.body.data.token).toBeDefined();
    const decodedToken = jwt.verify(
      res.body.data.token,
      process.env.JWT_SECRET
    );
    expect(decodedToken.userId).toBe(user._id.toString());
    expect(decodedToken.isAdmin).toBe(user.isAdmin);
  });
});

describe("POST /register", () => {
  beforeEach(async () => {
    // Delete all users from the database before running each test case
    await User.deleteMany({});
  });

  it("should return 400 if validation fails", async () => {
    const res = await request(app).post("/api/user/register").send({
      firstName: "gb",
      lastName: "fv",
      email: "fghnvf",
      password: "short",
      phoneNumber: "siofkljcbsrgjklfd",
      dateOfBirth: "45866555",
      address: "",
    });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
  });

  it("should return 409 if user already exists with the same email", async () => {
    // Create a test user
    const existingUser = new User({
      firstName: "Testing",
      lastName: "lastname",
      email: "test@test.com",
      password: "password",
      phoneNumber: "1234567897",
      dateOfBirth: "2000-01-01",
      address: "Noida",
    });
    await existingUser.save();

    const res = await request(app).post("/api/user/register").send({
      firstName: "New",
      lastName: "testing",
      email: "test@test.com",
      password: "password",
      phoneNumber: "0987654321",
      dateOfBirth: "2000-01-01",
      address: "Noida",
    });
    expect(res.status).toBe(409);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);

    // Delete the test user from the database after running the test case
    await User.findByIdAndDelete(existingUser._id);
  });

  it("should return 201 if user is successfully registered", async () => {
    const res = await request(app).post("/api/user/register").send({
      firstName: "testing",
      lastName: "testing",
      email: "testing@test.com",
      password: "password",
      phoneNumber: "1234567890",
      dateOfBirth: "2000-01-01",
      address: "123 Main Street",
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toMatch(/User registered successfully/i);

    // Check if the user was added to the database
    const user = await User.findOne({ email: "testing@test.com" });
    expect(user).toBeTruthy();

    await User.findByIdAndDelete(user._id);
  });
});

const request = require("supertest");
const app = require("../server");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


describe("PATCH /api/user/editprofile", () => {
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
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    // Delete the test user
    await User.findByIdAndRemove(user._id);
  });

  it("should update the user's profile", async () => {
    const updatedUser = {
      firstName: "user",
      lastName: "update",
      email: "user1@test.com",
      password: "newpassword",
      phoneNumber: "9876543210",
      address: "Delhi",
    };

    const res = await request(app)
      .patch("/api/user/editprofile")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedUser);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe("Profile updated successfully");


    // Check that the user's profile was actually updated in the database
    const userInDB = await User.findById(user._id);
    expect(userInDB.firstName).toBe(updatedUser.firstName);
    expect(userInDB.lastName).toBe(updatedUser.lastName);
    expect(userInDB.email).toBe(updatedUser.email);
    expect(userInDB.phoneNumber).toBe(updatedUser.phoneNumber);
    expect(userInDB.address).toBe(updatedUser.address);
    const passwordIsValid = await bcrypt.compare(
      updatedUser.password,
      userInDB.password
    );
    expect(passwordIsValid).toBe(true);
  });

  it("should return 404 if user is not found", async () => {
    await User.findByIdAndRemove(user._id); // delete the test user

    const updatedUser = {
      firstName: "user",
      lastName: "update",
      email: "user@test.com",
      password: "newpassword",
      phoneNumber: "9876543210",
      dateOfBirth: "1995-01-01",
      address: "Delhi",
    };

    const res = await request(app)
      .patch("/api/user/editprofile")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedUser);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  it("should return 401 if user is not authenticated", async () => {
    const updatedUser = {
      firstName: "user",
      lastName: "update",
      email: "userupdate@test.com",
      password: "newpassword",
      phoneNumber: "9876543210",
      address: "Delhi",
    };
  
    const res = await request(app)
      .patch("/api/user/editprofile")
      .send(updatedUser);
  
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Authentication failed");
  });

  it("should return 400 if user provides invalid data", async () => {
    const updatedUser = {
      firstName: "u"
    };
  
    const res = await request(app)
      .patch("/api/user/editprofile")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedUser);
  
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/length must be at least 3 characters long/i);
  });

  it("should return 409 if user already exists with the same email", async () => {
    // Create another test user with the same email as the original test user
    const user2 = new User({
      firstName: "user2",
      lastName: "testing",
      email: "user2@test.com",
      password: "password",
      phoneNumber: "0987654321",
      dateOfBirth: "1995-01-01",
      address: "Mumbai",
    });
    await user2.save();
  
    const updatedUser = {
      email: "user2@test.com"
    };

    const token = jwt.sign(
      { userId: user2._id, isAdmin: false },
      process.env.JWT_SECRET
    );
  
    const res = await request(app)
      .patch("/api/user/editprofile")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedUser);
  
    expect(res.status).toBe(409);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("User already exists with this email or phone number");
  
    // Delete the second test user
    await User.findByIdAndRemove(user2._id);
  });
});



describe("GET /api/user/viewprofile", () => {
  let user, token;

  beforeEach(async () => {
    // Create a test user
    user = new User({
      firstName: "user",
      lastName: "testing",
      email: "user@test.com",
      password: "password",
      phoneNumber: "1234567899",
      dateOfBirth: "1990-01-01",
      address: "Noida",
    });
    await user.save();

    // Generate JWT token for the user
    token = jwt.sign(
      { userId: user._id, isAdmin: false },
      process.env.JWT_SECRET
    );
  });

  afterEach(async () => {
    // Delete the test user from the database after running each test case
    await User.findByIdAndDelete(user._id);
  });

  it("should return 401 if user is not authenticated", async () => {
    const res = await request(app).get("/api/user/viewprofile");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Authentication failed");
  });

  it("should return the user's profile if the user is authenticated", async () => {
    const res = await request(app)
      .get("/api/user/viewprofile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe("Profile found successfully");
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user._id).toBe(user._id.toString());
    expect(res.body.data.user.firstName).toBe(user.firstName);
    expect(res.body.data.user.lastName).toBe(user.lastName);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.phoneNumber).toBe(user.phoneNumber);
    expect(res.body.data.user.dateOfBirth).toBe(user.dateOfBirth.toISOString());
    expect(res.body.data.user.address).toBe(user.address);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("should return 404 if the user's profile is not found", async () => {
    // Delete the test user to simulate profile not found
    await User.findByIdAndDelete(user._id);

    const res = await request(app)
      .get("/api/user/viewprofile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Profile not found");
  });

  it("should return 500 if there is an internal server error", async () => {
    // Pass an invalid ObjectId to User.findById() to trigger a server error
    const invalidId = "invalidObjectId";
    const token = jwt.sign(
      { userId: invalidId, isAdmin: false },
      process.env.JWT_SECRET
    );
  
    const res = await request(app)
      .get("/api/user/viewprofile")
      .set("Authorization", `Bearer ${token}`);
  
    expect(res.status).toBe(500);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Internal server error");
  });
});



describe("GET /api/user/:ID", () => {
  let adminUser, testUser, token;

  beforeEach(async () => {
    // Create a test admin user
    adminUser = new User({
      firstName: "Admin",
      lastName: "testing",
      email: "admin@test.com",
      password: "password",
      phoneNumber: "1234567899",
      dateOfBirth: "1990-01-01",
      address: "Noida",
      isAdmin: true,
    });
    await adminUser.save();

    // Create a test user
    testUser = new User({
      firstName: "Test",
      lastName: "User1",
      email: "test@test.com",
      password: "password",
      phoneNumber: "1234567898",
      dateOfBirth: "1990-01-01",
      address: "Delhi",
      isAdmin: false,
    });
    await testUser.save();

    // Generate an authentication token for the admin user
    token = jwt.sign(
      { userId: adminUser._id, isAdmin: true },
      process.env.JWT_SECRET
    );
  });

  afterEach(async () => {
    // Delete the test admin and user from the database after running each test case
    await User.findByIdAndDelete(adminUser._id);
    await User.findByIdAndDelete(testUser._id);
  });

  it("should return 401 if user is not authenticated", async () => {
    const res = await request(app).get(`/api/user/${testUser._id}`);
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Authentication failed");
  });

  it("should return 403 if user is not an admin", async () => {
    // Generate an authentication token for the test user
    const testToken = jwt.sign(
      { userId: testUser._id, isAdmin: false },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get(`/api/user/${testUser._id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Not authorized");
  });

  it("should return 404 if user ID is not in database", async () => {
    const invalidID = "643ced4bbed014a32c0bb247";

    const res = await request(app)
      .get(`/api/user/${invalidID}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Profile not found");
  });

  it("should return the user's profile if user is an admin and ID is valid", async () => {
    const res = await request(app)
      .get(`/api/user/${testUser._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe("Profile found successfully");
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user._id).toBe(testUser._id.toString());
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.phoneNumber).toBe(testUser.phoneNumber);
    expect(res.body.data.user.address).toBe(testUser.address);
  });
});


describe("GET /api/user/allusers", () => {
  let adminUser;

  beforeEach(async () => {
    // Create a test admin user
    adminUser = new User({
      firstName: "Admin",
      lastName: "testing",
      email: "admin@test.com",
      password: "password",
      phoneNumber: "1234567899",
      dateOfBirth: "1990-01-01",
      address: "Noida",
      isAdmin: true,
    });
    await adminUser.save();
  });

  afterEach(async () => {
    // Delete the test admin user from the database after running each test case
    await User.findByIdAndDelete(adminUser._id);
  });

  it("should return 401 if user is not authenticated", async () => {
    const res = await request(app).get("/api/user/allusers");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Authentication failed");
  });

  it("should return 403 if user is not an admin", async () => {
    // Create a test non-admin user
    const nonAdminUser = new User({
      firstName: "Non-Admin",
      lastName: "testing",
      email: "nonadmin@test.com",
      password: "password",
      phoneNumber: "1234567898",
      dateOfBirth: "1990-01-01",
      address: "Noida",
      isAdmin: false,
    });
    await nonAdminUser.save();

    const token = jwt.sign(
      { userId: nonAdminUser._id, isAdmin: false },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/api/user/allusers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Not authorized");

    // Delete the test non-admin user from the database
    await User.findByIdAndDelete(nonAdminUser._id);
  });

  it("should return all users if user is an admin", async () => {
    const token = jwt.sign(
      { userId: adminUser._id, isAdmin: true },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/api/user/allusers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe("Data fetch successfully");
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.users.length).toBeGreaterThan(0);
  });
});

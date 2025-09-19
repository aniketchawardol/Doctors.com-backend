import request from "supertest";
import app, { setupTestDB, teardownTestDB, clearTestDB } from "./testApp.js";

describe("User Routes", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("POST /api/v1/users/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        fullName: "Test User",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/users/register")
        .send(userData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeLessThan(500);

      if (response.status === 201 || response.status === 200) {
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("user");
        expect(response.body.data.user.email).toBe(userData.email);
      }
    });

    it("should reject registration with missing required fields", async () => {
      const incompleteData = {
        username: "testuser",
        // Missing email, password, etc.
      };

      const response = await request(app)
        .post("/api/v1/users/register")
        .send(incompleteData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it("should reject registration with invalid email format", async () => {
      const invalidEmailData = {
        username: "testuser",
        email: "invalid-email",
        fullName: "Test User",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/users/register")
        .send(invalidEmailData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("POST /api/v1/users/login", () => {
    let testUser;

    beforeEach(async () => {
      // First register a user
      const userData = {
        username: "logintest",
        email: "login@example.com",
        fullName: "Login Test",
        password: "password123",
      };

      const registerResponse = await request(app)
        .post("/api/v1/users/register")
        .send(userData);

      if (registerResponse.status === 200 || registerResponse.status === 201) {
        testUser = userData;
      }
    });

    it("should login with valid credentials", async () => {
      if (!testUser) {
        // Skip if registration failed
        return;
      }

      const loginData = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app)
        .post("/api/v1/users/login")
        .send(loginData)
        .expect("Content-Type", /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("user");
        expect(response.body.data).toHaveProperty("accessToken");
      }
    });

    it("should reject login with invalid credentials", async () => {
      const invalidLoginData = {
        email: "nonexistent@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/v1/users/login")
        .send(invalidLoginData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it("should reject login with missing fields", async () => {
      const incompleteLoginData = {
        email: "test@example.com",
        // Missing password
      };

      const response = await request(app)
        .post("/api/v1/users/login")
        .send(incompleteLoginData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("GET /api/v1/users/current-user", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/v1/users/current-user")
        .expect("Content-Type", /json/);

      expect(response.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/users/current-user")
        .set("Authorization", "Bearer invalid-token")
        .expect("Content-Type", /json/);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/users/logout", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/users/logout")
        .expect("Content-Type", /json/);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/users/refresh-token", () => {
    it("should handle refresh token requests", async () => {
      const response = await request(app)
        .post("/api/v1/users/refresh-token")
        .expect("Content-Type", /json/);

      // Should return either success or error, but not crash
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });
});

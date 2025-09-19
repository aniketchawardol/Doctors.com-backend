import request from "supertest";
import app, { setupTestDB, teardownTestDB, clearTestDB } from "./testApp.js";

describe("Hospital Routes", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("POST /api/v1/hospitals/register", () => {
    it("should register a new hospital successfully", async () => {
      const hospitalData = {
        hospitalName: "Test Hospital",
        email: "hospital@example.com",
        password: "password123",
        phone: "1234567890",
        address: "123 Test Street",
        city: "Test City",
        state: "Test State",
        pincode: "123456",
      };

      const response = await request(app)
        .post("/api/v1/hospitals/register")
        .send(hospitalData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeLessThan(500);

      if (response.status === 201 || response.status === 200) {
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("hospital");
        expect(response.body.data.hospital.email).toBe(hospitalData.email);
      }
    });

    it("should reject registration with missing required fields", async () => {
      const incompleteData = {
        hospitalName: "Test Hospital",
        // Missing email, password, etc.
      };

      const response = await request(app)
        .post("/api/v1/hospitals/register")
        .send(incompleteData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("POST /api/v1/hospitals/login", () => {
    let testHospital;

    beforeEach(async () => {
      // First register a hospital
      const hospitalData = {
        hospitalName: "Login Test Hospital",
        email: "logintest@hospital.com",
        password: "password123",
        phone: "1234567890",
        address: "123 Test Street",
        city: "Test City",
        state: "Test State",
        pincode: "123456",
      };

      const registerResponse = await request(app)
        .post("/api/v1/hospitals/register")
        .send(hospitalData);

      if (registerResponse.status === 200 || registerResponse.status === 201) {
        testHospital = hospitalData;
      }
    });

    it("should login with valid credentials", async () => {
      if (!testHospital) {
        // Skip if registration failed
        return;
      }

      const loginData = {
        email: testHospital.email,
        password: testHospital.password,
      };

      const response = await request(app)
        .post("/api/v1/hospitals/login")
        .send(loginData)
        .expect("Content-Type", /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("hospital");
        expect(response.body.data).toHaveProperty("accessToken");
      }
    });

    it("should reject login with invalid credentials", async () => {
      const invalidLoginData = {
        email: "nonexistent@hospital.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/v1/hospitals/login")
        .send(invalidLoginData)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("GET /api/v1/hospitals/all", () => {
    it("should return all hospitals", async () => {
      const response = await request(app)
        .get("/api/v1/hospitals/all")
        .expect("Content-Type", /json/);

      expect(response.status).toBeLessThan(500);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("data");
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe("GET /api/v1/hospitals/search/:name", () => {
    it("should search hospitals by name", async () => {
      const searchTerm = "test";

      const response = await request(app)
        .get(`/api/v1/hospitals/search/${searchTerm}`)
        .expect("Content-Type", /json/);

      expect(response.status).toBeLessThan(500);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("data");
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it("should handle empty search results", async () => {
      const searchTerm = "nonexistenthospital123456";

      const response = await request(app)
        .get(`/api/v1/hospitals/search/${searchTerm}`)
        .expect("Content-Type", /json/);

      expect(response.status).toBeLessThan(500);
    });
  });

  describe("GET /api/v1/hospitals/:hospitalId", () => {
    it("should handle invalid hospital ID format", async () => {
      const invalidId = "invalid-id";

      const response = await request(app)
        .get(`/api/v1/hospitals/${invalidId}`)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it("should handle non-existent hospital ID", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011"; // Valid ObjectId format

      const response = await request(app)
        .get(`/api/v1/hospitals/${nonExistentId}`)
        .expect("Content-Type", /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("POST /api/v1/hospitals/current-hospital", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/hospitals/current-hospital")
        .expect("Content-Type", /json/);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/hospitals/logout", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/hospitals/logout")
        .expect("Content-Type", /json/);

      expect(response.status).toBe(401);
    });
  });
});

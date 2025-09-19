import request from "supertest";
import app, { setupTestDB, teardownTestDB, clearTestDB } from "./testApp.js";

describe("Basic App Tests", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("GET /api/ping", () => {
    it("should return pong", async () => {
      const response = await request(app).get("/api/ping").expect(200);

      expect(response.body).toEqual({
        message: "pong",
      });
    });
  });

  describe("CORS Configuration", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await request(app)
        .options("/api/ping")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");

      expect(response.status).toBe(204);
    });
  });

  describe("JSON Parsing", () => {
    it("should parse JSON bodies correctly", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "password123",
        })
        .set("Content-Type", "application/json");

      // Should not return a JSON parsing error
      expect(response.status).not.toBe(400);
    });

    it("should reject JSON bodies larger than 16kb", async () => {
      const largePayload = {
        data: "x".repeat(17 * 1024), // 17kb
      };

      const response = await request(app)
        .post("/api/v1/users/register")
        .send(largePayload)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(413); // Payload Too Large
    });
  });
});

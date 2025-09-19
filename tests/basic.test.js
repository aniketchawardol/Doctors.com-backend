import request from "supertest";
import { app } from "../src/app.js";

describe("Basic API Tests (No Database)", () => {
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

      // CORS preflight should return 204 or allow the request
      expect([200, 204]).toContain(response.status);
    });
  });

  describe("JSON Parsing", () => {
    it("should handle POST requests with JSON", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .set("Content-Type", "application/json");

      // Should not return a JSON parsing error
      expect(response.status).not.toBe(400);
      // Should be a server error or validation error, not parsing error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject malformed JSON", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });

  describe("Route Mounting", () => {
    it("should have user routes mounted", async () => {
      const response = await request(app).post("/api/v1/users/login").send({});

      // Route should exist (not return 404)
      expect(response.status).not.toBe(404);
    });

    it("should have hospital routes mounted", async () => {
      const response = await request(app).get("/api/v1/hospitals/all");

      // Route should exist (not return 404)
      expect(response.status).not.toBe(404);
    });

    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/nonexistent/route");

      expect(response.status).toBe(404);
    });
  });

  describe("Authentication Middleware", () => {
    it("should require authentication for protected user routes", async () => {
      const response = await request(app).get("/api/v1/users/current-user");

      expect(response.status).toBe(401);
    });

    it("should require authentication for protected hospital routes", async () => {
      const response = await request(app).post(
        "/api/v1/hospitals/current-hospital"
      );

      expect(response.status).toBe(401);
    });

    it("should reject invalid tokens", async () => {
      const response = await request(app)
        .get("/api/v1/users/current-user")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });
});

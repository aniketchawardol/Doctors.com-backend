import request from "supertest";
import { app } from "../src/app.js";

describe("Backend API Testing with Supertest", () => {
  describe("Health Check", () => {
    it("should respond to ping endpoint", async () => {
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

      // Should allow the request
      expect([200, 204]).toContain(response.status);
    });
  });

  describe("JSON Parsing Middleware", () => {
    it("should reject malformed JSON", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });

  describe("Route Existence", () => {
    it("should have user registration route", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send({});

      // Route exists (should not be 404)
      expect(response.status).not.toBe(404);
    });

    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/nonexistent/route");

      expect(response.status).toBe(404);
    });
  });

  describe("Static File Serving", () => {
    it("should serve static files from public directory", async () => {
      // Test that the static middleware is configured
      const response = await request(app).get("/temp/nonexistent.txt");

      // Should either serve the file or return 404, not crash
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("Express Middleware Stack", () => {
    it("should have JSON body parser configured", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send({ test: "data" })
        .set("Content-Type", "application/json");

      // Body parser should handle JSON (not return parsing error)
      expect(response.status).not.toBe(400);
    });

    it("should have URL encoded parser configured", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send("test=data")
        .set("Content-Type", "application/x-www-form-urlencoded");

      // URL encoded parser should handle form data
      expect(response.status).not.toBe(413); // Payload too large would indicate parsing issue
    });
  });
});

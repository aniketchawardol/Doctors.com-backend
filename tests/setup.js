import dotenv from "dotenv";

// Load test environment variables
dotenv.config({
  path: "./.env.test",
});

// Set default test environment variables if not provided
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "3001";
process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/doctors_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || "1d";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "test-refresh-secret";
process.env.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "10d";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Suppress console.log during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

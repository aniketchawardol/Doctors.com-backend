import { app } from "../src/app.js";

// Mock database functions for testing
export const setupTestDB = async () => {
  // Mock database setup - no actual connection needed for basic tests
  console.log("Mock: Test database setup complete");
  return Promise.resolve();
};

export const teardownTestDB = async () => {
  // Mock database teardown
  console.log("Mock: Test database teardown complete");
  return Promise.resolve();
};

export const clearTestDB = async () => {
  // Mock database clearing
  console.log("Mock: Test database cleared");
  return Promise.resolve();
};

export default app;

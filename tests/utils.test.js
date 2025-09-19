import { ApiError } from "../src/utils/ApiError.js";
import { ApiResponse } from "../src/utils/ApiResponse.js";
import { asyncHandler } from "../src/utils/asyncHandler.js";

describe("Utility Functions", () => {
  describe("ApiError", () => {
    it("should create ApiError with correct properties", () => {
      const error = new ApiError(400, "Test error message");

      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Test error message");
      expect(error.success).toBe(false);
      expect(error.data).toBe(null);
      expect(Array.isArray(error.errors)).toBe(true);
    });

    it("should create ApiError with custom errors", () => {
      const customErrors = ["Error 1", "Error 2"];

      const error = new ApiError(422, "Validation error", customErrors);

      expect(error.statusCode).toBe(422);
      expect(error.message).toBe("Validation error");
      expect(error.data).toBe(null); // Always null in the implementation
      expect(error.errors).toEqual(customErrors);
    });

    it("should create ApiError with default message", () => {
      const error = new ApiError(500);

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Something went wrong");
      expect(error.success).toBe(false);
    });
  });

  describe("ApiResponse", () => {
    it("should create ApiResponse with custom message", () => {
      const data = { user: { id: 1, name: "Test User" } };
      const response = new ApiResponse(
        200,
        data,
        null,
        "User fetched successfully"
      );

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual(data);
      expect(response.message).toBe("User fetched successfully");
      expect(response.success).toBe(true);
    });

    it("should create ApiResponse with default message", () => {
      const data = { count: 5 };
      const response = new ApiResponse(201, data);

      expect(response.statusCode).toBe(201);
      expect(response.data).toEqual(data);
      expect(response.message).toBe("Success");
      expect(response.success).toBe(true);
    });

    it("should set success to false for error status codes", () => {
      const response = new ApiResponse(400, null, null, "Bad Request");

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
    });
  });

  describe("asyncHandler", () => {
    it("should handle successful async function", async () => {
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      const asyncFunction = async (req, res) => {
        res.status(200).json({ message: "Success" });
      };

      const wrappedFunction = asyncHandler(asyncFunction);
      await wrappedFunction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Success" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle async function errors", async () => {
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      const errorMessage = "Test error";
      const asyncFunction = async () => {
        throw new Error(errorMessage);
      };

      const wrappedFunction = asyncHandler(asyncFunction);
      await wrappedFunction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });

    it("should handle validation errors with 400 status", async () => {
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";

      const asyncFunction = async () => {
        throw validationError;
      };

      const wrappedFunction = asyncHandler(asyncFunction);
      await wrappedFunction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
      });
    });
  });
});

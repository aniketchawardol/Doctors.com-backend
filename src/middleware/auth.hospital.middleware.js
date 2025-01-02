import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { Hospital } from "../models/hospital.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const hospital = await Hospital.findById(decodedToken?._id).select(
      "-password -refreshToken"
    )
    .populate({
      path:"patients",
      select: "-password -refreshToken -hospitals -hiddenreports"
    });

    if (!hospital) {
      throw new ApiError(404, "Hospital not found");
    }

    req.user = hospital;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "invalid access token");
  }
});

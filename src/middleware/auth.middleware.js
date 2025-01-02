import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { Patient } from "../models/patient.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    const user = await Patient.findById(decodedToken?._id).select("-password -refreshToken").populate({path: "hospitals", select: "-password -refreshToken -patients -otherphotos "});
    
    if(!user) {
      throw new ApiError(404, "User not found");
    }
  
    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error.message || "invalid access token");
    
  }
});

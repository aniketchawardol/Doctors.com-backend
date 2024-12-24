import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Patient } from "../models/patient.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from 'fs';
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password } = req.body;
  if ([fullname, email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "fullname, email and password are required");
  }

  const existedUser = await Patient.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with same email already exists");
  }

  const profilephotolocalpath = req.files?.profilephoto[0]?.path;
  let uploadedPhoto;
  if (profilephotolocalpath) {
    uploadedPhoto = await uploadOnCloudinary(profilephotolocalpath);
    fs.unlinkSync(profilephotolocalpath);
  }
 const patient = await Patient.create({
    fullname,
    email,
    password,
    profilephoto: uploadedPhoto?.url || "",
  });

  const createdPatient = await Patient.findById(patient._id).select("-password -refreshToken");

  if (!createdPatient) {
    throw new ApiError(500, "Error creating user");
  }

  return res.status(201).json(new ApiResponse(201, createdPatient, "User created successfully"));
});

export { registerUser };

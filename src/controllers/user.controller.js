import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Patient } from "../models/patient.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await Patient.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating token");
  }
};

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
  }
  const patient = await Patient.create({
    fullname,
    email,
    password,
    profilephoto: uploadedPhoto?.url || "",
  });

  const createdPatient = await Patient.findById(patient._id).select(
    "-password -refreshToken"
  );

  if (!createdPatient) {
    throw new ApiError(500, "Error creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdPatient, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ([email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "email and password are required");
  }

  const user = await Patient.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.verifyPassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );

  const loggedInUser = await Patient.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await Patient.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  
    const user = await Patient.findById(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid user");
    }
  
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "expired refresh token");
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    const { accessToken, newrefreshToken } = await generateAccessandRefreshToken(
      user._id
    );
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(new ApiResponse(200, { accessToken, newrefreshToken },
        "Access token refreshed successfully"
      ));
  } catch (error) {
    throw new ApiError(401, error.message);
    
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };

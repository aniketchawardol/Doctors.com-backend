import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Patient } from "../models/patient.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
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

  const profilephotolocalpath = req.file?.path;
  let uploadedPhoto;
  if (profilephotolocalpath) {
    uploadedPhoto = await uploadOnCloudinary(profilephotolocalpath);
  }
  const user = await Patient.create({
    fullname,
    email,
    password,
    profilephoto: uploadedPhoto?.url || "",
  });

  const createdUser = await Patient.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
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
    sameSite: 'None',          // allows cross-site requests
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    sameSite: 'None',       
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

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
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None',          
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    };

    const { accessToken, refreshToken } =
      await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullname, email, phonenumber, dob, bloodgroup, gender } = req.body;

  if ([fullname, email].some((field) => field.trim() === "")) {
    throw new ApiError(400, "fullname, email are required");
  }

  const profilephotolocalpath = req.file?.path;

  let uploadedPhoto;

  const existedUser = await Patient.findById(req.user._id);

  if (!existedUser) {
    throw new ApiError(404, "User not found");
  }

  if (profilephotolocalpath) {
    if (existedUser.profilephoto) {
      await deleteFromCloudinary(existedUser.profilephoto);
    }
    uploadedPhoto = await uploadOnCloudinary(profilephotolocalpath);
  }

  const user = await Patient.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email,
        phonenumber,
        dob,
        bloodgroup,
        gender,
        profilephoto: uploadedPhoto?.url || existedUser.profilephoto,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User updated successfully"));
});

const uploadReports = asyncHandler(async (req, res) => {
  const existedUser = await Patient.findById(req.user._id);

  if (!existedUser) {
    throw new ApiError(404, "User not found");
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }
  
  const reportslocalpath = req.files.map((file) => file.path);

  const uploadedReports = [];

  for (const report of reportslocalpath) {
    const uploadedReport = await uploadOnCloudinary(report);
    uploadedReports.push(uploadedReport.url);
  }

  const user = await Patient.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        reports: uploadedReports,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Reports uploaded successfully"));
});

const uploadHiddenReports = asyncHandler(async (req, res) => {
  const existedUser = await Patient.findById(req.user._id);

  if (!existedUser) {
    throw new ApiError(404, "User not found");
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const reportslocalpath = req.files.map((file) => file.path);

  const uploadedReports = [];

  for (const report of reportslocalpath) {
    const uploadedReport = await uploadOnCloudinary(report);
    uploadedReports.push(uploadedReport.url);
  }

  const user = await Patient.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        hiddenreports: uploadedReports,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Reports uploaded successfully"));
});

const deleteReports = asyncHandler(async (req, res) => {
  const existedUser = await Patient.findById(req.user._id);

  if(!existedUser) {
    throw new ApiError(404, "User not found");
  }

  const { reportUrls } = req.body;

  if(!reportUrls || reportUrls.length === 0) {
    throw new ApiError(400, "No reports to delete");
  }

  reportUrls.forEach(async (reportUrl) => {
    await deleteFromCloudinary(reportUrl);
  });

  const user = await Patient.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        reports: { $in: reportUrls },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Reports deleted successfully"));
});

const deleteHiddenReports = asyncHandler(async (req, res) => {
  const existedUser = await Patient.findById(req.user._id);

  if(!existedUser) {
    throw new ApiError(404, "User not found");
  }

  const { reportUrls } = req.body;

  if(!reportUrls || reportUrls.length === 0) {
    throw new ApiError(400, "No reports to delete");
  }

  reportUrls.forEach(async (reportUrl) => {
    await deleteFromCloudinary(reportUrl);
  });

  const user = await Patient.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        hiddenreports: { $in: reportUrls },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Reports deleted successfully"));
});


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateUserProfile,
  uploadReports,
  uploadHiddenReports,
  deleteReports,
  deleteHiddenReports,
};

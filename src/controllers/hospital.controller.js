import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Hospital } from "../models/hospital.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Patient } from "../models/patient.model.js";

const generateAccessandRefreshToken = async (hospitalId) => {
  try {
    const hospital = await Hospital.findById(hospitalId);
    const accessToken = hospital.generateAccessToken();
    const refreshToken = hospital.generateRefreshToken();

    hospital.refreshToken = refreshToken;
    await hospital.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating token");
  }
};

const registerHospital = asyncHandler(async (req, res) => {
  const { 
    hospitalname, 
    email, 
    password, 
    helplinenumbers,
    specializations,
    openingtime,
    closingtime,
    description,
    location 
  } = req.body;

  if ([hospitalname, email, password, location].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Required fields missing");
  }

  if (!helplinenumbers || helplinenumbers.length === 0) {
    throw new ApiError(400, "At least one helpline number required");
  }

  const existedHospital = await Hospital.findOne({ email });

  if (existedHospital) {
    throw new ApiError(409, "Hospital with same email already exists");
  }

  const profilephotolocalpath = req.files?.profilephoto[0]?.path;
  let uploadedPhoto;
  if (profilephotolocalpath) {
    uploadedPhoto = await uploadOnCloudinary(profilephotolocalpath);
  }

  const hospital = await Hospital.create({
    hospitalname,
    email,
    password,
    helplinenumbers,
    specializations: specializations || [],
    openingtime,
    closingtime,
    description,
    location,
    profilephoto: uploadedPhoto?.url || "",
  });

  const createdHospital = await Hospital.findById(hospital._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdHospital, "Hospital registered successfully"));
});

const loginHospital = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim()) {
    throw new ApiError(400, "Email and password are required");
  }

  const hospital = await Hospital.findOne({ email });

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  const isMatch = await hospital.verifyPassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    hospital._id
  );

  const loggedInHospital = await Hospital.findById(hospital._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',          
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          hospital: loggedInHospital,
          accessToken,
        },
        "Hospital logged in successfully"
      )
    );
});

const logoutHospital = asyncHandler(async (req, res) => {
  await Hospital.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
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
    .json(new ApiResponse(200, {}, "Hospital logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const hospital = await Hospital.findById(decodedToken?._id);

    if (!hospital) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== hospital?.refreshToken) {
      throw new ApiError(401, "Refresh token expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None',        
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    };

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(hospital._id);

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

const getCurrentHospital = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Hospital fetched successfully"));
});

const updateHospitalProfile = asyncHandler(async (req, res) => {
  const {
    hospitalname,
    email,
    helplinenumbers,
    specializations,
    openingtime,
    closingtime,
    description,
    location
  } = req.body;

  if ([hospitalname, email].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Hospital name and email are required");
  }

  const profilephotolocalpath = req.file?.path;
  let uploadedPhoto;

  const existedHospital = await Hospital.findById(req.user._id);

  if (!existedHospital) {
    throw new ApiError(404, "Hospital not found");
  }

  if (profilephotolocalpath) {
    if (existedHospital.profilephoto) {
      await deleteFromCloudinary(existedHospital.profilephoto);
    }
    uploadedPhoto = await uploadOnCloudinary(profilephotolocalpath);
  }

  const hospital = await Hospital.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        hospitalname,
        email,
        helplinenumbers: helplinenumbers || existedHospital.helplinenumbers,
        specializations: specializations || existedHospital.specializations,
        openingtime: openingtime || existedHospital.openingtime,
        closingtime: closingtime || existedHospital.closingtime,
        description: description || existedHospital.description,
        location: location || existedHospital.location,
        profilephoto: uploadedPhoto?.url || existedHospital.profilephoto,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, hospital, "Hospital profile updated successfully"));
});

const uploadOtherPhotos = asyncHandler(async (req, res) => {
  const existedHospital = await Hospital.findById(req.user._id);

  if (!existedHospital) {
    throw new ApiError(404, "Hospital not found");
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const photoslocalpath = req.files.map((file) => file.path);
  const uploadedPhotos = [];

  for (const photo of photoslocalpath) {
    const uploadedPhoto = await uploadOnCloudinary(photo);
    uploadedPhotos.push(uploadedPhoto.url);
  }

  const hospital = await Hospital.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        otherphotos: { $each: uploadedPhotos },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, hospital, "Photos uploaded successfully"));
});

const deletePhotos = asyncHandler(async (req, res) => {
  const existedHospital = await Hospital.findById(req.user._id);

  if (!existedHospital) {
    throw new ApiError(404, "Hospital not found");
  }

  const { photoUrls } = req.body;

  if (!photoUrls || photoUrls.length === 0) {
    throw new ApiError(400, "No photos to delete");
  }

  photoUrls.forEach(async (photoUrl) => {
    await deleteFromCloudinary(photoUrl);
  });

  const hospital = await Hospital.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        otherphotos: { $in: photoUrls },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, hospital, "Photos deleted successfully"));
});

const getAllHospitals = asyncHandler(async (req, res) => {
  const { page , limit  } = req.query;

  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 10;

  const totalCount = await Hospital.countDocuments();
  
  const hospitals = await Hospital.aggregate([
    {
      $project: {
        password: 0,
        refreshToken: 0
      }
    }
  ]).skip((p - 1) * l).limit(l);



  return res
    .status(200)
    .json(new ApiResponse(200, hospitals, totalCount, "Hospitals fetched successfully"));
});

const getHospitalsByName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 10;

  const hospitals = await Hospital.aggregate([
    {
      $match: {
        hospitalname: new RegExp(name, 'i')
      }
    },
    {
      $project: {
        password: 0,
        refreshToken: 0
      }
    }
  ]).skip((p - 1) * l).limit(l);

  const totalCount = hospitals.length;

  return res
    .status(200)
    .json(new ApiResponse(200, hospitals, totalCount, "Hospitals fetched successfully"));
});

const getHospitalById = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;

  const hospital = await Hospital.findById(hospitalId).select("-password -refreshToken -patients");

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, hospital, "Hospital fetched successfully"));
});

const addPatient = asyncHandler(async (req, res) => {
  const { hospitalId } = req.body;

  const existedHospital = await Hospital.findById(hospitalId);

  if (!existedHospital) {
    throw new ApiError(404, "Hospital not found");
  }

  const patient = await Patient.findById(req.user._id);

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const hospital = await Hospital.findByIdAndUpdate(
    hospitalId,
    {
      $addToSet: {
        patients: req.user._id,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  await Patient.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: {
        hospitals: hospitalId,
      },
    },
  )

  return res
    .status(200)
    .json(new ApiResponse(200, hospital, "Patient added successfully"));
});

export {
  registerHospital,
  loginHospital,
  logoutHospital,
  refreshAccessToken,
  getCurrentHospital,
  updateHospitalProfile,
  uploadOtherPhotos,
  deletePhotos,
  getAllHospitals,
  getHospitalsByName,
  getHospitalById,
  addPatient,
};
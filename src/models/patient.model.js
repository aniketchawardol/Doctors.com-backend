/*
Patients:
1]Name
2]Phone number
3]Profile photo
4]Reports
5]hidden Reports
6]hosptials
6]DOB
7]Blood group
8]Gender
9]email
*/

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const patientSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phonenumber: {
      type: String,
      trim: true,
    },
    profilephoto: {
      type: String, //cloudinary url
    },
    reports: {
      type: [String], //cloudinary url
    },
    hiddenreports: {
      type: [String], //cloudinary url
    },
    hospitals: [
      {
        type: Schema.Types.ObjectId,
        ref: "Hospital",
      },
    ],
    dob: {
      type: String,
    },
    bloodgroup: {
      type: String,
    },
    gender: {
      type: String,
    },
    refreshToken: {
      type: String
  }
  },
  {
    timestamps: true,
  }
);

patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

patientSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

patientSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

patientSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const Patient = mongoose.model("Patient", patientSchema);

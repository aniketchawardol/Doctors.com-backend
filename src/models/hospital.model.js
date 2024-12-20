/*Hospitals/labs:
1]Name & Username
2]Helpline numbers
4]Specializations/Tests available
5]Opening and closing times
6]Profile photo
7]Description
8]Other photos
9]patients 
10]location
11]email
12]password

*/

import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const hospitalSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hospitalname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    profilephoto: {
      type: String, //cloudinary url
      required: true,
    },
    otherphotos: {
      type: [String], //cloudinary url
    },
    helplinenumbers: {
      type: [String],
      required: true,
    },
    specializations: {
      type: [String],
      required: true,
    },
    openingtime: {
      type: String,
      required: true,
    },
    closingtime: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    patients: [{
      type: Schema.Types.ObjectId,
      ref: "Patient",
    }],
    location: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

hospitalSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

hospitalSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

hospitalSchema.plugin(mongooseAggregatePaginate);

hospitalSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id,
    email: this.email,
   }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

hospitalSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const Hospital = mongoose.model("Hospital", hospitalSchema);

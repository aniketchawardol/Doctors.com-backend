import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  getCurrentUser,
  updateUserProfile,
  uploadHiddenReports,
  uploadReports,
  deleteReports,
  deleteHiddenReports
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "profilephoto",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/refresh-token").post(refreshAccessToken);

router
  .route("/update-profile")
  .post(verifyJWT, upload.single("profilephoto"), updateUserProfile);

router
  .route("/upload-reports")
  .post(verifyJWT, upload.array("reports", 10), uploadReports);

router
  .route("/upload-hidden-reports")
  .post(verifyJWT, upload.array("hiddenreports", 10), uploadHiddenReports);

router.route("/delete-reports").post(verifyJWT, deleteReports);

router.route("/delete-hidden-reports").post(verifyJWT, deleteHiddenReports);
export default router;


import { Router } from 'express';
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.hospital.middleware.js";
import {
  registerHospital,
  loginHospital,
  logoutHospital,
  refreshAccessToken,
  getCurrentHospital,
  updateHospitalProfile,
  uploadOtherPhotos,
  deletePhotos,
  getAllHospitals,
  getHospitalsByLocation,
  getHospitalById
} from "../controllers/hospital.controller.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "profilephoto",
      maxCount: 1,
    },
  ]),
  registerHospital
);

router.route("/login").post(loginHospital);
router.route("/logout").post(verifyJWT, logoutHospital);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-hospital").post(verifyJWT, getCurrentHospital);
router.route("/all").get(getAllHospitals);
router.route("/location/:location").get(getHospitalsByLocation);
router.route("/:hospitalId").get(getHospitalById);

router
  .route("/update-profile")
  .post(verifyJWT, upload.single("profilephoto"), updateHospitalProfile);

router
  .route("/upload-photos")
  .post(verifyJWT, upload.array("photos", 10), uploadOtherPhotos);

router.route("/delete-photos").post(verifyJWT, deletePhotos);

export default router;